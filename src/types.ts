export interface Project {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'completed' | 'on_hold';
  planned_budget: number;
  total_costs: number;
  budget_usage_percent: number;
  invoice_count: number;
  notes?: string;
  project_year?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  project_id: string | null;
  project_name?: string;
  supplier_name: string;
  total_amount: number;
  date_issue: string;
  date_due?: string;
  payment_status: 'paid' | 'pending' | 'overdue';
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  phone?: string | null;
  position?: string | null;
  created_at?: string;
  last_login?: string | null;
}

export interface CreateUserData {
  email: string;
  password: string;
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
  phone?: string;
  position?: string;
}

export interface BudgetChange {
  id: string;
  project_id: string;
  changed_by: string;
  old_value: number;
  new_value: number;
  change_amount: number;
  reason?: string;
  created_at: string;
  admin_name?: string;
}
