// Supabase Edge Function: generate-leverage-actions (STAGE 2 / 2)
//
// analyze-system-dynamics(STAGE 1)가 저장한 문제구조 분석 결과를 근거로
// STEP 8 (레버리지 포인트)과 STEP 9 (90일 실행계획)를 생성한다.
// 두 단계로 분리한 이유는 supabase/functions/analyze-system-dynamics/index.ts 상단
// 주석 참고 (하나의 거대한 AI 호출이 게이트웨이 타임아웃을 초과했기 때문).
//
// 배포: supabase functions deploy generate-leverage-actions
// 클라이언트는 analyze-system-dynamics 성공 후 이 함수를 호출한다.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ANTHROPIC_MODEL = 'claude-sonnet-5'

const TOOL_SCHEMA = {
  name: 'submit_leverage_action_plan',
  description: '문제구조 분석을 근거로 레버리지 포인트와 90일 실행계획을 구조화된 형태로 제출한다.',
  input_schema: {
    type: 'object',
    properties: {
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
            related_categories: {
              type: 'array',
              items: { type: 'string' },
              description: '이 레버리지 포인트가 해결하는 진단영역 코드 1~3개 (problem_structure.parts와 연결)',
            },
            supplementary_explanation: {
              type: 'string',
              description:
                '150~250자. 이 레버리지 포인트가 problem_structure의 어느 파트/어느 진단영역 문제를 어떤 메커니즘으로 해결하는지 구체적으로 연결해 설명',
            },
          },
          required: [
            'leverage_point',
            'related_problem',
            'expected_impact',
            'implementation_difficulty',
            'time_to_effect',
            'priority_score',
            'recommended_action',
            'related_categories',
            'supplementary_explanation',
          ],
        },
      },
      action_plan: {
        type: 'array',
        description: '0-30/31-60/61-90 단계별 실행과제, 단계당 3~6개. leverage_points에서 파생시킬 것.',
        items: {
          type: 'object',
          properties: {
            phase: { type: 'string', enum: ['0-30', '31-60', '61-90'] },
            action: { type: 'string', description: '구체적 실행과제명' },
            context: {
              type: 'string',
              description:
                '80~150자. 왜 이 시점에 이 과제를 하는지, 어떤 레버리지 포인트/진단결과와 연결되는지, 이전 단계 과제와 어떻게 이어지는지 서술',
            },
            owner: { type: 'string' },
            kpi: { type: 'string' },
            target: { type: 'string' },
            due_day_offset: { type: 'number', description: '계획 시작일로부터 경과 일수(1~90)' },
            expected_effect: { type: 'string' },
          },
          required: ['phase', 'action', 'context', 'owner', 'kpi', 'target', 'due_day_offset', 'expected_effect'],
        },
      },
    },
    required: ['leverage_points', 'action_plan'],
  },
}

function buildPrompt(context: Record<string, unknown>) {
  return `당신은 맥킨지(McKinsey) 스타일의 경영컨설팅 보고서를 작성하는 시니어 파트너입니다.
아래는 이미 완료된 한 중소기업의 문제구조 분석 결과입니다. 이를 근거로
submit_leverage_action_plan 도구를 호출하여 레버리지 포인트와 90일 실행계획을 제출하세요.

요구사항:
- 절대 일반론이나 뻔한 조언을 쓰지 말 것. problem_structure의 각 파트(원인·근거)를
  구체적으로 인용하며 서술할 것.
- leverage_points는 3~5개. 각각 related_categories로 problem_structure.parts와 명시적으로
  연결하고, supplementary_explanation(150~250자)에서 그 연결 메커니즘을 설명할 것.
- action_plan은 leverage_points에서 파생시켜 0-30/31-60/61-90 단계에 배분하고, 각 항목의
  context(80~150자)에서 왜 이 시점에 이 과제가 필요한지, 어느 레버리지 포인트와
  연결되는지 서술할 것. 각 단계는 이전 단계의 성과 위에 쌓이는 논리적 흐름을 가질 것.
- 문장은 컨설팅 보고서체("~로 판단된다", "~가 요구된다")로 작성할 것.
- 모든 텍스트는 한국어로 작성할 것.

[문제구조 분석 결과 및 진단 데이터]
${JSON.stringify(context, null, 2)}`
}

