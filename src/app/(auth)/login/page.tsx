'use client';

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
  const [role, setRole] = useState<'owner' | 'staff'>('owner');
  const [step, setStep] = useState<'credentials' | 'pin'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Credentials
  const [email, setEmail] = useState('starrynightsroomandhostel@gmail.com');
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

    if (role === 'owner') {
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

        // Success: Store role in metadata or profiles if needed, but for now we trust the owner role
        setSession('owner', authData.user.email || email);
        router.push('/dashboard');
      } catch (err: any) {
        setError('An unexpected error occurred during owner login.');
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
    <div className="h-screen w-full flex items-center justify-center bg-[#011432] p-4 md:p-10 select-none overflow-hidden">
      <div className="w-full max-w-[1240px] h-[86vh] min-h-[640px] bg-white rounded-[48px] overflow-hidden flex shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative">
        
        {/* ── Left: Form Section ── */}
        <div className="w-full md:w-[45%] p-10 md:p-16 flex flex-col relative z-20 bg-white">
          
          {/* Logo */}
          <div className="flex items-center gap-1 mb-10">
            <span className="text-[20px] font-serif font-medium text-[#011432] tracking-tight">StayBoard.</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] mt-1" />
          </div>

          <header className="mb-10">
            <h1 className="text-4xl font-serif font-normal text-[#011432] mb-2">Sign In</h1>
            <p className="text-sm text-gray-400 font-medium italic">Manage properties with ease</p>
          </header>

          {/* Role Toggles */}
          <div className="flex bg-[#F3F4F6] p-1 rounded-2xl mb-12 gap-1 h-12">
            {(['owner', 'admin', 'reception'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r === 'reception' ? 'staff' : 'owner'); setError(''); }}
                className={`flex-1 flex items-center justify-center rounded-xl text-[12px] font-bold transition-all duration-300 ${
                  (r === 'owner' && role === 'owner') || (r === 'reception' && role === 'staff')
                    ? 'bg-white text-[#011432] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {step === 'credentials' ? (
            <div className="flex flex-col flex-1 animate-in fade-in duration-700">
              <form onSubmit={handleInitialSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase ml-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="w-full h-14 bg-[#FCFCFD] border border-gray-100 rounded-2xl px-6 text-sm font-medium text-[#011432] focus:border-[#4B8EFB] focus:bg-white transition-all outline-none"
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
                      className="w-full h-14 bg-[#FCFCFD] border border-gray-100 rounded-2xl px-6 text-sm font-medium text-[#011432] focus:border-[#4B8EFB] focus:bg-white transition-all outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-[#4B8EFB]"
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
                  className="w-full h-16 bg-gradient-to-r from-[#599BFB] to-[#2563EB] text-white rounded-[24px] font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
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

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <span className="relative px-4 bg-white text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">OR</span>
                </div>

                <button
                  type="button"
                  className="w-full h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                  Continue with Google
                </button>

                <p className="text-center text-[11px] font-medium text-gray-400 mt-2">
                  New to StayBoard? <Link href="#" className="text-[#2563EB] font-bold hover:underline">Get started</Link>
                </p>
              </form>
            </div>
          ) : (
            <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
               <button 
                onClick={() => setStep('credentials')}
                className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#2563EB] mb-10 transition-colors"
               >
                 <ArrowLeft size={14} />
                 Back to login
               </button>

               <form onSubmit={handlePinVerification} className="flex flex-col gap-8">
                 <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase ml-1">PROPERTY</label>
                  <select
                    className="w-full h-14 bg-[#FCFCFD] border border-gray-100 rounded-2xl px-6 text-sm font-medium text-[#011432] focus:border-[#4B8EFB] focus:bg-white transition-all outline-none cursor-pointer appearance-none"
                    value={selectedProperty}
                    onChange={e => setSelectedProperty(e.target.value)}
                    required
                  >
                    <option value="">Choose property...</option>
                    <option value="The Peace">The Peace (PEACE01)</option>
                    <option value="The Starry Nights">The Starry Nights (STARRY01)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-4">
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
                        className="w-12 h-14 text-center text-xl font-bold bg-[#FCFCFD] border border-gray-100 rounded-xl focus:border-[#4B8EFB] focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm"
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading || !selectedProperty || pin.join('').length < 6}
                  className="w-full h-16 bg-gradient-to-r from-[#599BFB] to-[#2563EB] text-white rounded-[24px] font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Unlock Access
                </button>
               </form>
            </div>
          )}

          {/* Footer Information */}
          <div className="mt-auto pt-8 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-1.5 opacity-40">
              <p className="text-[9px] font-bold text-[#011432] uppercase tracking-wider">Property Management •</p>
              <span className="text-[9px] font-medium text-gray-500">Secure Login</span>
            </div>
            <div className="flex gap-4">
              <Link href="#" className="text-[10px] font-bold text-gray-300 hover:text-gray-500 uppercase tracking-widest transition-colors">Support</Link>
              <Link href="#" className="text-[10px] font-bold text-gray-300 hover:text-gray-500 uppercase tracking-widest transition-colors">Privacy</Link>
            </div>
          </div>
        </div>

        {/* ── Right: Illustration Section ── */}
        <div className="hidden md:flex md:w-[55%] bg-[#F8FAFC] relative overflow-hidden items-center justify-center">
          {/* Subtle Geometric Textures */}
          <div className="absolute inset-0 opacity-[0.4] pointer-events-none" 
            style={{ 
              backgroundImage: 'radial-gradient(#E2E8F0 1.5px, transparent 1.5px)', 
              backgroundSize: '40px 40px' 
            }} 
          />
          
          <img 
            src="/login-illustration.png" 
            alt="StayBoard Illustration" 
            className="w-full h-full object-cover object-left opacity-[0.9] mix-blend-multiply"
          />

          {/* Light Overlay for fading effect if needed */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent" />
        </div>
      </div>
    </div>
  );
}
