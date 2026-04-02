'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Auth Logic for Demo
    const role = email === 'dhagamonish00@gmail.com' ? 'superadmin' : 
                 email === 'owner@gmail.com' ? 'owner' : 
                 email === 'reception@gmail.com' ? 'reception' : 'other';
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('stayboard_user_role', role);
      localStorage.setItem('stayboard_user_email', email);
    }

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAF8]">
      {/* ── Left Panel (Desktop Only) ── */}
      <div className="hidden md:flex md:w-[55%] bg-[#0A0A0F] p-16 flex-col justify-start relative overflow-hidden">
        {/* Diamond Grid Texture */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '32px 32px' 
          }}
        ></div>
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <h1 className="text-white text-[40px] font-display">StayBoard</h1>
            <div className="w-[6px] h-[6px] rounded-full bg-[#C8A96E] mt-4"></div>
          </div>
          
          <p className="font-display text-2xl text-[#8B8980] leading-tight">
            All your properties.<br />One morning view.
          </p>
          
          <div className="mt-12 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[#9B9AA6] text-sm">
              <CheckCircle2 size={16} className="text-[#C8A96E]" />
              <span>See every room at a glance</span>
            </div>
            <div className="flex items-center gap-3 text-[#9B9AA6] text-sm">
              <CheckCircle2 size={16} className="text-[#C8A96E]" />
              <span>Track payments in real time</span>
            </div>
            <div className="flex items-center gap-3 text-[#9B9AA6] text-sm">
              <CheckCircle2 size={16} className="text-[#C8A96E]" />
              <span>Built for Indian hotel owners</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative">
        <div className="w-full max-w-[400px] animate-slide-up">
          {/* Mobile Logo (shown only on mobile) */}
          <div className="md:hidden flex flex-col items-center mb-10">
            <div className="flex items-center gap-1">
              <h1 className="text-ink-primary text-3xl font-display">StayBoard</h1>
              <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2"></div>
            </div>
            <p className="text-ink-muted text-sm mt-2">All your properties. One morning view.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl md:text-[28px] font-display text-ink-primary">Welcome back</h2>
            <p className="text-sm text-ink-muted mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="field stagger-item visible">
              <label className="label" htmlFor="email">Email address</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder={email ? "" : "name@example.com"}
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field stagger-item visible">
              <div className="flex justify-between items-center">
                <label className="label" htmlFor="password">Password</label>
                <Link href="#" className="text-xs text-accent hover:underline font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={password ? "" : "••••••••"}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted text-xs hover:text-ink-secondary"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={`btn btn-accent btn--full btn--lg mt-2 ${isLoading ? 'btn--loading' : ''}`}
              disabled={isLoading}
            >
              Sign in
            </button>

            <div className="flex items-center gap-4 my-2">
              <div className="h-[1px] flex-1 bg-border-subtle" />
              <span className="text-xs text-ink-muted uppercase tracking-widest font-medium">or</span>
              <div className="h-[1px] flex-1 bg-border-subtle" />
            </div>

            <button type="button" className="btn btn-ghost btn--full flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332c.708-2.127 2.692-3.711 5.036-3.711z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="mt-12 text-center text-[13px] text-ink-secondary">
            New to StayBoard? <Link href="#" className="text-accent hover:underline font-semibold">Get started</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
