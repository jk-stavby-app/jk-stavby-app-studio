import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gwmqhwjctrqzmypmegwi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3bXFod2pjdHJxem15cG1lZ3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTU1MzAsImV4cCI6MjA4NDQ3MTUzMH0.SEyqR2zU8s6Kw0nMIfqApUqiBlicl0WpY2UbA5VqfpM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// READ
export const getProjects = () => supabase.from('project_dashboard').select('*')
export const getProject = (id: string) => supabase.from('project_dashboard').select('*').eq('id', id).single()
export const getProjectInvoices = (projectId: string) => supabase.from('project_invoices').select('*').eq('project_id', projectId)

// WRITE
export const updateProject = (id: string, data: { planned_budget?: number, status?: string, notes?: string }) => 
  supabase.from('projects').update(data).eq('id', id)

export const createProject = (data: { name: string, code: string, planned_budget: number, status: string, notes?: string }) => 
  supabase.from('projects').insert(data)
