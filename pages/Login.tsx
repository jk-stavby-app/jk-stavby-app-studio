
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('marek.janota@jkstavby.cz');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin();
      setLoading(false);
      navigate('/');
    }, 800);
  };

  return (
    <div className="min-h-screen blueprint-grid flex flex-col items-center justify-center p-4">
      <div className="max-w-[420px] w-full animate-fade-up">
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8 md:p-12">
          {/* Logo Area */}
          <div className="flex justify-center mb-10">
            <img 
              src="/logo.png" 
              alt="JK Stavby Logo" 
              className="w-[180px] h-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const placeholder = document.createElement('div');
                  placeholder.className = "flex items-center gap-3";
                  placeholder.innerHTML = `
                    <div class="w-12 h-12 bg-[#5B9AAD] rounded-xl flex items-center justify-center text-white font-bold text-2xl">JK</div>
                    <div class="text-left"><div class="font-bold text-xl leading-none">JK Stavby</div><div class="text-[10px] text-gray-400 uppercase tracking-tighter">Stavební společnost</div></div>
                  `;
                  parent.appendChild(placeholder);
                }
              }}
            />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Vítejte zpět</h1>
            <p className="text-[#64748B] text-base">Přihlaste se do systému správy projektů</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-[#0F172A] mb-2">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors group-focus-within:text-[#5B9AAD]" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vas@email.cz"
                  className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border-none rounded-xl focus:ring-2 focus:ring-[#5B9AAD]/30 outline-none transition-all text-base"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-base font-medium text-[#0F172A]">Heslo</label>
                {/* Removed invalid size prop from Link component */}
                <Link to="/forgot-password" className="text-base text-[#5B9AAD] hover:underline font-medium">
                  Zapomněli jste heslo?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors group-focus-within:text-[#5B9AAD]" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Zadejte heslo"
                  className="w-full pl-12 pr-12 py-3 bg-[#F8FAFC] border-none rounded-xl focus:ring-2 focus:ring-[#5B9AAD]/30 outline-none transition-all text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#5B9AAD] hover:bg-[#4A8A9D] text-white rounded-xl font-semibold shadow-lg shadow-[#5B9AAD]/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:transform-none text-base"
            >
              {loading ? 'Přihlašování...' : 'Přihlásit se'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          {/* Credits Area inside card */}
          <div className="mt-8 pt-8 border-t border-gray-50 text-center space-y-1">
            <p className="text-xs text-gray-400">
              © 2026 JK Stavební spol. s r.o.
            </p>
            <p className="text-xs text-gray-400">
              Vytvořil <a href="https://vilim.one" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 hover:underline transition-colors font-medium">vilim.one</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
