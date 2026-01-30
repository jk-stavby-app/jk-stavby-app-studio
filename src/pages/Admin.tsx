import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Shield, Pencil, Plus, X, Loader2, Search, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import { UserProfile } from '../types';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../lib/userService';

/**
 * UNIFIED StatCard - 2026 Enterprise SaaS
 */
const AdminStatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning';
}> = ({ label, value, icon: Icon, variant = 'default' }) => {
  const iconStyles = {
    default: 'bg-[#F0F9FF] text-[#5B9AAD]',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${iconStyles[variant]}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-[1.05rem] sm:text-[1.15rem] font-semibold text-[#334155] leading-tight">{label}</h4>
        <p className="text-[1.1rem] sm:text-[1.2rem] font-bold text-[#0F172A] tabular-nums">{value}</p>
      </div>
    </div>
  );
};

/**
 * RoleBadge
 */
const RoleBadge: React.FC<{ role: 'admin' | 'user' }> = ({ role }) => {
  const styles = {
    admin: 'bg-red-50 text-red-700 border-red-200',
    user: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  const labels = { admin: 'Administrátor', user: 'Uživatel' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[role]}`}>
      {labels[role]}
    </span>
  );
};

/**
 * StatusBadge
 */
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
      isActive 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-slate-50 text-slate-700 border-slate-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {isActive ? 'Aktivní' : 'Deaktivován'}
    </span>
  );
};

/**
 * UserCard - Mobile view
 */
const UserCard: React.FC<{ 
  user: UserProfile; 
  currentUserId?: string;
  onEdit: () => void; 
  onToggleActive: () => void;
}> = ({ user, currentUserId, onEdit, onToggleActive }) => (
  <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
    {/* Header */}
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E1EFF3] text-[#3A6A7D] flex items-center justify-center font-bold text-sm border border-[#5B9AAD]/10">
          {user.full_name 
            ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
            : <Users size={16} />
          }
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0F172A] truncate">{user.full_name || 'Nezadáno'}</p>
          <p className="text-xs font-medium text-[#64748B] truncate">{user.email}</p>
        </div>
      </div>
      <RoleBadge role={user.role} />
    </div>

    {/* Divider */}
    <div className="border-t border-[#F1F5F9] my-3" />

    {/* Status + Last login */}
    <div className="flex items-center justify-between mb-3">
      <StatusBadge isActive={user.is_active} />
      <div className="text-right">
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Poslední přihlášení</p>
        <p className="text-xs font-medium text-[#64748B]">
          {user.last_login 
            ? new Date(user.last_login).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }) 
            : 'Nikdy'}
        </p>
      </div>
    </div>

    {/* Actions */}
    <div className="flex gap-2 pt-3 border-t border-[#F1F5F9]">
      <button 
        onClick={onEdit}
        className="flex-1 h-10 flex items-center justify-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-all"
      >
        <Pencil size={14} />
        Upravit
      </button>
      <button
        onClick={onToggleActive}
        disabled={user.id === currentUserId}
        className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
          user.id === currentUserId 
            ? 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed' 
            : user.is_active 
              ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100' 
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {user.is_active ? <X size={14} /> : <UserCheck size={14} />}
        {user.is_active ? 'Deaktivovat' : 'Aktivovat'}
      </button>
    </div>
  </div>
);

const Admin: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    is_active: true,
    phone: '',
    position: '',
  });

  const { showToast, ToastComponent } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      showToast('Chyba při načítání uživatelů', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: UserProfile) => {
    if (user) {
      setModalMode('edit');
      setEditingUser(user);
      setFormData({
        full_name: user.full_name || '',
        email: user.email,
        password: '',
        role: user.role,
        is_active: user.is_active,
        phone: user.phone || '',
        position: user.position || '',
      });
    } else {
      setModalMode('create');
      setEditingUser(null);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'user',
        is_active: true,
        phone: '',
        position: '',
      });
    }
    setShowPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      showToast('Vyplňte jméno uživatele', 'error');
      return;
    }

    if (modalMode === 'create') {
      if (!formData.email.trim()) {
        showToast('Vyplňte e-mail', 'error');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        showToast('Heslo musí mít alespoň 6 znaků', 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (modalMode === 'edit' && editingUser) {
        await userService.updateUser(editingUser.id, {
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
          phone: formData.phone,
          position: formData.position,
        });
        showToast('Uživatel byl úspěšně upraven', 'success');
      } else {
        await userService.createUser({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          is_active: formData.is_active,
          phone: formData.phone,
          position: formData.position,
        });
        showToast('Uživatel byl úspěšně vytvořen', 'success');
      }
      fetchUsers();
      handleCloseModal();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při ukládání';
      showToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      showToast('Nemůžete deaktivovat vlastní účet', 'error');
      return;
    }

    try {
      await userService.toggleUserActive(user.id, !user.is_active);
      showToast(
        user.is_active ? 'Uživatel byl deaktivován' : 'Uživatel byl aktivován',
        'success'
      );
      fetchUsers();
    } catch (err) {
      showToast('Chyba při změně stavu uživatele', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-base font-semibold text-[#64748B]">Načítání uživatelů...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Správa uživatelů</h1>
          <p className="text-sm font-medium text-[#64748B] mt-1">Správa přístupů a oprávnění v systému</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 h-11 px-5 bg-[#5B9AAD] text-white rounded-xl text-sm font-semibold hover:bg-[#4A8A9D] transition-all shadow-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Přidat uživatele</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <AdminStatCard 
          label="Celkem uživatelů" 
          value={stats.total.toString()}
          icon={Users} 
        />
        <AdminStatCard 
          label="Aktivní přístup" 
          value={stats.active.toString()}
          icon={UserCheck}
          variant="success"
        />
        <AdminStatCard 
          label="Administrátoři" 
          value={stats.admins.toString()}
          icon={Shield}
          variant="warning"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
        <input
          type="text"
          placeholder="Hledat dle jména nebo e-mailu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all"
        />
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        
        {/* MOBILE: Card View */}
        <div className="lg:hidden p-4 space-y-3 bg-[#F8FAFC]">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-[#CBD5E1] mb-4" />
              <p className="text-sm font-semibold text-[#64748B]">Žádní uživatelé nenalezeni</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <UserCard 
                key={user.id} 
                user={user}
                currentUserId={currentUser?.id}
                onEdit={() => handleOpenModal(user)}
                onToggleActive={() => handleToggleActive(user)}
              />
            ))
          )}
        </div>

        {/* DESKTOP: Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Uživatel</th>
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Stav</th>
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Poslední přihlášení</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-[#64748B] uppercase tracking-wider">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Users size={48} className="mx-auto text-[#CBD5E1] mb-4" />
                    <p className="text-sm font-semibold text-[#64748B]">Žádní uživatelé nenalezeni</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E1EFF3] text-[#3A6A7D] flex items-center justify-center font-bold text-sm border border-[#5B9AAD]/10">
                          {user.full_name 
                            ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                            : <Users size={16} />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0F172A]">{user.full_name || 'Nezadáno'}</p>
                          <p className="text-xs font-medium text-[#64748B]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge isActive={user.is_active} />
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-[#64748B]">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('cs-CZ', { 
                            day: 'numeric', 
                            month: 'numeric', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) 
                        : 'Nikdy'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-2.5 text-[#64748B] rounded-xl hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
                          aria-label="Upravit uživatele"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={user.id === currentUser?.id}
                          className={`p-2.5 rounded-xl transition-all ${
                            user.id === currentUser?.id 
                              ? 'text-[#CBD5E1] cursor-not-allowed' 
                              : user.is_active 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          aria-label={user.is_active ? 'Deaktivovat' : 'Aktivovat'}
                        >
                          {user.is_active ? <X size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredUsers.length > 0 && (
          <div className="px-5 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
            <p className="text-sm font-medium text-[#64748B]">
              Zobrazeno <span className="font-bold text-[#0F172A]">{filteredUsers.length}</span> z <span className="font-bold text-[#0F172A]">{users.length}</span> uživatelů
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] w-full max-w-md my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {modalMode === 'edit' ? 'Upravit uživatele' : 'Nový uživatel'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#334155]">Celé jméno *</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all"
                  placeholder="Jan Novák"
                  required 
                />
              </div>
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#334155]">E-mailová adresa *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  disabled={modalMode === 'edit'} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed"
                  placeholder="jan@example.cz"
                  required 
                />
              </div>

              {/* Password - only for create */}
              {modalMode === 'create' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Heslo *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 pr-12 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all"
                      placeholder="Minimálně 6 znaků"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Phone + Position */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Telefon</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all"
                    placeholder="+420..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Pozice</label>
                  <input 
                    type="text" 
                    value={formData.position} 
                    onChange={(e) => setFormData({...formData, position: e.target.value})} 
                    className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all"
                    placeholder="Stavbyvedoucí"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#334155]">Role</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'user'})} 
                  className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] appearance-none cursor-pointer"
                >
                  <option value="user">Uživatel</option>
                  <option value="admin">Administrátor</option>
                </select>
              </div>

              {/* Active checkbox */}
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                  className="w-5 h-5 rounded border-[#E2E8F0] text-[#5B9AAD] focus:ring-[#5B9AAD]"
                />
                <span className="text-sm font-semibold text-[#0F172A]">Aktivní účet</span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-5 border-t border-[#E2E8F0]">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="flex-1 h-11 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl text-sm font-semibold hover:bg-[#F8FAFC] transition-all"
                >
                  Zrušit
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 h-11 bg-[#5B9AAD] text-white rounded-xl text-sm font-semibold hover:bg-[#4A8A9D] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>{modalMode === 'edit' ? 'Uložit' : 'Vytvořit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ToastComponent}
    </div>
  );
};

export default Admin;
