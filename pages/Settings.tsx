
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, LogOut, Save, Camera, X } from 'lucide-react';

interface SettingsProps {
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bento-card p-8 bg-white relative">
        {/* Close Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 right-6 p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-all"
          title="Zavřít"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-10">
          <div className="relative group cursor-pointer shrink-0">
            <img 
              src="https://picsum.photos/seed/marek/200/200" 
              alt="Marek Janota" 
              className="w-32 h-32 rounded-3xl object-cover border-4 border-slate-50 shadow-lg"
            />
            <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={28} />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-1">Marek Janota</h2>
            <p className="text-lg text-[#64748B] mb-5 font-medium">Project Director @ JK Stavby</p>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl border border-blue-100 uppercase tracking-widest shadow-sm">Administrátor</span>
              <span className="px-4 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-100 uppercase tracking-widest shadow-sm">Praha HQ</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-rose-50 text-rose-600 rounded-2xl text-base font-bold hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
          >
            <LogOut size={22} />
            Odhlásit se
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1 space-y-3">
            <button className="w-full flex items-center gap-3.5 px-5 py-4 bg-[#5B9AAD]/10 text-[#5B9AAD] rounded-2xl text-base font-bold shadow-sm">
              <User size={22} />
              Osobní profil
            </button>
            <button className="w-full flex items-center gap-3.5 px-5 py-4 text-[#64748B] hover:bg-slate-50 rounded-2xl text-base font-bold transition-all">
              <Bell size={22} />
              Notifikace
            </button>
            <button className="w-full flex items-center gap-3.5 px-5 py-4 text-[#64748B] hover:bg-slate-50 rounded-2xl text-base font-bold transition-all">
              <Shield size={22} />
              Zabezpečení
            </button>
          </div>

          <div className="md:col-span-3 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#64748B] uppercase tracking-widest">Jméno</label>
                <input 
                  type="text" 
                  defaultValue="Marek" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/20 text-base font-medium"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#64748B] uppercase tracking-widest">Příjmení</label>
                <input 
                  type="text" 
                  defaultValue="Janota" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/20 text-base font-medium"
                />
              </div>
              <div className="space-y-3 sm:col-span-2">
                <label className="text-sm font-bold text-[#64748B] uppercase tracking-widest">E-mailová adresa</label>
                <input 
                  type="email" 
                  defaultValue="marek.janota@jkstavby.cz" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/20 text-base font-medium"
                />
              </div>
              <div className="space-y-3 sm:col-span-2">
                <label className="text-sm font-bold text-[#64748B] uppercase tracking-widest">Telefonní číslo</label>
                <input 
                  type="text" 
                  defaultValue="+420 775 123 456" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/20 text-base font-medium"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex justify-end">
              <button className="flex items-center gap-3 px-10 py-4 bg-[#5B9AAD] text-white rounded-2xl font-bold shadow-xl shadow-[#5B9AAD]/20 hover:bg-[#4A7D8E] transition-all transform hover:-translate-y-1 text-base">
                <Save size={22} />
                Uložit nastavení
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bento-card p-8 bg-white">
        <h3 className="text-xl font-bold text-[#0F172A] mb-8">Pokročilé nastavení organizace</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all cursor-pointer">
            <div className="space-y-1">
              <p className="text-base font-bold text-[#0F172A]">Měsíční reporty do PDF</p>
              <p className="text-sm text-[#64748B] font-medium">Automaticky odesílat měsíční přehledy nákladů na e-mail ředitelství</p>
            </div>
            <div className="w-14 h-7 bg-[#5B9AAD] rounded-full relative shadow-inner">
              <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
