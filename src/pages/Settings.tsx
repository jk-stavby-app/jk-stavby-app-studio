import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Save, 
  Loader2,
  Building2,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

const Settings: React.FC = () => {
  const { profile, refreshProfile, isAdmin } = useAuth();
  const { showToast, ToastComponent } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
  });

  // Organization settings (admin only)
  const [orgSettings, setOrgSettings] = useState({
    monthlyReports: true,
  });

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        position: profile.position || '',
      });
    }
  }, [profile]);

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    if (!formData.full_name.trim()) {
      showToast('Vyplňte jméno', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          position: formData.position.trim() || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      showToast('Nastavení bylo uloženo', 'success');
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Chyba při ukládání', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Split name into first and last
  const nameParts = formData.full_name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const handleNameChange = (first: string, last: string) => {
    const fullName = `${first} ${last}`.trim();
    setFormData({ ...formData, full_name: fullName });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-[#5B9AAD]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#0F172A]">Nastavení</h1>
        <p className="text-base text-[#475569] mt-1">
          Správa vašeho profilu a předvoleb
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E5E9] overflow-hidden">
        {/* Profile header */}
        <div className="p-6 border-b border-[#E2E5E9] bg-[#F8F9FA]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#E1EFF3] rounded-full flex items-center justify-center flex-shrink-0 border border-[#5B9AAD]/10">
              <span className="text-xl font-semibold text-[#3A6A7D]">
                {formData.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-[#0F172A] truncate">
                {formData.full_name || 'Uživatel'}
              </h2>
              <p className="text-base text-[#475569]">
                {formData.position || 'Pozice neuvedena'}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                  profile.role === 'admin' 
                    ? 'bg-[#FEF2F2] text-[#DC2626]' 
                    : 'bg-[#F1F5F9] text-[#475569]'
                }`}>
                  {profile.role === 'admin' ? 'Administrátor' : 'Uživatel'}
                </span>
                <span className="text-sm text-[#5C6878]">
                  {formData.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
          <h3 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
            <User size={20} className="text-[#5B9AAD]" />
            Osobní údaje
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm text-[#475569] font-medium">Jméno</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => handleNameChange(e.target.value, lastName)}
                className="w-full px-4 py-3 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium"
                placeholder="Jan"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm text-[#475569] font-medium">Příjmení</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => handleNameChange(firstName, e.target.value)}
                className="w-full px-4 py-3 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium"
                placeholder="Novák"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-[#475569] font-medium">E-mailová adresa</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C6878]" size={18} />
              <input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="w-full pl-11 pr-4 py-3 min-h-[44px] bg-[#F4F6F8] border border-[#E2E5E9] rounded-xl text-base text-[#5C6878] cursor-not-allowed font-medium"
              />
            </div>
            <p className="text-sm text-[#5C6878]">E-mail nelze změnit. Kontaktujte administrátora.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm text-[#475569] font-medium">Telefonní číslo</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C6878]" size={18} />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-11 pr-4 py-3 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] placeholder-[#5C6878] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium"
                placeholder="+420 123 456 789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="position" className="text-sm text-[#475569] font-medium">Pozice</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C6878]" size={18} />
              <input
                id="position"
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full pl-11 pr-4 py-3 min-h-[44px] bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] placeholder-[#5C6878] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium"
                placeholder="Stavbyvedoucí"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E5E9]">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-[#5B9AAD] text-[#F8FAFC] rounded-xl text-base font-semibold hover:bg-[#4A8A9D] transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Ukládám...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Uložit změny
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {isAdmin && (
        <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E5E9] overflow-hidden">
          <div className="p-6 border-b border-[#E2E5E9] bg-[#F8F9FA]">
            <h3 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
              <Building2 size={20} className="text-[#5B9AAD]" />
              Nastavení organizace
            </h3>
            <p className="text-base text-[#475569] mt-1">Pokročilá nastavení dostupná pouze pro administrátory</p>
          </div>

          <div className="p-6 space-y-4">
            <label className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-xl cursor-pointer hover:bg-[#F4F6F8] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E1EFF3] rounded-xl flex items-center justify-center group-hover:bg-[#C3DFE7] transition-colors">
                  <FileText size={20} className="text-[#5B9AAD]" />
                </div>
                <div>
                  <p className="text-base font-medium text-[#0F172A]">Měsíční reporty do PDF</p>
                  <p className="text-sm text-[#5C6878]">Automaticky odesílat měsíční přehledy nákladů na e-mail ředitelství</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={orgSettings.monthlyReports}
                  onChange={(e) => setOrgSettings({ ...orgSettings, monthlyReports: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-12 h-7 rounded-full transition-colors ${
                  orgSettings.monthlyReports ? 'bg-[#5B9AAD]' : 'bg-[#CDD1D6]'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                    orgSettings.monthlyReports ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E5E9] p-6">
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Informace o účtu</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-[#5C6878]">Účet vytvořen</p>
            <p className="text-[#0F172A] font-medium">
              {profile.created_at 
                ? new Date(profile.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Neznámé'}
            </p>
          </div>
          <div>
            <p className="text-[#5C6878]">Poslední přihlášení</p>
            <p className="text-[#0F172A] font-medium">
              {profile.last_login 
                ? new Date(profile.last_login).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Nikdy'}
            </p>
          </div>
        </div>
      </div>

      {ToastComponent}
    </div>
  );
};

export default Settings;
