// Supabase Edge Function: analyze-system-dynamics (STAGE 1 / 2)
//
// 이전에는 STEP 5~9를 한 번의 Claude 호출로 생성했으나, 보고서 콘텐츠가 늘어나면서
// 응답 생성 시간이 Supabase Edge Function 게이트웨이의 타임아웃을 초과해 504 오류가
// 발생했다. 이를 해결하기 위해 두 단계로 분리했다:
//
//   STAGE 1 (이 함수): 문제구조/진단 파트
//     5. 시스템 다이내믹스 분석 (problem_statement, category_reports[9개 영역 전체],
//        problem_structure[개요/파트별 분석/종합의견], key_variables, causal_relationships,
//        reinforcing/balancing_loops, system_archetype_candidates, leverage_points 요약,
//        management_implications)
//     6. AI 심층질문 10~15개
//     7. 인과순환지도 (nodes/edges, R1·R2/B1·B2 루프)
//
//   STAGE 2 (generate-leverage-actions 함수, 별도 배포): 실행 파트
//     8. 레버리지 포인트 3~5개
//     9. 90일 실행계획
//
// 클라이언트는 STAGE 1 완료 후 STAGE 2를 순차 호출한다 (src/services/systemDynamics.ts).
//
// 배포: supabase functions deploy analyze-system-dynamics
// 시크릿: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY는 Supabase가 자동으로 주입한다.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ANTHROPIC_MODEL = 'claude-sonnet-5'

const TOOL_SCHEMA = {
  name: 'submit_diagnosis_structure',
  description:
    '중소기업 경영진단의 문제구조 분석 결과(영역별 진단, 구조화된 문제분석, 인과순환지도, 심층질문)를 구조화된 형태로 제출한다.',
  input_schema: {
    type: 'object',
    properties: {
      problem_statement: {
        type: 'string',
        description: '보고서 서두에 실릴 핵심 문제 한 줄 요약(1~2문장, 헤드라인 성격)',
      },
      category_reports: {
        type: 'array',
        description:
          '9개 진단영역(ST,CM,MS,PS,OP,FI,HR,LE,DX) 전체에 대해 반드시 하나씩, 총 9개 작성. 취약영역(하위 3개)은 250~350자로 원인·근거·시사점을 포함해 깊이 있게, 나머지 6개는 120~180자로 현재 수준에 대한 평가와 근거를 서술.',
        items: {
          type: 'object',
          properties: {
            category_code: { type: 'string', enum: ['ST', 'CM', 'MS', 'PS', 'OP', 'FI', 'HR', 'LE', 'DX'] },
            narrative: { type: 'string' },
          },
          required: ['category_code', 'narrative'],
        },
      },
      problem_structure: {
        type: 'object',
        description:
          '문제구조 분석을 서술형 한 덩어리가 아니라 파트로 나누어 작성. 맥킨지 보고서 스타일로 구조화할 것.',
        properties: {
          overview: {
            type: 'string',
            description: '전체 문제구조를 개관하는 도입부, 150~250자',
          },
          parts: {
            type: 'array',
            description: '취약영역/핵심 이슈별로 3~5개 파트로 분리. 각 파트는 독립된 소제목을 가진 섹션.',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: '예: "마케팅·영업 구조의 매출-수익성 역설"' },
                related_categories: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '이 파트와 관련된 진단영역 코드 1~3개',
                },
                narrative: { type: 'string', description: '250~400자, 데이터 근거(점수, 응답)를 인용' },
              },
              required: ['title', 'related_categories', 'narrative'],
            },
          },
          synthesis: {
            type: 'string',
            description: '모든 파트를 종합하는 통합적 분석 의견, 200~300자. 근본 원인과 개선 방향을 제시.',
          },
        },
        required: ['overview', 'parts', 'synthesis'],
      },
      key_variables: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            category_code: { type: 'string' },
          },
          required: ['name', 'description'],
        },
      },
      causal_relationships: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            target: { type: 'string' },
            polarity: { type: 'string', enum: ['+', '-'] },
            delay_exists: { type: 'boolean' },
            description: { type: 'string' },
            confidence_score: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['source', 'target', 'polarity', 'delay_exists', 'description', 'confidence_score'],
        },
      },
      reinforcing_loops: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '예: R1, R2' },
            name: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
          },
          required: ['id', 'name', 'variables', 'description'],
        },
      },
      balancing_loops: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '예: B1, B2' },
            name: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
          },
          required: ['id', 'name', 'variables', 'description'],
        },
      },
      system_archetype_candidates: { type: 'array', items: { type: 'string' } },
      leverage_points_summary: {
        type: 'array',
        items: { type: 'string' },
        description: '레버리지 포인트 방향성 요약 3~5개 (상세 내용은 STAGE 2에서 별도 생성)',
      },
      management_implications: { type: 'string' },
      deep_questions: {
        type: 'array',
        description: '10~15개',
        items: {
          type: 'object',
          properties: {
            question_text: { type: 'string' },
            purpose: {
              type: 'string',
              description:
                '문제의 시간적 변화 확인 / 핵심 변수 간 인과관계 검증 / 피드백 루프 확인 / 시간지연 확인 / 의도하지 않은 정책 부작용 확인 / 시스템 원형 탐색 중 하나',
            },
            related_variable: { type: 'string' },
          },
          required: ['question_text', 'purpose'],
        },
      },
      causal_loop_diagram: {
        type: 'object',
        properties: {
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                category_code: { type: 'string' },
              },
              required: ['id', 'label'],
            },
          },
          edges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source: { type: 'string', description: 'node id' },
                target: { type: 'string', description: 'node id' },
                polarity: { type: 'string', enum: ['+', '-'] },
                delay_exists: { type: 'boolean' },
              },
              required: ['source', 'target', 'polarity', 'delay_exists'],
            },
          },
        },
        required: ['nodes', 'edges'],
      },
    },
    required: [
      'problem_statement',
      'category_reports',
      'problem_structure',
      'key_variables',
      'causal_relationships',
      'reinforcing_loops',
      'balancing_loops',
      'system_archetype_candidates',
      'leverage_points_summary',
      'management_implications',
      'deep_questions',
      'causal_loop_diagram',
    ],
  },
}

