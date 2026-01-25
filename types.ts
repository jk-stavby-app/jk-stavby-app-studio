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
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  avatar_url?: string | null;
  phone?: string | null;
  position?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserData {
  email: string;
  password?: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  phone?: string;
  position?: string;
}

export interface UpdateUserData {
  full_name?: string;
  role?: 'admin' | 'user';
  is_active?: boolean;
  phone?: string | null;
  position?: string | null;
  avatar_url?: string | null;
}

export interface BudgetChange {
  id: string;
  project_id: string;
  changed_by: string;
  old_value: number;
  new_value: number;
  change_amount: number;
  reason: string | null;
  created_at: string;
  admin_name?: string;
}