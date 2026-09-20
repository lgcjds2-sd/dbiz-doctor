import { supabase } from '@/lib/supabase'
import type { Company, CompanyInsert } from '@/types/database'

export async function createCompany(input: CompanyInsert): Promise<Company> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('companies')
    .insert({ ...input, user_id: user?.id ?? null })
    .select()
    .single()
  if (error) throw error
  return data as Company
}

export async function listCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Company[]
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .maybeSingle()
  if (error) throw error
  return data as Company | null
}
