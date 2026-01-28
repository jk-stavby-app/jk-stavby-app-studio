import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Vypnout problematické Navigator Locks API v Chrome
    lock: 'no-op',
    // Použít localStorage místo default storage
    persistSession: true,
    storageKey: 'jk-stavby-auth',
    // Automaticky refreshovat token
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// READ
export const getProjects = () => supabase.from('project_dashboard').select('*')
export const getProject = (id: string) => supabase.from('project_dashboard').select('*').eq('id', id).single()
export const getProjectInvoices = (projectId: string) => supabase.from('project_invoices').select('*').eq('project_id', projectId)

// WRITE
export const updateProject = (id: string, data: { planned_budget?: number, status?: string, notes?: string }) => 
  supabase.from('projects').update(data).eq('id', id)

export const createProject = (data: { name: string, code: string, planned_budget: number, status: string, notes?: string }) => 
  supabase.from('projects').insert(data)