function buildPrompt(context: Record<string, unknown>) {
  return `당신은 맥킨지(McKinsey) 스타일의 경영컨설팅 보고서를 작성하는, 시스템 다이내믹스
방법론에 정통한 시니어 파트너입니다. 아래는 한 중소기업의 경영진단(Quick Diagnosis)
데이터입니다. 이 데이터를 근거로 submit_diagnosis_structure 도구를 호출하여, 그대로
경영진 보고서에 실릴 수 있는 수준의 깊이 있고 근거 기반의 결과를 제출하세요.

이번 호출에서는 "문제구조 분석" 파트만 작성합니다 (레버리지 포인트/실행계획은 다음
단계에서 별도로 작성되므로 이번에는 방향성 요약(leverage_points_summary)만 간단히
제시하면 됩니다).

문체·품질 요구사항 (가장 중요):
- 절대 일반론이나 뻔한 조언을 쓰지 말 것. 반드시 survey_responses의 구체적 진단 차원
  (diagnosis_dimension)과 점수, all_category_scores의 실제 순위/점수를 인용하며 서술할 것.
- 문장은 컨설팅 보고서체("~로 나타난다", "~로 판단된다", "~가 요구된다")로 작성하고,
  근거 → 해석 → 시사점의 3단 논리 구조를 각 문단에 담을 것.
- 지정된 글자 수 범위를 최대한 채울 것 (짧게 쓰지 말 것).

항목별 요구사항:
- category_reports: 9개 진단영역 전부 빠짐없이 작성 (ST, CM, MS, PS, OP, FI, HR, LE, DX).
  취약영역(하위 3개)은 250~350자로 원인·근거·시사점 포함, 나머지 6개는 120~180자.
- problem_structure: overview(150~250자) → parts(3~5개, 각 250~400자, 취약영역/핵심이슈별로
  분리하고 반드시 서로 다른 related_categories를 가질 것) → synthesis(200~300자, 모든
  파트를 하나의 인과구조로 통합하는 결론적 의견).
- key_variables/causal_relationships: causal_relationships의 source/target은 key_variables의
  name과 정확히 일치시킬 것.
- causal_loop_diagram.nodes.id는 causal_relationships에서 사용한 변수명을 슬러그화한 값으로,
  edges.source/target은 그 node id를 참조할 것.
- reinforcing_loops/balancing_loops는 causal_loop_diagram의 edges로 실제로 구성 가능한
  순환 구조여야 함.
- deep_questions는 10~15개, 6가지 목적(시간적 변화, 인과관계 검증, 피드백 루프, 시간지연,
  정책 부작용, 시스템 원형)을 고르게 포함할 것.
- 모든 텍스트는 한국어로 작성할 것.

[진단 데이터]
${JSON.stringify(context, null, 2)}`
}

