import { supabase } from '@/lib/supabase'
import type { Category, Question } from '@/types/database'

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

export async function listActiveQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Question[]
}

export async function listAllQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Question[]
}

export async function createQuestion(input: Partial<Question>): Promise<Question> {
  const { data, error } = await supabase.from('questions').insert(input).select().single()
  if (error) throw error
  return data as Question
}

export async function updateQuestion(id: number, input: Partial<Question>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Question
}

export async function deleteQuestion(id: number): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw error
}

export async function createCategory(input: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(input).select().single()
  if (error) throw error
  return data as Category
}

export async function updateCategory(id: number, input: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Category
}
