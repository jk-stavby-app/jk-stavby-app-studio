import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CHYBA: Chybí VITE_SUPABASE_URL nebo VITE_SUPABASE_ANON_KEY!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'jk-stavby-auth',
    flowType: 'pkce'
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

// SEARCH
export const searchProjects = (term: string, limit: number = 5) =>
  supabase
    .from('project_dashboard')
    .select('id, name, code')
    .or('name.ilike.%' + term + '%,code.ilike.%' + term + '%')
    .limit(limit)

export const searchInvoices = (term: string, limit: number = 5) =>
  supabase
    .from('project_invoices')
    .select('id, invoice_number, supplier_name, project_name')
    .or('invoice_number.ilike.%' + term + '%,supplier_name.ilike.%' + term + '%')
    .limit(limit)
