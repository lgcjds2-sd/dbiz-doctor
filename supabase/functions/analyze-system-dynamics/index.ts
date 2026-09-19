// Supabase Edge Function: analyze-system-dynamics
//
// STEP 5~9를 한 번의 Claude 호출로 생성한다.
//   5. 시스템 다이내믹스 분석 (problem_statement, key_variables, causal_relationships,
//      reinforcing/balancing_loops, system_archetype_candidates, leverage_points 요약,
//      management_implications)
//   6. AI 심층질문 10~15개
//   7. 인과순환지도 (nodes/edges, R1·R2/B1·B2 루프)
//   8. 레버리지 포인트 3~5개 (Impact x Feasibility 매트릭스용 필드 포함)
//   9. 90일 실행계획 (0-30 / 31-60 / 61-90)
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
  name: 'submit_diagnosis_analysis',
  description:
    '중소기업 경영진단 시스템 다이내믹스 분석 결과를 구조화된 형태로 제출한다.',
  input_schema: {
    type: 'object',
    properties: {
      problem_statement: { type: 'string', description: '핵심 문제를 한 단락으로 정의' },
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
      leverage_points_summary: { type: 'array', items: { type: 'string' } },
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
      leverage_points: {
        type: 'array',
        description: '3~5개',
        items: {
          type: 'object',
          properties: {
            leverage_point: { type: 'string' },
            related_problem: { type: 'string' },
            expected_impact: { type: 'string' },
            implementation_difficulty: { type: 'string', enum: ['낮음', '중간', '높음'] },
            time_to_effect: { type: 'string' },
            priority_score: { type: 'number', minimum: 0, maximum: 100 },
            recommended_action: { type: 'string' },
          },
          required: [
            'leverage_point',
            'related_problem',
            'expected_impact',
            'implementation_difficulty',
            'time_to_effect',
            'priority_score',
            'recommended_action',
          ],
        },
      },
      action_plan: {
        type: 'array',
        description: '0-30/31-60/61-90 단계별 실행과제, 단계당 3~6개',
        items: {
          type: 'object',
          properties: {
            phase: { type: 'string', enum: ['0-30', '31-60', '61-90'] },
            action: { type: 'string' },
            owner: { type: 'string' },
            kpi: { type: 'string' },
            target: { type: 'string' },
            due_day_offset: { type: 'number', description: '계획 시작일로부터 경과 일수(1~90)' },
            expected_effect: { type: 'string' },
          },
          required: ['phase', 'action', 'owner', 'kpi', 'target', 'due_day_offset', 'expected_effect'],
        },
      },
    },
    required: [
      'problem_statement',
      'key_variables',
      'causal_relationships',
      'reinforcing_loops',
      'balancing_loops',
      'system_archetype_candidates',
      'leverage_points_summary',
      'management_implications',
      'deep_questions',
      'causal_loop_diagram',
      'leverage_points',
      'action_plan',
    ],
  },
}

