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
        password: '', // Always empty for edit
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#0F172A] leading-tight">Správa uživatelů</h2>
          <p className="text-base text-[#475569] font-medium leading-relaxed">Správa přístupů a oprávnění v systému JK Stavby</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-6 py-3 min-h-[44px] bg-[#5B9AAD] text-[#F8FAFC] rounded-xl font-medium text-base hover:bg-[#4A8A9D] transition-colors flex items-center justify-center gap-2 w-full md:w-auto active:scale-[0.98] leading-relaxed"
        >
          <Plus size={20} aria-hidden="true" />
          <span>Přidat uživatele</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E5E9]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#475569] font-medium leading-normal">Celkem uživatelů</span>
            <div className="w-10 h-10 bg-[#F0F7F9] rounded-xl flex items-center justify-center">
              <Users size={20} className="text-[#5B9AAD]" aria-hidden="true" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-[#0F172A] tracking-tight">{stats.total}</p>
        </div>
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E5E9]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#475569] font-medium leading-normal">Aktivní přístup</span>
            <div className="w-10 h-10 bg-[#ECFDF5] rounded-xl flex items-center justify-center">
              <UserCheck size={20} className="text-[#059669]" aria-hidden="true" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-[#0F172A] tracking-tight">{stats.active}</p>
        </div>
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E5E9]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#475569] font-medium leading-normal">Administrátoři</span>
            <div className="w-10 h-10 bg-[#FEF9EE] rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-[#D97706]" aria-hidden="true" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-[#0F172A] tracking-tight">{stats.admins}</p>
        </div>
      </div>

      <div className="relative w-full">
        <label htmlFor="search-users" className="sr-only">Hledat uživatele</label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={18} aria-hidden="true" />
        <input
          id="search-users"
          type="text"
          placeholder="Dle jména nebo e-mailu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 min-h-[44px] bg-[#FAFBFC] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] placeholder-[#5C6878] focus:outline-none focus:border-[#5B9AAD] transition-all font-medium"
        />
      </div>

      <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E5E9] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD] mb-4" />
            <p className="text-base font-medium text-[#475569] leading-relaxed">Načítání seznamu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]" role="table">
              <thead className="bg-[#F4F6F8] border-b border-[#E2E5E9]">
                <tr>
                  <th scope="col" className="px-6 py-4 text-sm font-semibold text-[#475569]">Uživatel</th>
                  <th scope="col" className="px-6 py-4 text-sm font-semibold text-[#475569]">Role</th>
                  <th scope="col" className="px-6 py-4 text-sm font-semibold text-[#475569]">Stav</th>
                  <th scope="col" className="px-6 py-4 text-sm font-semibold text-[#475569]">Poslední přihlášení</th>
                  <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-[#475569]">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E5E9]">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-[#F8F9FA] transition-colors border-b border-[#E2E5E9]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#E1EFF3] text-[#3A6A7D] flex items-center justify-center font-bold border border-[#5B9AAD]/10">
                          {u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <Users size={18} />}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[#0F172A] leading-relaxed">{u.full_name || 'Nezadáno'}</p>
                          <p className="text-base text-[#475569] leading-relaxed">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        u.role === 'admin' 
                        ? 'bg-[#FEF2F2] text-[#DC2626]' 
                        : 'bg-[#F1F5F9] text-[#475569]'
                      }`}>
                        {u.role === 'admin' ? 'administrátor' : 'uživatel'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        u.is_active 
                        ? 'bg-[#ECFDF5] text-[#059669]' 
                        : 'bg-[#F1F5F9] text-[#475569]'
                      }`}>
                        {u.is_active ? 'aktivní' : 'deaktivován'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-base text-[#475569] leading-relaxed">
                      {u.last_login 
                        ? new Date(u.last_login).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                        : 'Nikdy'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(u)}
                          className="p-2 min-h-[40px] min-w-[40px] text-[#475569] rounded-xl font-medium hover:bg-[#F4F6F8] hover:text-[#0F172A] transition-colors"
                          aria-label="Upravit uživatele"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === currentUser?.id}
                          className={`p-2 min-h-[40px] min-w-[40px] rounded-xl transition-colors ${
                            u.id === currentUser?.id ? 'opacity-30 cursor-not-allowed' :
                            u.is_active ? 'text-[#D97706] hover:bg-[#FEF9EE]' : 'text-[#10B981] hover:bg-[#ECFDF5]'
                          }`}
                          aria-label={u.is_active ? 'Deaktivovat' : 'Aktivovat'}
                        >
                          {u.is_active ? <X size={18} /> : <UserCheck size={18} />}
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

      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/20 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E5E9] w-full max-w-md my-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E2E5E9]">
              <h2 className="text-xl font-semibold text-[#0F172A]">
                {modalMode === 'edit' ? 'Upravit uživatele' : 'Nový uživatel'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-3 min-w-[44px] min-h-[44px] rounded-xl text-[#475569] hover:bg-[#F4F6F8] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm text-[#475569] font-medium">Celé jméno *</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  className="w-full px-4 py-3 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-[#475569] font-medium">E-mailová adresa *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  disabled={modalMode === 'edit'} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="w-full px-4 py-3 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  required 
                />
              </div>

              {/* Password - only for create mode */}
              {modalMode === 'create' && (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm text-[#475569] font-medium">
                    Heslo *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium"
                      placeholder="Minimálně 6 znaků"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5C6878] hover:text-[#0F172A] transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#475569] font-medium">Telefon</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    className="w-full px-4 py-3 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all font-medium"
                    placeholder="+420..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#475569] font-medium">Pozice</label>
                  <input 
                    type="text" 
                    value={formData.position} 
                    onChange={(e) => setFormData({...formData, position: e.target.value})} 
                    className="w-full px-4 py-3 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all font-medium"
                    placeholder="Např. PM"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#475569] font-medium">Role</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})} 
                  className="w-full px-4 py-3 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] appearance-none cursor-pointer font-medium"
                >
                  <option value="user">Uživatel</option>
                  <option value="admin">Administrátor</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                <input 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                  className="w-5 h-5 rounded border-[#CDD1D6] bg-[#F8F9FA] text-[#5B9AAD] focus:ring-[#5B9AAD]"
                />
                <span className="text-base text-[#0F172A] font-medium">Aktivní účet</span>
              </label>

              <div className="flex gap-4 pt-6 border-t border-[#E2E5E9]">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="flex-1 py-3 bg-[#FAFBFC] border border-[#E2E5E9] text-[#0F172A] rounded-xl font-medium hover:bg-[#F4F6F8]"
                >
                  Zrušit
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-3 bg-[#5B9AAD] text-[#F8FAFC] rounded-xl font-medium hover:bg-[#4A8A9D] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  <span>{modalMode === 'edit' ? 'Uložit změny' : 'Vytvořit'}</span>
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