import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowRight, Sparkles, Building } from 'lucide-react';
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
          'Cannot connect to backend server. Port 5000 is offline or MongoDB Atlas IP is not whitelisted yet.'
        );
      } else {
        setErrorMessage(
          err?.data?.error?.message ||
            err?.data?.message ||
            'Invalid credentials. Please verify your email and password.'
        );
      }
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 p-0.5 shadow-xl shadow-gold-500/20 mx-auto">
            <div className="w-full h-full bg-forest-950 rounded-[14px] flex items-center justify-center text-gold-400 font-serif font-bold text-xl">
              G
            </div>
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-100">
            GRAND OMR RESIDENCY
          </h1>
          <p className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
            Property Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-6">
          {errorMessage && (
            <ErrorMessage title="Authentication Failed" message={errorMessage} />
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Staff Email"
              type="email"
              placeholder="staff@grandomrresidency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full shadow-lg shadow-gold-500/20"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to PMS
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials Autofill for Reviewers */}
          <div className="pt-4 border-t border-stone-800 space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-semibold text-center">
              Quick Role Switch (Demo Credentials)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickFill('admin@grandomrresidency.com', 'SuperAdmin@2026')
                }
                className="p-2 rounded-lg bg-stone-950 border border-stone-800 hover:border-gold-500/50 text-[11px] text-stone-200 transition-colors"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickFill('manager@grandomrresidency.com', 'Manager@2026')
                }
                className="p-2 rounded-lg bg-stone-950 border border-stone-800 hover:border-gold-500/50 text-[11px] text-stone-200 transition-colors"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickFill('frontdesk@grandomrresidency.com', 'FrontDesk@2026')
                }
                className="p-2 rounded-lg bg-stone-950 border border-stone-800 hover:border-gold-500/50 text-[11px] text-stone-200 transition-colors"
              >
                Front Desk
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-stone-400 hover:text-gold-400 transition-colors"
          >
            ← Return to Guest Website
          </Link>
        </div>
      </div>
    </div>
  );
};
