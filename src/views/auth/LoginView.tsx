import React, { useState } from 'react';
import { Lock, Mail, User, Shield, AlertCircle, ArrowRight, Sparkles, Database, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { SupabaseConfigModal } from '../../components/modals/SupabaseConfigModal';

export const LoginView: React.FC = () => {
  const {
    signInWithPassword,
    signUpWithPassword,
    authError,
    isLoading,
    isSupabaseConfigured,
    isSandboxMode,
    enableSandboxMode,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setSuccessMessage(null);

    if (mode === 'signin') {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        console.error('Sign in failed:', error.message);
      }
    } else {
      if (!fullName) {
        setSubmitting(false);
        return;
      }
      const { error } = await signUpWithPassword(email, password, fullName);
      if (error) {
        console.error('Sign up failed:', error.message);
      } else {
        setSuccessMessage('Account created! Please check your email or proceed to sign in.');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-950/50 mb-2">
            A2
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ACADEEMIA <span className="text-indigo-400 font-normal">2.0</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Multi-Tenant, Modular Education Operating Platform
          </p>
        </div>

        {/* Supabase Status / Configuration Advisory */}
        {!isSupabaseConfigured && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <Database className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Supabase Backend Not Configured</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Real authentication and Row Level Security require configuring <code className="bg-amber-900/60 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_URL</code> and <code className="bg-amber-900/60 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> in your environment.
            </p>
            <div className="pt-2 border-t border-amber-850/60 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setConfigModalOpen(true)}
                className="text-xs text-amber-300 hover:text-amber-100 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Supabase Setup Guide & SQL</span>
              </button>
              <Button
                size="sm"
                variant="secondary"
                onClick={enableSandboxMode}
                className="text-xs bg-amber-900/60 hover:bg-amber-800 text-amber-100 border-amber-700/80"
              >
                Launch Sandbox Mode
              </Button>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <Card padding="lg" className="border-slate-800 bg-slate-900/90 backdrop-blur-md">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full Legal Name"
                placeholder="Dr. Arthur Sterling"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required
              />
            )}

            <Input
              label="Work / Educational Email"
              type="email"
              placeholder="user@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            {authError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={submitting || isLoading}
              disabled={!isSupabaseConfigured && !isSandboxMode}
            >
              {mode === 'signin' ? 'Sign In to ACADEEMIA' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 font-mono">
              Database-enforced Row Level Security via Supabase Auth
            </span>
          </div>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-600">
          ACADEEMIA 2.0 Enterprise SaaS · PostgreSQL with Row-Level Isolation
        </div>
      </div>

      {/* Supabase Architecture & Guide Modal */}
      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </div>
  );
};
