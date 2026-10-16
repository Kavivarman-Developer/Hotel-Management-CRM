import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Hotel } from 'lucide-react';
import { useLoginMutation } from '../authApi';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const res = await login({ email, password }).unwrap();
      if (res.success) {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      if (err?.status === 'FETCH_ERROR') {
        setErrorMessage(
          'Cannot connect to backend server. Please verify network connectivity.'
        );
      } else {
        setErrorMessage(
          err?.data?.error?.message ||
            err?.data?.message ||
            'Invalid credentials. Please verify your staff email and password.'
        );
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#487FFF] shadow-lg shadow-[#487FFF]/30 mx-auto flex items-center justify-center">
            <Hotel className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-stone-100">
            GRAND OMR RESIDENCY
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#487FFF] font-semibold">
            Property Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-stone-800/80 pb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-stone-100">
              Staff & Management Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-stone-400 mt-1">
              Authorized personnel only. Enter your assigned hotel staff credentials.
            </p>
          </div>

          {errorMessage && (
            <ErrorMessage title="Authentication Failed" message={errorMessage} />
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Staff Email"
              type="email"
              placeholder="e.g. staff@grandomrresidency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-lg shadow-[#487FFF]/20"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to PMS
              </Button>
            </div>
          </form>

          {/* Secure Access Notice */}
          <div className="pt-4 border-t border-slate-100 dark:border-stone-800/80 flex items-start gap-2.5 text-xs text-slate-500 dark:text-stone-400 bg-slate-50 dark:bg-stone-950/60 p-3 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#487FFF] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              New staff member? Contact your <strong className="text-slate-700 dark:text-stone-200">Super Admin</strong> or <strong className="text-slate-700 dark:text-stone-200">Hotel Manager</strong> to create and activate your account credentials.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-slate-500 dark:text-stone-400 hover:text-[#487FFF] transition-colors"
          >
            ← Return to Guest Website
          </Link>
        </div>
      </div>
    </div>
  );
};