// Claude가 깊게 중첩된 객체/배열 필드를 이중 인코딩된 JSON 문자열로 반환하는
// 경우가 있어(도구 호출 스키마가 복잡할 때 관찰됨), 저장 전에 방어적으로 파싱한다.
export function coerceJson<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return (value as T) ?? fallback
}

function slugify(name: string, index: number) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return base || `var_${index}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { assessmentId } = await req.json()
    if (!assessmentId) {
      return new Response(JSON.stringify({ error: 'assessmentId is required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*, company:companies(*)')
      .eq('id', assessmentId)
      .single()
    if (assessmentError || !assessment) {
      return new Response(JSON.stringify({ error: '진단 정보를 찾을 수 없습니다.' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { data: results } = await supabase
      .from('diagnosis_results')
      .select('*, category:categories(*)')
      .eq('assessment_id', assessmentId)
      .order('rank', { ascending: true })

    const { data: responseRows } = await supabase
      .from('responses')
      .select('score, question:questions(question_text, diagnosis_dimension, category_id)')
      .eq('assessment_id', assessmentId)

    const { data: categories } = await supabase.from('categories').select('*')
    const categoryById = new Map((categories ?? []).map((c: any) => [c.id, c]))

    const { data: kb } = await supabase
      .from('causal_relationships')
      .select('*')
      .or(`industry.eq.${assessment.company.industry},industry.is.null`)

    const context = {
      company: {
        name: assessment.company.company_name,
        industry: assessment.company.industry,
        sub_industry: assessment.company.sub_industry,
        revenue_range: assessment.company.revenue_range,
        employee_range: assessment.company.employee_range,
        growth_stage: assessment.company.growth_stage,
        main_products: assessment.company.main_products,
        key_challenge: assessment.company.key_challenge,
      },
      overall_score: assessment.overall_score,
      weakest_categories: (results ?? []).slice(0, 3).map((r: any) => ({
        category: r.category.name,
        normalized_score: r.normalized_score,
        severity_level: r.severity_level,
      })),
      all_category_scores: (results ?? []).map((r: any) => ({
        category: r.category.name,
        normalized_score: r.normalized_score,
        rank: r.rank,
      })),
      survey_responses: (responseRows ?? []).map((r: any) => ({
        category: categoryById.get(r.question.category_id)?.name,
        dimension: r.question.diagnosis_dimension,
        question: r.question.question_text,
        score: r.score,
      })),
      causal_relationship_knowledge_base: (kb ?? []).map((k: any) => ({
        source: k.source_dimension,
        target: k.target_dimension,
        polarity: k.polarity,
        delay_exists: k.delay_exists,
        description: k.relationship_description,
      })),
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 16000,
        tools: [TOOL_SCHEMA],
        tool_choice: { type: 'tool', name: 'submit_diagnosis_structure' },
        messages: [{ role: 'user', content: buildPrompt(context) }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      return new Response(JSON.stringify({ error: `Anthropic API 오류: ${errText}` }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const anthropicJson = await anthropicRes.json()

    if (anthropicJson.stop_reason === 'max_tokens') {
      return new Response(
        JSON.stringify({
          error: 'AI 응답이 토큰 한도를 초과해 잘렸습니다. 다시 시도해 주세요.',
        }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const toolUse = anthropicJson.content?.find((block: any) => block.type === 'tool_use')
    if (!toolUse) {
      return new Response(JSON.stringify({ error: 'AI 응답에서 분석 결과를 찾을 수 없습니다.' }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const result = toolUse.input as {
      problem_statement: string
      category_reports: { category_code: string; narrative: string }[]
      problem_structure: {
        overview: string
        parts: { title: string; related_categories: string[]; narrative: string }[]
        synthesis: string
      }
      key_variables: { name: string; description: string; category_code?: string }[]
      causal_relationships: unknown[]
      reinforcing_loops: unknown[]
      balancing_loops: unknown[]
      system_archetype_candidates: string[]
      leverage_points_summary: string[]
      management_implications: string
      deep_questions: { question_text: string; purpose: string; related_variable?: string }[]
      causal_loop_diagram: {
        nodes: { id: string; label: string; category_code?: string }[]
        edges: unknown[]
      }
    }

    // AI가 일부 필드를 누락하거나(토큰 한도, 스키마 해석 차이 등), 혹은 깊게 중첩된
    // 필드를 JSON 문자열로 이중 인코딩해 응답해도 파이프라인이 실패하지 않도록
    // 모든 배열/객체 필드에 방어적 기본값 + 파싱을 적용한다.
    const categoryReports = coerceJson(result.category_reports, [] as typeof result.category_reports)
    const problemStructure = coerceJson(result.problem_structure, {
      overview: '',
      parts: [],
      synthesis: '',
    } as typeof result.problem_structure)
    const keyVariables = coerceJson(result.key_variables, [] as typeof result.key_variables)
    const causalRelationships = coerceJson(result.causal_relationships, [] as typeof result.causal_relationships)
    const reinforcingLoops = coerceJson(result.reinforcing_loops, [] as typeof result.reinforcing_loops)
    const balancingLoops = coerceJson(result.balancing_loops, [] as typeof result.balancing_loops)
    const systemArchetypes = coerceJson(result.system_archetype_candidates, [] as string[])
    const leveragePointsSummary = coerceJson(result.leverage_points_summary, [] as string[])
    const deepQuestions = coerceJson(result.deep_questions, [] as typeof result.deep_questions)
    const causalLoopDiagram = coerceJson(result.causal_loop_diagram, { nodes: [], edges: [] } as typeof result.causal_loop_diagram)

    // 드물게 모델이 스키마를 따르지 않아 핵심 섹션이 비어 있는 경우, 빈 성공 응답
    // 대신 명확한 에러로 알려 재시도를 유도한다.
    if (categoryReports.length === 0 && problemStructure.parts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'AI가 문제구조 분석을 생성하지 못했습니다. 다시 시도해 주세요.' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    // 1) 시스템 다이내믹스 분석 upsert (status: structure_completed → STAGE 2가 이어서 completed로 갱신)
    const { error: upsertAnalysisError } = await supabase.from('system_dynamics_analyses').upsert(
      {
        assessment_id: assessmentId,
        problem_statement: result.problem_statement,
        key_variables: keyVariables,
        causal_relationships: causalRelationships,
        reinforcing_loops: reinforcingLoops,
        balancing_loops: balancingLoops,
        system_archetype_candidates: systemArchetypes,
        leverage_points: leveragePointsSummary,
        management_implications: result.management_implications,
        category_reports: categoryReports,
        problem_structure: problemStructure,
        status: 'processing',
      },
      { onConflict: 'assessment_id' },
    )
    if (upsertAnalysisError) throw upsertAnalysisError

    // 2) 심층질문 재생성
    await supabase.from('deep_questions').delete().eq('assessment_id', assessmentId)
    if (deepQuestions.length > 0) {
      const { error } = await supabase.from('deep_questions').insert(
        deepQuestions.map((q, i) => ({
          assessment_id: assessmentId,
          question_text: q.question_text,
          purpose: q.purpose,
          related_variable: q.related_variable ?? null,
          display_order: i + 1,
        })),
      )
      if (error) throw error
    }

    // 3) 인과순환지도 upsert (node id 슬러그 정규화)
    const nodeIdMap = new Map<string, string>()
    const nodes = (causalLoopDiagram.nodes ?? []).map((n, i) => {
      const slug = slugify(n.id || n.label, i)
      nodeIdMap.set(n.id, slug)
      return { id: slug, label: n.label, category_code: n.category_code }
    })
    const edges = (causalLoopDiagram.edges ?? []).map((e: any) => ({
      source: nodeIdMap.get(e.source) ?? slugify(e.source, 0),
      target: nodeIdMap.get(e.target) ?? slugify(e.target, 0),
      polarity: e.polarity,
      delay_exists: e.delay_exists,
    }))

    const { error: upsertCldError } = await supabase.from('causal_loop_diagrams').upsert(
      {
        assessment_id: assessmentId,
        nodes,
        edges,
        reinforcing_loops: reinforcingLoops,
        balancing_loops: balancingLoops,
      },
      { onConflict: 'assessment_id' },
    )
    if (upsertCldError) throw upsertCldError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
