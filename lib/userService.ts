import { supabase } from './supabase';
import { UserProfile, CreateUserData, UpdateUserData, BudgetChange } from '../types';

export const userService = {
  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUser(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createUser(userData: CreateUserData): Promise<void> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password || '',
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Nepodařilo se vytvořit uživatele');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: userData.full_name,
        role: userData.role,
        is_active: userData.is_active,
        phone: userData.phone || null,
        position: userData.position || null,
      })
      .eq('id', authData.user.id);

    if (updateError) console.error('Profile update error:', updateError);
  },

  async updateUser(id: string, userData: UpdateUserData): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        full_name: userData.full_name,
        role: userData.role,
        is_active: userData.is_active,
        phone: userData.phone,
        position: userData.position,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleUserActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });
    if (error) throw error;
  },

  async getUserStats(): Promise<{ total: number; active: number; admins: number }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, is_active');

    if (error) throw error;

    return {
      total: data?.length || 0,
      active: data?.filter(u => u.is_active).length || 0,
      admins: data?.filter(u => u.role === 'admin').length || 0,
    };
  },
};

export const budgetService = {
  async getBudgetHistory(projectId: string): Promise<BudgetChange[]> {
    const { data, error } = await supabase
      .from('budget_changes')
      .select(`
        *,
        user_profiles:changed_by (full_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      admin_name: (item.user_profiles as any)?.full_name || 'Neznámý',
    }));
  },

  async updateBudget(
    projectId: string, 
    adminId: string,
    oldValue: number, 
    newValue: number, 
    reason?: string
  ): Promise<void> {
    const { error: projectError } = await supabase
      .from('projects')
      .update({ planned_budget: newValue })
      .eq('id', projectId);
    
    if (projectError) throw projectError;

    const { error: historyError } = await supabase
      .from('budget_changes')
      .insert({
        project_id: projectId,
        changed_by: adminId,
        old_value: oldValue,
        new_value: newValue,
        reason: reason?.trim() || null,
        change_amount: newValue - oldValue
      });
    
    if (historyError) throw historyError;
  },
};