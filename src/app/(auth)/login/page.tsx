'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff, ArrowRight, ChevronRight, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [role, setRole] = React.useState<'owner' | 'superadmin' | 'reception'>('owner');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate role-based auth and redirect
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const targetEmail = email || (role === 'owner' ? 'owner@example.com' : role === 'superadmin' ? 'dhagamonish00@gmail.com' : 'reception@example.com');
        
        // ── SET AUTH COOKIES (for Middleware) ──
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `sb_auth_token=valid_prototype_token; path=/; expires=${expires}; Priority=High`;
        document.cookie = `sb_user_role=${role}; path=/; expires=${expires}; Priority=High`;
        document.cookie = `sb_user_email=${targetEmail}; path=/; expires=${expires}; Priority=High`;

        // ── STORAGE FALLBACK ──
        localStorage.setItem('stayboard_user_role', role);
        localStorage.setItem('stayboard_user_email', targetEmail);
        
        window.location.href = '/dashboard';
      }
    }, 1200);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#011432] p-2 md:p-6 overflow-hidden">
      {/* ── Main Container (Card) ── */}
      <div className="w-full max-w-[1060px] h-[min(94vh,740px)] bg-[#F9FAFB] rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl transition-all">
        
        {/* ── Left Side: Authentication Form ── */}
        <div className="w-full md:w-[48%] p-5 md:p-7 lg:p-9 flex flex-col items-stretch overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-1 mb-3">
            <h1 className="text-[#011432] text-lg font-serif font-normal tracking-tight">StayBoard.</h1>
            <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] mt-1.5"></div>
          </div>

          <div className="mb-3">
            <h2 className="text-[26px] font-serif font-normal text-[#011432] leading-tight mb-0.5">Sign In</h2>
            <p className="text-gray-400 text-[12px] font-sans font-medium italic">Manage properties with ease</p>
          </div>

          {/* Role Selection Tabs */}
          <div className="flex bg-gray-200/40 p-0.5 rounded-full mb-4 w-full">
            {[
              { id: 'owner', label: 'Owner' },
              { id: 'superadmin', label: 'Admin' },
              { id: 'reception', label: 'Reception' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as any)}
                className={`flex-1 py-1.5 text-[11px] font-sans font-medium rounded-full transition-all ${
                  role === r.id ? 'bg-white text-[#0259DD] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-sans font-semibold tracking-[0.15em] text-gray-400 uppercase px-4" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={role === 'owner' ? 'owner@example.com' : role === 'superadmin' ? 'dhagamonish00@gmail.com' : 'reception@example.com'}
                className="w-full h-[44px] bg-white border border-gray-100 focus:border-[#0259DD] focus:ring-4 focus:ring-[#0259DD]/5 transition-all rounded-full px-6 text-[13px] font-sans outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-sans font-semibold tracking-[0.15em] text-gray-400 uppercase px-4" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-[44px] bg-white border border-gray-100 focus:border-[#0259DD] focus:ring-4 focus:ring-[#0259DD]/5 transition-all rounded-full px-6 text-[13px] font-sans outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 text-[11px] font-medium"
                >
                   {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-accent w-full group relative flex items-center justify-center gap-3 py-4 rounded-full shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all overflow-hidden mt-1"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="font-semibold tracking-wide">Sign in</span>
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <div className="flex items-center gap-4 my-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">or</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-4 rounded-full font-semibold border border-gray-100 bg-white hover:bg-gray-50 transition-all group scale-[0.98] hover:scale-[1.0]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-[13px] text-gray-600 font-sans font-medium">Continue with Google</span>
            </button>
            
            <p className="text-center mt-1 text-[11px] font-sans font-medium text-gray-400">
              New to StayBoard? <Link href="#" className="text-[#0259DD] font-semibold hover:underline">Get started</Link>
            </p>
          </form>
          
          <div className="mt-auto pt-2 text-center md:text-left border-t border-gray-100 flex items-center justify-between">
            <p className="text-[9px] font-sans font-medium text-gray-400">
              {role === 'superadmin' ? 'Primary Admin' : 'Property Management'} <span className="mx-1">•</span> <span className="underline cursor-help">Secure Login</span>
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-[9px] font-sans font-semibold text-[#0259DD] uppercase tracking-[0.15em] hover:underline">Support</Link>
              <Link href="#" className="text-[9px] font-sans font-semibold text-gray-400 uppercase tracking-[0.15em] hover:underline">Privacy</Link>
            </div>
          </div>
        </div>

        {/* ── Right Side: Impactful Illustration ── */}
        <div className="hidden md:flex md:w-[52%] relative bg-[#F9FAFB] overflow-hidden flex-col group">
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img 
              src="/cityscape.png" 
              alt="Premium Illustration"
              className="w-full h-full object-cover scale-[1.05]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>

          {/* Seamless Blend - Feathering the edge where it meets the form */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#F9FAFB] via-[#F9FAFB]/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-12 backdrop-blur-[3px] z-10 pointer-events-none" />
          
          {/* Subtle Overlay for Premium Feel */}
          <div className="absolute inset-0 z-10 bg-gradient-to-tr from-[#011432]/20 via-transparent to-transparent pointer-events-none" />
          
          {/* Subtle architectural pattern */}
          <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#0259DD 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        </div>
      </div>
    </div>
  );
}
