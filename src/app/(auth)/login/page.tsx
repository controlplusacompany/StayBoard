'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// ── Helpers ──────────────────────────────────────────────────────
function setSession(role: string, email: string, propertyId?: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `sb_auth_token=sb-session; path=/; expires=${expires}; Priority=High`;
  document.cookie = `sb_user_role=${role}; path=/; expires=${expires}; Priority=High`;
  document.cookie = `sb_user_email=${email}; path=/; expires=${expires}; Priority=High`;
  if (propertyId) document.cookie = `sb_user_property=${propertyId}; path=/; expires=${expires}; Priority=High`;

  localStorage.setItem('stayboard_user_role', role);
  localStorage.setItem('stayboard_user_email', email);
  if (propertyId) localStorage.setItem('stayboard_user_property', propertyId);
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'owner' | 'admin' | 'reception'>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Login Handler ──────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        setError(`Authentication failed: ${authError.message}`);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('No user found.');
        setIsLoading(false);
        return;
      }

      // Fetch profile to confirm role and property
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, property_id, full_name')
        .eq('id', authData.user.id)
        .single();

      // Use database role if available, otherwise fallback to UI selection
      const finalRole = profile?.role || role;
      setSession(finalRole, authData.user.email || email, profile?.property_id);
      router.push('/dashboard');
    } catch (err: any) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white select-none overflow-hidden font-sans flex items-center justify-center">
      <div className="w-full h-full flex relative">

        {/* ── Left: Form Section ── */}
        <div className="w-full md:w-[50%] p-6 md:p-12 lg:p-16 flex flex-col relative z-20 bg-white h-full">

          <div className="flex-1 flex flex-col justify-center max-h-full">
            <div className="flex items-center justify-center md:justify-start mb-6">
              <img src="/logo-final.png" alt="StayBoard Logo" className="h-[56px] md:h-[68px] w-auto" />
            </div>

            <header className="mb-6 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-serif font-normal text-[#011432] mb-2 tracking-tight">Sign In</h1>
              <p className="text-sm md:text-base text-gray-400 font-medium italic opacity-80">Professional Property Management</p>
            </header>

            {/* Role Toggles */}
            <div className="flex bg-white border border-gray-100 p-1 rounded-2xl mb-8 gap-1 h-11">
              {(['owner', 'admin', 'reception'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setError(''); }}
                  className={`flex-1 flex items-center justify-center rounded-2xl text-[11px] font-bold transition-all duration-300 ${
                    role === r
                      ? 'bg-[#011432] text-white shadow-lg scale-[1.02]'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
                    }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5 animate-in fade-in duration-700">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase ml-1">
                  {role === 'reception' ? 'STAFF EMAIL' : 'EMAIL ADDRESS'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={role === 'reception' ? 'peace-reception@stayboard.com' : 'owner@example.com'}
                  className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[15px] font-medium text-[#011432] focus:border-[#011432] outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase ml-1">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[15px] font-medium text-[#011432] focus:border-[#011432] outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-[#011432]"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-red-500 font-bold ml-1 animate-shake">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 bg-[#011432] hover:bg-black text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/10 active:scale-[0.98] transition-all"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Dashboard</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Global Footer */}
        <div className="fixed bottom-6 left-0 right-0 px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 items-center z-[100] pointer-events-none">
          <div className="hidden md:block" />
          <div className="flex items-center justify-center gap-1.5 opacity-40 pointer-events-auto">
            <p className="text-[9px] font-bold text-[#011432] uppercase tracking-wider whitespace-nowrap">Property Management •</p>
            <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Shielded Access</span>
          </div>
          <div className="flex items-center justify-center md:justify-end gap-6 md:gap-8 mt-4 md:mt-0 pointer-events-auto">
            <Link href="mailto:support@stayboard.com" className="text-[9px] font-bold text-gray-400 hover:text-[#011432] uppercase tracking-wider transition-all whitespace-nowrap">Support</Link>
            <Link href="#" className="text-[9px] font-bold text-gray-400 hover:text-[#011432] uppercase tracking-wider transition-all whitespace-nowrap">Security</Link>
          </div>
        </div>

        {/* ── Right: Illustration Section ── */}
        <div className="hidden md:flex md:w-[50%] bg-[#F8FAFC] relative overflow-hidden items-center justify-center">
          <img
            src="/login-illustration.png"
            alt="StayBoard Illustration"
            className="w-full h-full object-cover object-left opacity-100 mix-blend-multiply"
          />
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent" />
        </div>
      </div>
    </div>
  );
}
