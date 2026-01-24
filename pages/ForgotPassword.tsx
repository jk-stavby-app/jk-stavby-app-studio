
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen blueprint-grid flex items-center justify-center p-4">
      <div className="max-w-[420px] w-full animate-fade-up">
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8 md:p-12">
          {/* Back Link */}
          <Link to="/login" className="flex items-center gap-2 text-[#64748B] hover:text-[#5B9AAD] transition-colors text-sm font-medium mb-8">
            <ArrowLeft size={16} />
            Zpět na přihlášení
          </Link>

          {!isSubmitted ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Obnovení hesla</h1>
                <p className="text-[#64748B] text-sm">Zadejte e-mail a pošleme vám odkaz pro reset hesla</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">E-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors group-focus-within:text-[#5B9AAD]" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vas@email.cz"
                      className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border-none rounded-xl focus:ring-2 focus:ring-[#5B9AAD]/30 outline-none transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#5B9AAD] hover:bg-[#4A8A9D] text-white rounded-xl font-semibold shadow-lg shadow-[#5B9AAD]/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:transform-none"
                >
                  {loading ? 'Odesílání...' : 'Odeslat odkaz'}
                  {!loading && <Send size={18} />}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full mx-auto flex items-center justify-center mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-3">Odkaz byl odeslán</h2>
              <p className="text-[#64748B] text-sm leading-relaxed mb-8">
                Odkaz k obnovení hesla byl odeslán na <span className="font-semibold text-[#0F172A]">{email}</span>. Zkontrolujte prosím svou schránku.
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-3 bg-[#5B9AAD] text-white rounded-xl font-semibold hover:bg-[#4A8A9D] transition-all"
              >
                Zpět na přihlášení
              </Link>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[#64748B] tracking-wide">
          © 2026 JK Stavební spol. s r.o.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
