
export interface Project {
  id: string;
  name: string;
  code: string;
  planned_budget: number;
  total_costs: number;
  budget_usage_percent: number;
  status: 'active' | 'completed' | 'on_hold';
  invoice_count: number;
  first_invoice_date: string | null;
  last_invoice_date: string | null;
  project_year: number | null;
  paid_invoice_count: number;
  pending_invoice_count: number;
  overdue_invoice_count: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  project_name: string;
  supplier_name: string;
  total_amount: number;
  date_issue: string;
  payment_status: 'paid' | 'pending' | 'overdue';
  project_id: string | null;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}
