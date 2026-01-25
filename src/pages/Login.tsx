import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [email, setEmail] = useState('marek.janota@jkstavby.cz');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      showToast(error.message || 'Nepodařilo se přihlásit', 'error');
      setIsLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F6F8] blueprint-grid">
      <div className="w-full max-w-[460px] animate-fade-up">
        
        {/* Main Login Card */}
        <div className="bg-[#FAFBFC] rounded-[24px] border border-[#E2E5E9] overflow-hidden flex flex-col">
          
          {/* Top accent bar */}
          <div className="h-2 bg-[#5B9AAD]" />
          
          <div className="p-8 md:p-12 space-y-10">
            {/* Logo area - centered */}
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-[#5B9AAD] rounded-xl flex items-center justify-center">
                  <span className="text-[#F8FAFC] font-bold text-xl">JK</span>
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-[#0F172A] leading-tight tracking-tight">JK Stavby</h1>
                  <p className="text-sm text-[#5B9AAD] font-medium leading-tight">Stavební spol.</p>
                </div>
              </div>
            </div>

            {/* Welcome Title */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#0F172A] mb-2 tracking-tight">Vítejte zpět</h2>
              <p className="text-base text-[#475569] font-medium leading-relaxed">Správa projektů a financí JK Stavby</p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* E-mail Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-[#475569] font-bold tracking-wide">
                  E-mail
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 min-h-[56px] bg-[#FAFBFC] border border-[#E2E5E9] rounded-2xl text-lg text-[#0F172A] placeholder-[#5C6878] focus:outline-none focus:border-[#5B9AAD] transition-all font-semibold"
                    placeholder="marek.janota@jkstavby.cz"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm text-[#475569] font-bold tracking-wide">
                    Heslo
                  </label>
                  <Link 
                    to="/forgot-password"
                    className="text-sm text-[#5B9AAD] font-bold hover:text-[#4A8A9D] transition-colors"
                  >
                    Zapomenuto?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 min-h-[56px] bg-[#FAFBFC] border border-[#E2E5E9] rounded-2xl text-lg text-[#0F172A] placeholder-[#5C6878] focus:outline-none focus:border-[#5B9AAD] transition-all font-semibold"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0F172A] transition-colors p-2"
                    aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 min-h-[64px] bg-[#5B9AAD] text-[#F8FAFC] rounded-2xl text-xl font-bold hover:bg-[#4A8A9D] transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Přihlašování...
                  </>
                ) : (
                  <>
                    Vstoupit do dashboardu
                    <ArrowRight size={24} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Credits inside the card */}
            <div className="pt-8 border-t border-[#E2E5E9] text-center space-y-1 text-sm font-medium">
              <p className="text-[#475569]">© 2026 JK Stavební spol. s r.o.</p>
              <p className="text-[#475569]">
                Vytvořil{' '}
                <a 
                  href="https://vilim.one" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#5B9AAD] font-bold hover:text-[#4A8A9D] transition-colors underline-offset-4"
                >
                  vilim.one
                </a>
              </p>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="h-2 bg-[#5B9AAD]" />
        </div>
      </div>
      {ToastComponent}
    </div>
  );
};

export default Login;
