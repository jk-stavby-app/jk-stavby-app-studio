
import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, Shield, Pencil, Plus, X, Loader2, Search, Filter 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { formatDate } from '../constants';
import { useToast } from '../components/Toast';

const Admin: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user',
    is_active: true
  });

  const { showToast, ToastComponent } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      showToast('Chyba při načítání uživatelů', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            is_active: formData.is_active
          })
          .eq('id', editingUser.id);
        
        if (error) throw error;
        showToast('Uživatel byl aktualizován', 'success');
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .insert([{
            full_name: formData.full_name,
            email: formData.email,
            role: formData.role,
            is_active: formData.is_active
          }]);
        
        if (error) throw error;
        showToast('Uživatel byl přidán', 'success');
      }
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      showToast('Chyba při ukládání uživatele', 'error');
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      role: 'user',
      is_active: true
    });
    setShowModal(true);
  };

  const toggleUserActive = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);
      
      if (error) throw error;
      showToast(user.is_active ? 'Uživatel deaktivován' : 'Uživatel aktivován', 'success');
      fetchUsers();
    } catch (err) {
      showToast('Chyba při změně stavu uživatele', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#0F172A]">Správa uživatelů</h2>
          <p className="text-[#64748B] text-lg font-medium">Spravujte přístupy a role uživatelů systému JK Stavby</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-8 py-4 bg-[#5B9AAD] text-white rounded-2xl font-bold hover:bg-[#4A8A9D] transition-all shadow-lg shadow-[#5B9AAD]/20 text-base w-full md:w-auto justify-center"
        >
          <Plus size={22} />
          Přidat uživatele
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex items-center gap-5">
          <div className="p-4 bg-[rgba(91,154,173,0.1)] rounded-2xl text-[#5B9AAD]">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-1">Celkem uživatelů</p>
            <p className="text-3xl font-bold text-[#0F172A]">{users.length}</p>
          </div>
        </div>
        
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex items-center gap-5">
          <div className="p-4 bg-[rgba(16,185,129,0.1)] rounded-2xl text-[#10B981]">
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-1">Aktivní uživatelé</p>
            <p className="text-3xl font-bold text-[#0F172A]">
              {users.filter(u => u.is_active).length}
            </p>
          </div>
        </div>
        
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex items-center gap-5">
          <div className="p-4 bg-[rgba(245,158,11,0.1)] rounded-2xl text-[#F59E0B]">
            <Shield size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-1">Administrátoři</p>
            <p className="text-3xl font-bold text-[#0F172A]">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#64748B]" size={20} />
        <input
          type="text"
          placeholder="Hledat uživatele dle jména nebo e-mailu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-[#FAFBFC] border border-[#E2E8F0] shadow-sm rounded-3xl outline-none text-base focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all"
        />
      </div>

      <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E8F0] overflow-hidden p-6 md:p-8 shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD] mb-4" />
            <p className="text-lg text-[#64748B] font-medium">Načítání uživatelů...</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left min-w-[900px]">
              <thead className="border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">UŽIVATEL</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">ROLE</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">STAV</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">POSLEDNÍ PŘIHLÁŠENÍ</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">AKCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#5B9AAD] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {user.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-base font-bold text-[#0F172A]">{user.full_name || 'Bez jména'}</p>
                          <p className="text-sm text-[#475569] font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border ${
                        user.role === 'admin' 
                          ? 'bg-amber-50 text-amber-600 border-amber-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {user.role === 'admin' ? 'Administrátor' : 'Uživatel'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border ${
                        user.is_active 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {user.is_active ? 'Aktivní' : 'Neaktivní'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-base text-[#475569] font-medium">
                      {user.last_login 
                        ? formatDate(user.last_login) 
                        : 'Nikdy'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-3 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] rounded-xl transition-all"
                          title="Upravit"
                        >
                          <Pencil size={20} />
                        </button>
                        <button 
                          onClick={() => toggleUserActive(user)}
                          className={`p-3 rounded-xl border transition-all ${
                            user.is_active 
                              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                          }`}
                          title={user.is_active ? 'Deaktivovat' : 'Aktivovat'}
                        >
                          {user.is_active 
                            ? <UserX size={20} />
                            : <UserCheck size={20} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="w-20 h-20 bg-[#FAFBFC] border border-[#E2E8F0] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-[#E2E8F0]" />
                      </div>
                      <p className="text-[#64748B] text-lg font-medium">Nebyly nalezeny žádné záznamy</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 flex items-center justify-between border-b border-[#E2E8F0]">
              <h3 className="text-2xl font-bold text-[#0F172A]">
                {editingUser ? 'Upravit uživatele' : 'Přidat uživatele'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 hover:bg-slate-50 rounded-2xl transition-all"
              >
                <X size={24} className="text-[#64748B]" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-base font-bold text-[#64748B]">Jméno a příjmení</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-white border border-[#E2E8F0] rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/30 text-base font-medium"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-base font-bold text-[#64748B]">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled={!!editingUser}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-5 py-3.5 border rounded-2xl outline-none text-base font-medium ${
                    editingUser ? 'bg-slate-100 border-[#E2E8F0] text-slate-400 cursor-not-allowed' : 'bg-white border-[#E2E8F0] focus:ring-2 focus:ring-[#5B9AAD]/30'
                  }`}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-base font-bold text-[#64748B]">Role v systému</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-5 py-3.5 bg-white border border-[#E2E8F0] rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/30 text-base font-bold appearance-none"
                >
                  <option value="user">Uživatel (Prohlížení)</option>
                  <option value="admin">Administrátor (Plný přístup)</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E2E8F0]">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-6 h-6 rounded-lg border-slate-300 text-[#5B9AAD] focus:ring-[#5B9AAD] transition-all cursor-pointer"
                />
                <label htmlFor="is_active" className="text-base font-bold text-[#0F172A] cursor-pointer">
                  Aktivní přístup do systému
                </label>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 bg-white border border-[#E2E8F0] text-[#64748B] font-bold rounded-2xl hover:bg-slate-50 transition-all text-base"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 bg-[#5B9AAD] text-white rounded-2xl font-bold hover:bg-[#4A8A9D] transition-all shadow-lg shadow-[#5B9AAD]/20 text-base"
                >
                  {editingUser ? 'Uložit změny' : 'Vytvořit účet'}
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
