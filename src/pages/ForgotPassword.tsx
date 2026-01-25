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

  const inputClass = "w-full px-4 py-3 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] placeholder-[#5C6878] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium leading-relaxed min-h-[48px]";

  return (
    <div className="min-h-screen blueprint-grid flex items-center justify-center p-4">
      <div className="max-w-[420px] w-full animate-fade-up">
        <div className="bg-[#FAFBFC] rounded-[32px] border border-[#E2E5E9] p-8 md:p-12 transition-all">
          {/* Back Link */}
          <Link to="/login" className="flex items-center gap-2 text-[#475569] hover:text-[#5B9AAD] transition-colors text-base font-medium leading-relaxed mb-8 group focus:underline">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Zpět na přihlášení
          </Link>

          {!isSubmitted ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-[#0F172A] mb-2 leading-tight">Obnovení hesla</h1>
                <p className="text-base text-[#475569] leading-relaxed">Zadejte e-mail a pošleme vám odkaz pro reset hesla</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="f-email" className="text-sm text-[#475569] font-medium leading-normal">E-mailová adresa</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] transition-colors group-focus-within:text-[#5B9AAD]" size={18} aria-hidden="true" />
                    <input
                      id="f-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vas@email.cz"
                      className={`${inputClass} pl-12`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 min-h-[48px] bg-[#5B9AAD] text-[#F8FAFC] rounded-xl font-medium text-base hover:bg-[#4A8A9D] transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 leading-relaxed"
                >
                  {loading ? 'Odesílání...' : 'Odeslat odkaz'}
                  {!loading && <Send size={18} aria-hidden="true" />}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#ECFDF5] text-[#059669] rounded-full mx-auto flex items-center justify-center mb-6 border border-[#059669]/10">
                <CheckCircle2 size={32} aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A] mb-3 leading-snug">Odkaz byl odeslán</h2>
              <p className="text-base text-[#475569] leading-relaxed mb-8">
                Odkaz k obnovení hesla byl odeslán na <span className="font-semibold text-[#0F172A]">{email}</span>. Zkontrolujte prosím svou schránku.
              </p>
              <Link
                to="/login"
                className="inline-block w-full px-6 py-3 min-h-[48px] bg-[#5B9AAD] text-[#F8FAFC] rounded-xl font-medium text-base hover:bg-[#4A8A9D] transition-colors text-center leading-relaxed"
              >
                Zpět na přihlášení
              </Link>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-[#475569] leading-normal">
          © 2026 JK Stavební spol. s r.o.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
