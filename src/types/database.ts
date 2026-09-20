// Supabase 테이블과 1:1로 대응하는 타입 정의.
// 5~9단계(AI 분석/심층질문/인과순환지도/레버리지 포인트/실행계획)는
// 아직 화면에 연결되지 않았지만 테이블/타입은 미리 정의해 둔다.

export type AssessmentStatus = 'in_progress' | 'completed'
export type AssessmentType = 'quick' | 'deep'
export type SeverityLevel = 'critical' | 'warning' | 'stable' | 'strong'
export type Polarity = '+' | '-'
export type ActionPhase = '0-30' | '31-60' | '61-90'
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Profile {
  id: string
  email: string | null
  is_admin: boolean
  consultant_name: string | null
  license_number: string | null
  seal_image: string | null
  created_at: string
}

export interface Company {
  id: string
  user_id: string | null
  company_name: string
  industry: string | null
  sub_industry: string | null
  revenue_range: string | null
  employee_range: string | null
  growth_stage: string | null
  main_products: string | null
  key_challenge: string | null
  created_at: string
}

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'user_id'> & {
  user_id?: string | null
}

export interface Assessment {
  id: string
  company_id: string
  assessment_type: AssessmentType
  status: AssessmentStatus
  overall_score: number | null
  consultant_opinion: string | null
  created_at: string
  completed_at: string | null
}

export interface Category {
  id: number
  code: string
  name: string
  description: string | null
  display_order: number | null
}

export interface Question {
  id: number
  category_id: number
  code: string
  question_text: string
  diagnosis_dimension: string | null
  question_type: string
  weight: number
  is_active: boolean
  display_order: number | null
}

export interface Response {
  id: string
  assessment_id: string
  question_id: number
  score: number | null
  answer_text: string | null
  created_at: string
}

export interface DiagnosisResult {
  id: string
  assessment_id: string
  category_id: number
  category_score: number | null
  normalized_score: number | null
  rank: number | null
  severity_level: SeverityLevel | null
  ai_summary: string | null
  created_at: string
}

export interface CausalRelationship {
  id: number
  source_dimension: string
  target_dimension: string
  polarity: Polarity
  delay_exists: boolean
  relationship_description: string | null
  confidence_score: number | null
  industry: string | null
  created_at: string
}

// ---- 5. 시스템 다이내믹스 분석 (다음 단계 연동용) ----

export interface KeyVariable {
  name: string
  description?: string
  category_code?: string
}

export interface CausalRelationshipItem {
  source: string
  target: string
  polarity: Polarity
  delay_exists: boolean
  description: string
  confidence_score: number
}

export interface FeedbackLoop {
  id: string // R1, R2 ... / B1, B2 ...
  name: string
  variables: string[]
  description?: string
}

export interface CategoryReport {
  category_code: string
  narrative: string
}

export interface ProblemStructurePart {
  title: string
  related_categories: string[]
  narrative: string
}

export interface ProblemStructure {
  overview: string
  parts: ProblemStructurePart[]
  synthesis: string
}

export interface SystemDynamicsAnalysis {
  id: string
  assessment_id: string
  problem_statement: string | null
  key_variables: KeyVariable[]
  causal_relationships: CausalRelationshipItem[]
  reinforcing_loops: FeedbackLoop[]
  balancing_loops: FeedbackLoop[]
  system_archetype_candidates: string[]
  leverage_points: string[]
  management_implications: string | null
  category_reports: CategoryReport[]
  problem_structure: ProblemStructure | null
  status: AnalysisStatus
  created_at: string
}

// ---- 6. AI 심층질문 (다음 단계 연동용) ----

export interface DeepQuestion {
  id: string
  assessment_id: string
  question_text: string
  purpose: string | null
  related_variable: string | null
  answer_text: string | null
  display_order: number | null
  created_at: string
}

// ---- 7. 인과순환지도 (다음 단계 연동용) ----

export interface CldNode {
  id: string
  label: string
  category_code?: string
}

export interface CldEdge {
  source: string
  target: string
  polarity: Polarity
  delay_exists: boolean
}

export interface CausalLoopDiagramData {
  id: string
  assessment_id: string
  nodes: CldNode[]
  edges: CldEdge[]
  reinforcing_loops: FeedbackLoop[]
  balancing_loops: FeedbackLoop[]
  created_at: string
}

// ---- 8. 레버리지 포인트 (다음 단계 연동용) ----

export interface LeveragePoint {
  id: string
  assessment_id: string
  leverage_point: string
  related_problem: string | null
  expected_impact: string | null
  implementation_difficulty: string | null
  time_to_effect: string | null
  priority_score: number | null
  recommended_action: string | null
  related_categories: string[]
  supplementary_explanation: string | null
  display_order: number | null
  created_at: string
}

// ---- 9. 90일 실행계획 (다음 단계 연동용) ----

export interface ActionPlan {
  id: string
  assessment_id: string
  leverage_point_id: string | null
  phase: ActionPhase
  action: string
  context: string | null
  owner: string | null
  kpi: string | null
  target: string | null
  due_date: string | null
  expected_effect: string | null
  display_order: number | null
  created_at: string
}

// Supabase generic Database 타입 (필요한 테이블만 명시)
export interface Database {
  public: {
    Tables: {
      companies: { Row: Company; Insert: Partial<Company>; Update: Partial<Company> }
      assessments: { Row: Assessment; Insert: Partial<Assessment>; Update: Partial<Assessment> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      questions: { Row: Question; Insert: Partial<Question>; Update: Partial<Question> }
      responses: { Row: Response; Insert: Partial<Response>; Update: Partial<Response> }
      diagnosis_results: {
        Row: DiagnosisResult
        Insert: Partial<DiagnosisResult>
        Update: Partial<DiagnosisResult>
      }
      causal_relationships: {
        Row: CausalRelationship
        Insert: Partial<CausalRelationship>
        Update: Partial<CausalRelationship>
      }
      system_dynamics_analyses: {
        Row: SystemDynamicsAnalysis
        Insert: Partial<SystemDynamicsAnalysis>
        Update: Partial<SystemDynamicsAnalysis>
      }
      deep_questions: {
        Row: DeepQuestion
        Insert: Partial<DeepQuestion>
        Update: Partial<DeepQuestion>
      }
      causal_loop_diagrams: {
        Row: CausalLoopDiagramData
        Insert: Partial<CausalLoopDiagramData>
        Update: Partial<CausalLoopDiagramData>
      }
      leverage_points: {
        Row: LeveragePoint
        Insert: Partial<LeveragePoint>
        Update: Partial<LeveragePoint>
      }
      action_plans: {
        Row: ActionPlan
        Insert: Partial<ActionPlan>
        Update: Partial<ActionPlan>
      }
    }
  }
}