function coerceJson<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return (value as T) ?? fallback
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

    const { data: sda, error: sdaError } = await supabase
      .from('system_dynamics_analyses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single()
    if (sdaError || !sda) {
      return new Response(
        JSON.stringify({ error: '문제구조 분석(STAGE 1)이 먼저 완료되어야 합니다.' }),
        { status: 409, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const { data: results } = await supabase
      .from('diagnosis_results')
      .select('*, category:categories(*)')
      .eq('assessment_id', assessmentId)
      .order('rank', { ascending: true })

    const context = {
      company: {
        name: assessment.company.company_name,
        industry: assessment.company.industry,
        key_challenge: assessment.company.key_challenge,
      },
      overall_score: assessment.overall_score,
      weakest_categories: (results ?? []).slice(0, 3).map((r: any) => ({
        category: r.category.name,
        code: r.category.code,
        normalized_score: r.normalized_score,
      })),
      problem_statement: sda.problem_statement,
      problem_structure: sda.problem_structure,
      category_reports: sda.category_reports,
      key_variables: sda.key_variables,
      causal_relationships: sda.causal_relationships,
      management_implications: sda.management_implications,
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
        max_tokens: 12000,
        tools: [TOOL_SCHEMA],
        tool_choice: { type: 'tool', name: 'submit_leverage_action_plan' },
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
        JSON.stringify({ error: 'AI 응답이 토큰 한도를 초과해 잘렸습니다. 다시 시도해 주세요.' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const toolUse = anthropicJson.content?.find((block: any) => block.type === 'tool_use')
    if (!toolUse) {
      return new Response(JSON.stringify({ error: 'AI 응답에서 결과를 찾을 수 없습니다.' }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const result = toolUse.input as {
      leverage_points: (Record<string, unknown> & { related_categories?: string[] })[]
      action_plan: (Record<string, unknown> & { phase: string; due_day_offset: number })[]
    }

    const leveragePoints = coerceJson(result.leverage_points, [] as typeof result.leverage_points)
    const actionPlan = coerceJson(result.action_plan, [] as typeof result.action_plan)

    // 드물게 모델이 스키마를 따르지 않아 두 필드가 모두 비어 있는 경우, 빈 성공
    // 응답 대신 명확한 에러로 알려 재시도를 유도한다.
    if (leveragePoints.length === 0 && actionPlan.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'AI가 레버리지 포인트/실행계획을 생성하지 못했습니다. 다시 시도해 주세요.',
        }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    // 1) 레버리지 포인트 재생성
    await supabase.from('leverage_points').delete().eq('assessment_id', assessmentId)
    if (leveragePoints.length > 0) {
      const { error } = await supabase.from('leverage_points').insert(
        leveragePoints.map((lp: any, i) => ({
          assessment_id: assessmentId,
          leverage_point: lp.leverage_point,
          related_problem: lp.related_problem,
          expected_impact: lp.expected_impact,
          implementation_difficulty: lp.implementation_difficulty,
          time_to_effect: lp.time_to_effect,
          priority_score: lp.priority_score,
          recommended_action: lp.recommended_action,
          related_categories: lp.related_categories ?? [],
          supplementary_explanation: lp.supplementary_explanation,
          display_order: i + 1,
        })),
      )
      if (error) throw error
    }

    // 2) 90일 실행계획 재생성
    await supabase.from('action_plans').delete().eq('assessment_id', assessmentId)
    if (actionPlan.length > 0) {
      const startDate = new Date()
      const { error } = await supabase.from('action_plans').insert(
        actionPlan.map((a: any, i) => {
          const dueDate = new Date(startDate)
          dueDate.setDate(dueDate.getDate() + (Number(a.due_day_offset) || 30))
          return {
            assessment_id: assessmentId,
            leverage_point_id: null,
            phase: a.phase,
            action: a.action,
            context: a.context,
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

    // 3) 시스템 다이내믹스 분석 상태를 completed로 갱신
    await supabase
      .from('system_dynamics_analyses')
      .update({ status: 'completed' })
      .eq('assessment_id', assessmentId)

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
