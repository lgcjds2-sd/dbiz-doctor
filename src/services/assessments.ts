import { supabase } from '@/lib/supabase'
import type { Assessment, Company, Response } from '@/types/database'

export async function createAssessment(companyId: string): Promise<Assessment> {
  const { data, error } = await supabase
    .from('assessments')
    .insert({ company_id: companyId, assessment_type: 'quick', status: 'in_progress' })
    .select()
    .single()
  if (error) throw error
  return data as Assessment
}

export async function getAssessment(assessmentId: string): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .maybeSingle()
  if (error) throw error
  return data as Assessment | null
}

export async function getAssessmentWithCompany(
  assessmentId: string,
): Promise<(Assessment & { company: Company }) | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*, company:companies(*)')
    .eq('id', assessmentId)
    .maybeSingle()
  if (error) throw error
  return data as unknown as (Assessment & { company: Company }) | null
}

export async function listAssessments(): Promise<(Assessment & { company: Company })[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*, company:companies(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as (Assessment & { company: Company })[]
}

export async function getResponsesForAssessment(assessmentId: string): Promise<Response[]> {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('assessment_id', assessmentId)
  if (error) throw error
  return (data ?? []) as Response[]
}

export async function saveResponse(
  assessmentId: string,
  questionId: number,
  score: number,
): Promise<void> {
  const { error } = await supabase
    .from('responses')
    .upsert(
      { assessment_id: assessmentId, question_id: questionId, score },
      { onConflict: 'assessment_id,question_id' },
    )
  if (error) throw error
}

export async function completeAssessment(
  assessmentId: string,
  overallScore: number,
): Promise<void> {
  const { error } = await supabase
    .from('assessments')
    .update({
      status: 'completed',
      overall_score: overallScore,
      completed_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
  if (error) throw error
}
