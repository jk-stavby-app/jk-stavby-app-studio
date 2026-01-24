
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://gwmqhwjctrqzmypmegwi.supabase.co',
  'sb_publishable_mvhWokpL6cVXG3b2znN2TQ_pPuyZNYy'
)

// READ
export const getProjects = () => supabase.from('project_dashboard').select('*')
export const getProject = (id: string) => supabase.from('project_dashboard').select('*').eq('id', id).single()
export const getProjectInvoices = (projectId: string) => supabase.from('project_invoices').select('*').eq('project_id', projectId)

// WRITE
export const updateProject = (id: string, data: { planned_budget?: number, status?: string, notes?: string }) => 
  supabase.from('projects').update(data).eq('id', id)

export const createProject = (data: { name: string, code: string, planned_budget: number, status: string, notes?: string }) => 
  supabase.from('projects').insert(data)