function buildPrompt(context: Record<string, unknown>) {
  return `당신은 시스템 다이내믹스 방법론에 정통한 경영컨설턴트입니다.
아래는 한 중소기업의 경영진단(Quick Diagnosis) 데이터입니다. 이 데이터를 근거로
submit_diagnosis_analysis 도구를 호출하여 구조화된 분석 결과를 제출하세요.

요구사항:
- 문제구조는 반드시 응답 데이터(특히 취약영역 TOP3)에 근거해야 하며 추측성 일반론을 피할 것.
- causal_relationships의 source/target은 key_variables의 name과 일치시킬 것.
- causal_loop_diagram.nodes.id는 causal_relationships에서 사용한 변수명을 슬러그화한 값으로,
  edges.source/target은 그 node id를 참조할 것.
- reinforcing_loops/balancing_loops는 causal_loop_diagram의 edges로 실제로 구성 가능한
  순환 구조여야 함.
- deep_questions는 10~15개, 6가지 목적(시간적 변화, 인과관계 검증, 피드백 루프, 시간지연,
  정책 부작용, 시스템 원형)을 고르게 포함할 것.
- leverage_points는 3~5개, action_plan은 leverage_points에서 도출하여 0-30/31-60/61-90
  단계에 걸쳐 배분할 것.
- 모든 텍스트는 한국어로 작성할 것.

[진단 데이터]
${JSON.stringify(context, null, 2)}`
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
        max_tokens: 8192,
        tools: [TOOL_SCHEMA],
        tool_choice: { type: 'tool', name: 'submit_diagnosis_analysis' },
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
    const toolUse = anthropicJson.content?.find((block: any) => block.type === 'tool_use')
    if (!toolUse) {
      return new Response(JSON.stringify({ error: 'AI 응답에서 분석 결과를 찾을 수 없습니다.' }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const result = toolUse.input as {
      problem_statement: string
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
      leverage_points: Record<string, unknown>[]
      action_plan: (Record<string, unknown> & { phase: string; due_day_offset: number })[]
    }

    // 1) 시스템 다이내믹스 분석 upsert
    const { error: upsertAnalysisError } = await supabase.from('system_dynamics_analyses').upsert(
      {
        assessment_id: assessmentId,
        problem_statement: result.problem_statement,
        key_variables: result.key_variables,
        causal_relationships: result.causal_relationships,
        reinforcing_loops: result.reinforcing_loops,
        balancing_loops: result.balancing_loops,
        system_archetype_candidates: result.system_archetype_candidates,
        leverage_points: result.leverage_points_summary,
        management_implications: result.management_implications,
        status: 'completed',
      },
      { onConflict: 'assessment_id' },
    )
    if (upsertAnalysisError) throw upsertAnalysisError

    // 2) 심층질문 재생성
    await supabase.from('deep_questions').delete().eq('assessment_id', assessmentId)
    if (result.deep_questions.length > 0) {
      const { error } = await supabase.from('deep_questions').insert(
        result.deep_questions.map((q, i) => ({
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
    const nodes = (result.causal_loop_diagram.nodes ?? []).map((n, i) => {
      const slug = slugify(n.id || n.label, i)
      nodeIdMap.set(n.id, slug)
      return { id: slug, label: n.label, category_code: n.category_code }
    })
    const edges = (result.causal_loop_diagram.edges ?? []).map((e: any) => ({
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
        reinforcing_loops: result.reinforcing_loops,
        balancing_loops: result.balancing_loops,
      },
      { onConflict: 'assessment_id' },
    )
    if (upsertCldError) throw upsertCldError

    // 4) 레버리지 포인트 재생성
    await supabase.from('leverage_points').delete().eq('assessment_id', assessmentId)
    if (result.leverage_points.length > 0) {
      const { error } = await supabase.from('leverage_points').insert(
        result.leverage_points.map((lp, i) => ({
          assessment_id: assessmentId,
          leverage_point: lp.leverage_point,
          related_problem: lp.related_problem,
          expected_impact: lp.expected_impact,
          implementation_difficulty: lp.implementation_difficulty,
          time_to_effect: lp.time_to_effect,
          priority_score: lp.priority_score,
          recommended_action: lp.recommended_action,
          display_order: i + 1,
        })),
      )
      if (error) throw error
    }

    // 5) 90일 실행계획 재생성
    await supabase.from('action_plans').delete().eq('assessment_id', assessmentId)
    if (result.action_plan.length > 0) {
      const startDate = new Date()
      const { error } = await supabase.from('action_plans').insert(
        result.action_plan.map((a, i) => {
          const dueDate = new Date(startDate)
          dueDate.setDate(dueDate.getDate() + (Number(a.due_day_offset) || 30))
          return {
            assessment_id: assessmentId,
            leverage_point_id: null,
            phase: a.phase,
            action: a.action,
            owner: a.owner,
            kpi: a.kpi,
            target: a.target,
            due_date: dueDate.toISOString().slice(0, 10),
            expected_effect: a.expected_effect,
            display_order: i + 1,
          }
        }),
      )
      if (error) throw error
    }

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
