'use client';
export const dynamic = 'force-dynamic';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Building2, KeyRound, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

// ── Component ─────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'owner' | 'admin' | 'staff'>('owner');
  const [step, setStep] = useState<'credentials' | 'pin'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Credentials
  const [email, setEmail] = useState('starrynightroomandhostel@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Staff PIN Check
  const [selectedProperty, setSelectedProperty] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']); // 6 digits
  const pinRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)
  ];

  // Logic Constants
  const STAFF_PASSWORD = 'PasswordforStaff@Controlplusa@2026';
  // Note: OWNER_PASSWORD removed from frontend check to prevent source-code leakage.
  // Supabase will handle the owner password verification securely.

  // ── Step 1: Initial Login ─────────────────────────────────────
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (role === 'owner' || role === 'admin') {
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
          setError('No user found with these credentials.');
          setIsLoading(false);
          return;
        }

        // Success: Store role
        setSession(role, authData.user.email || email);
        router.push('/dashboard');
      } catch (err: any) {
        setError('An unexpected error occurred during login.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Staff Path
      if (password !== STAFF_PASSWORD) {
        setError('Incorrect staff password.');
        setIsLoading(false);
        return;
      }

      // Moving to PIN step
      setStep('pin');
      setIsLoading(false);
    }
  };

  // ── Step 2: Staff PIN Verification ──────────────────────────
  const handlePinVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const enteredPin = pin.join('');
    if (!selectedProperty || enteredPin.length < 6) {
      setError('Select property and enter 6-digit PIN.');
      setIsLoading(false);
      return;
    }

    try {
      const { data: staff, error: staffError } = await supabase
        .from('staff_pins')
        .select('property_id, property_name')
        .eq('property_name', selectedProperty)
        .eq('pin', enteredPin)
        .single();

      if (staffError || !staff) {
        setError('Invalid PIN for the selected property.');
        return;
      }

      setSession('reception', `staff@${selectedProperty.toLowerCase().replace(/\s/g, '')}.stayboard`, staff.property_id);
      router.push(`/property/${staff.property_id}`);
    } catch (err: any) {
      setError('PIN verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── PIN digit handler ────────────────────────────────────────
  const handlePinInput = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...pin];
    next[i] = val.slice(-1);
    setPin(next);
    if (val && i < 5) pinRefs[i + 1].current?.focus();
  };

  const handlePinKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      pinRefs[i - 1].current?.focus();
    }
  };

  return (
    <div className="h-screen w-full bg-white select-none overflow-hidden font-sans flex items-center justify-center">
      <div className="w-full h-full flex relative">

        {/* ── Left: Form Section ── */}
        <div className="w-full md:w-[50%] p-6 md:p-12 lg:p-16 flex flex-col relative z-20 bg-white h-full transition-all duration-700">

          <div className="flex-1 flex flex-col justify-center max-h-full">
            {/* Logo */}
            <div className="flex items-center justify-center md:justify-start mb-6">
              <img src="/logo-final.png" alt="StayBoard Logo" className="h-[56px] md:h-[68px] w-auto" />
            </div>

            <header className="mb-6 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-serif font-normal text-[#011432] mb-2 tracking-tight">Sign In</h1>
              <p className="text-sm md:text-base text-gray-400 font-medium italic opacity-80">Manage properties with ease</p>
            </header>

          {/* Role Toggles */}
          <div className="flex bg-white border border-gray-100 p-1 rounded-2xl mb-6 md:mb-8 gap-1 h-11">
            {(['owner', 'admin', 'reception'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  if (r === 'reception') setRole('staff');
                  else if (r === 'admin') setRole('admin');
                  else setRole('owner');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center rounded-2xl text-[12px] font-bold transition-all duration-300 ${
                  (r === 'owner' && role === 'owner') ||
                  (r === 'admin' && role === 'admin') ||
                  (r === 'reception' && role === 'staff')
                    ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
                  }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {step === 'credentials' ? (
            <div className="flex flex-col animate-in fade-in duration-700">
              <form onSubmit={handleInitialSubmit} className="flex flex-col gap-4 md:gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase ml-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[15px] font-medium text-[#011432] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
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
                      className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[15px] font-medium text-[#011432] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-accent"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-500 font-medium ml-1 animate-shake">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-16 bg-accent hover:bg-accent-dark text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98] transition-all"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>


              </form>
            </div>
          ) : (
            <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
              <button
                onClick={() => setStep('credentials')}
                className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-accent mb-6 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to login
              </button>

              <form onSubmit={handlePinVerification} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase ml-1">PROPERTY</label>
                  <select
                    className="w-full h-14 bg-[#FCFCFD] border border-gray-100 rounded-2xl px-6 text-sm font-medium text-[#011432] focus:border-accent focus:bg-white transition-all outline-none cursor-pointer appearance-none"
                    value={selectedProperty}
                    onChange={e => setSelectedProperty(e.target.value)}
                    required
                  >
                    <option value="">Choose property...</option>
                    <option value="The Peace">The Peace (PEACE01)</option>
                    <option value="The Starry Nights">The Starry Nights (STARRY01)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase text-center">6-digit Security Pin</label>
                  <div className="flex gap-2 justify-center">
                    {pin.map((digit, i) => (
                      <input
                        key={i}
                        ref={pinRefs[i]}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handlePinInput(i, e.target.value)}
                        onKeyDown={e => handlePinKeyDown(i, e)}
                        className="w-12 h-14 text-center text-xl font-bold bg-[#FCFCFD] border border-gray-100 rounded-xl focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/5 outline-none transition-all shadow-sm"
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading || !selectedProperty || pin.join('').length < 6}
                  className="w-full h-16 bg-accent hover:bg-accent-dark text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Unlock Access
                </button>
              </form>
            </div>
          )}

          </div>
        </div>

        {/* Global Footer (Centered Metadata + Right Utility Links) */}
        <div className="fixed bottom-6 left-0 right-0 px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 items-center z-[100] pointer-events-none">
          {/* Left: Empty for balance */}
          <div className="hidden md:block" />

          {/* Center: Metadata */}
          <div className="flex items-center justify-center gap-1.5 opacity-40 pointer-events-auto">
            <p className="text-[9px] font-bold text-[#011432] uppercase tracking-wider whitespace-nowrap">Property Management •</p>
            <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Secure Login</span>
          </div>

          {/* Right: Utility Links */}
          <div className="flex items-center justify-center md:justify-end gap-6 md:gap-8 mt-4 md:mt-0 pointer-events-auto">
            <Link href="mailto:team@bycontrolplusa.co.in" className="text-[9px] font-bold text-gray-400 hover:text-accent uppercase tracking-wider transition-all whitespace-nowrap">Support</Link>
            <Link href="#" className="text-[9px] font-bold text-gray-400 hover:text-accent uppercase tracking-wider transition-all whitespace-nowrap">Privacy</Link>
          </div>
        </div>

        {/* ── Right: Illustration Section ── */}
        <div className="hidden md:flex md:w-[50%] bg-white relative overflow-hidden items-center justify-center">

          <img
            src="/login-illustration.png"
            alt="StayBoard Illustration"
            className="w-full h-full object-cover object-left opacity-100 mix-blend-multiply"
          />

          {/* Light Overlay for fading effect if needed */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent" />
        </div>
      </div>
    </div>
  );
}
