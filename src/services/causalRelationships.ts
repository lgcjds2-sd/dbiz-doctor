import { supabase } from '@/lib/supabase'
import type { CausalRelationship } from '@/types/database'

export async function listCausalRelationships(): Promise<CausalRelationship[]> {
  const { data, error } = await supabase
    .from('causal_relationships')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CausalRelationship[]
}

export async function createCausalRelationship(
  input: Partial<CausalRelationship>,
): Promise<CausalRelationship> {
  const { data, error } = await supabase
    .from('causal_relationships')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as CausalRelationship
}

export async function deleteCausalRelationship(id: number): Promise<void> {
  const { error } = await supabase.from('causal_relationships').delete().eq('id', id)
  if (error) throw error
}
