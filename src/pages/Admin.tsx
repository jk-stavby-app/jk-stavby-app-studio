import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Shield, Pencil, Plus, X, Loader2, Search, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import { UserProfile } from '../types';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../lib/userService';

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
    } catch (err: any) {
      showToast(err.message || 'Chyba při ukládání', 'error');
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

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Správa uživatelů</h2>
          <p className="text-sm text-[#64748B]">Správa přístupů a oprávnění v systému JK Stavby</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 h-11 px-5 bg-[#5B9AAD] text-white rounded-xl text-sm font-semibold hover:bg-[#4A8A9D] transition-all w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Přidat uživatele</span>
        </button>
      </div>

      {/* Stats Grid - UNIFIED */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Celkem uživatelů */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F0F9FF] rounded-xl flex items-center justify-center">
              <Users size={18} className="text-[#5B9AAD]" />
            </div>
          </div>
          <h4 className="text-[1.1rem] sm:text-[1.2rem] font-semibold text-[#1E293B] leading-tight mb-1">
            Celkem uživatelů
          </h4>
          <p className="text-base font-medium text-[#475569] tabular-nums">{stats.total}</p>
        </div>

        {/* Aktivní přístup */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#D1FAE5] rounded-xl flex items-center justify-center">
              <UserCheck size={18} className="text-[#059669]" />
            </div>
          </div>
          <h4 className="text-[1.1rem] sm:text-[1.2rem] font-semibold text-[#1E293B] leading-tight mb-1">
            Aktivní přístup
          </h4>
          <p className="text-base font-medium text-[#475569] tabular-nums">{stats.active}</p>
        </div>

        {/* Administrátoři */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FEF3C7] rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-[#D97706]" />
            </div>
          </div>
          <h4 className="text-[1.1rem] sm:text-[1.2rem] font-semibold text-[#1E293B] leading-tight mb-1">
            Administrátoři
          </h4>
          <p className="text-base font-medium text-[#475569] tabular-nums">{stats.admins}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <label htmlFor="search-users" className="sr-only">Hledat uživatele</label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
        <input
          id="search-users"
          type="text"
          placeholder="Dle jména nebo e-mailu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
            <p className="text-sm font-medium text-[#64748B]">Načítání seznamu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-[#64748B]">Uživatel</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#64748B]">Role</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#64748B]">Stav</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#64748B]">Poslední přihlášení</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#64748B]">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E1EFF3] text-[#3A6A7D] flex items-center justify-center font-bold text-sm">
                          {u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <Users size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">{u.full_name || 'Nezadáno'}</p>
                          <p className="text-xs text-[#64748B]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        u.role === 'admin' 
                          ? 'bg-[#FEE2E2] text-[#DC2626]' 
                          : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                        {u.role === 'admin' ? 'administrátor' : 'uživatel'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        u.is_active 
                          ? 'bg-[#ECFDF5] text-[#059669]' 
                          : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                        {u.is_active ? 'aktivní' : 'deaktivován'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#64748B]">
                      {u.last_login 
                        ? new Date(u.last_login).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                        : 'Nikdy'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenModal(u)}
                          className="p-2 text-[#64748B] rounded-lg hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
                          aria-label="Upravit uživatele"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === currentUser?.id}
                          className={`p-2 rounded-lg transition-colors ${
                            u.id === currentUser?.id 
                              ? 'opacity-30 cursor-not-allowed text-[#94A3B8]' 
                              : u.is_active 
                                ? 'text-[#DC2626] hover:bg-[#FEF2F2]' 
                                : 'text-[#059669] hover:bg-[#ECFDF5]'
                          }`}
                          aria-label={u.is_active ? 'Deaktivovat' : 'Aktivovat'}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] w-full max-w-md my-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {modalMode === 'edit' ? 'Upravit uživatele' : 'Nový uživatel'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#475569]">Celé jméno *</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all"
                  required 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#475569]">E-mailová adresa *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  disabled={modalMode === 'edit'} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed"
                  required 
                />
              </div>

              {modalMode === 'create' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#475569]">Heslo *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 pr-12 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all"
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#475569]">Telefon</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all"
                    placeholder="+420..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#475569]">Pozice</label>
                  <input 
                    type="text" 
                    value={formData.position} 
                    onChange={(e) => setFormData({...formData, position: e.target.value})} 
                    className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all"
                    placeholder="Např. PM"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#475569]">Role</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'user'})} 
                  className="w-full px-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] appearance-none cursor-pointer"
                >
                  <option value="user">Uživatel</option>
                  <option value="admin">Administrátor</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                  className="w-5 h-5 rounded border-[#E2E8F0] text-[#5B9AAD] focus:ring-[#5B9AAD]"
                />
                <span className="text-sm font-medium text-[#0F172A]">Aktivní účet</span>
              </label>

              <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
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
