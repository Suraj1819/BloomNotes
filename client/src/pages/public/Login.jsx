// src/pages/public/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient.js';
import { api } from '../../lib/apiClient.js';
import { Logo } from '../../components/common/Logo.jsx';
import { FloralBg } from '../../components/common/FloralBg.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
const SESSION_EXPIRED_KEY = 'bn_session_expired';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const sessionExpired = params.get('reason') === 'session_expired' || sessionStorage.getItem(SESSION_EXPIRED_KEY) === '1';
  if (sessionExpired) sessionStorage.removeItem(SESSION_EXPIRED_KEY);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      // Create the application session row immediately on login.
      try { await api.post('/auth/activity', {}, { isBackground: true }); } catch { /* ignore */ }
      toast.success('Welcome back!');
      navigate('/app');
    } catch (e) {
      toast.error(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <FloralBg />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <Logo size={36} className="justify-center" />
        </div>
        <div className="bn-card p-7">
          <h1 className="font-serif text-2xl text-text-main text-center mb-1">Welcome back</h1>
          <p className="text-sm text-text-muted text-center mb-5">Log in to your garden.</p>

          {sessionExpired && (
            <div className="mb-4 rounded-xl2 bg-highlight border border-border px-4 py-2.5 text-sm text-text-main">
              Your session expired due to 24 hours of inactivity. Please log in again.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Email" error={errors.email?.message}>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input type="email" className="pl-9" placeholder="you@example.com" {...register('email')} />
              </div>
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input type="password" className="pl-9" placeholder="••••••••" {...register('password')} />
              </div>
            </Field>
            <div className="flex items-center justify-between text-xs">
              <Link to="/forgot-password" className="text-text-muted hover:text-accent">Forgot password?</Link>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Logging in…' : <>Log in <ArrowRight size={14} /></>}
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-5">
            New here? <Link to="/register" className="text-accent font-medium">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
