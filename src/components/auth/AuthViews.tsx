import React, { useState } from 'react';
import { Mail, Lock, User, Globe, Hand, Volume2, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserProfile, SupportedLanguageCode, InputMethod, OutputMethod } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/signVocabulary';
import { ApiClient } from '../../services/api';
import { speechService } from '../../services/speech';

interface AuthViewsProps {
  onAuthSuccess: (user: UserProfile) => void;
  isHighContrast?: boolean;
}

export const AuthViews: React.FC<AuthViewsProps> = ({ onAuthSuccess, isHighContrast = false }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLanguageCode>('en');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg(null);
      speechService.playTone('click');
      const res = await ApiClient.login(email, password);
      speechService.playTone('success');
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
      speechService.playTone('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg(null);
      speechService.playTone('click');
      const res = await ApiClient.register({
        fullName,
        email,
        password,
        confirmPassword,
        preferredLanguage,
        communicationPreference: 'text',
        outputPreference: 'text',
      });
      speechService.playTone('success');
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
      speechService.playTone('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await ApiClient.forgotPassword(email);
      setSuccessMsg(`Reset instructions sent! Test reset token: ${res.tempResetCode || 'VS-8842'}`);
      setResetCode(res.tempResetCode || 'VS-8842');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error requesting reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await ApiClient.resetPassword(email, resetCode, newPassword);
      setSuccessMsg('Password has been reset! You can now log in.');
      setTimeout(() => {
        setMode('login');
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Autofill
  const handleQuickDemoFill = () => {
    setEmail('praveenagaraj19@gmail.com');
    setPassword('Password@123');
    speechService.playTone('click');
  };

  return (
    <div
      className={`min-h-full flex flex-col justify-center p-4 ${
        isHighContrast ? 'bg-black text-yellow-300' : 'bg-slate-950 text-white'
      }`}
    >
      <div className="w-full max-w-sm mx-auto space-y-5">
        {/* App Branding Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-500/20">
            V2S
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">Voice2Sense</h1>
          <p className="text-xs text-white/60">
            Multimodal Accessibility: Voice • Text • Sign Language
          </p>
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs">
            {successMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form
            onSubmit={handleLogin}
            className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-bold text-white">Sign In to Your Account</h2>
              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="text-[10px] font-semibold text-emerald-400 hover:underline"
              >
                Autofill Verified User
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/70 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-medium text-white/70">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg mt-2"
            >
              <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-xs text-white/60">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Register here
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form
            onSubmit={handleRegister}
            className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-3 max-h-[75vh] overflow-y-auto scrollbar-thin"
          >
            <h2 className="text-sm font-bold text-white">Create Accessibility Profile</h2>

            <div>
              <label className="block text-[11px] font-medium text-white/70 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-white/40" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/70 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">Confirm</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat pass"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/70 mb-1">Preferred Language</label>
              <select
                value={preferredLanguage}
                onChange={e => setPreferredLanguage(e.target.value as SupportedLanguageCode)}
                className="w-full bg-black/50 border border-white/10 text-white rounded-2xl p-2 text-xs focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg mt-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-xs text-white/60">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-3.5">
            <h2 className="text-sm font-bold text-white">Reset Account Password</h2>
            <p className="text-xs text-white/60">
              Enter your email to obtain a security reset verification code.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
              >
                Request Reset Token
              </button>
            </form>

            {resetCode && (
              <form onSubmit={handleResetPassword} className="pt-2 border-t border-white/10 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-white/70 mb-1">Reset Code</label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/70 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New secure password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Reset Password
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-white/60 hover:text-white"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
