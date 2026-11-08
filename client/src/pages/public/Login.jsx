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
import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Mail, Lock, ArrowRight } from 'lucide-react';

import noteCardBackground from '../../../assets/background/favvv.png';
import loginBackground from '../../../assets/background/favv.png';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

const SESSION_EXPIRED_KEY = 'bn_session_expired';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const sessionExpired =
    params.get('reason') === 'session_expired' ||
    sessionStorage.getItem(SESSION_EXPIRED_KEY) === '1';

  if (sessionExpired) {
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // Create the application session row immediately on login.
      try {
        await api.post('/auth/activity', {}, { isBackground: true });
      } catch {
        // Ignore background activity errors.
      }

      toast.success('Welcome back!');
      navigate('/app');
    } catch (e) {
      toast.error(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#F8EFF3] p-4 sm:p-6 dark:bg-[#211722]">
      {/* Page background */}
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <img
          src={loginBackground}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[1] bg-[#F8EFF3]/35 dark:bg-[#211722]/55"
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-7 text-center">
          <Logo size={36} className="justify-center" />
        </div>

        {/* Large login card with the notecard artwork covering the full card. */}
        <div className="bn-card !bg-transparent relative isolate w-full overflow-hidden rounded-3xl p-7 sm:p-9">
          {/* Full-card notecard background image */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl"
          >
            <img
              src={noteCardBackground}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div className="absolute inset-0 bg-white/55 dark:bg-[#241820]/75" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-rose-100/25 dark:from-rose-950/10 dark:to-black/15" />
          </div>

          {/* Login form content */}
          <div className="relative z-10">
            <h1 className="mb-1 text-center font-serif text-2xl text-text-main sm:text-3xl">
              Welcome back
            </h1>

            <p className="mb-7 text-center text-sm text-text-muted">
              Log in to your garden.
            </p>

            {sessionExpired && (
              <div className="mb-5 rounded-xl2 border border-border bg-highlight/90 px-4 py-3 text-sm text-text-main">
                Your session expired due to 24 hours of inactivity. Please log in again.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Field label="Email" error={errors.email?.message}>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <Input
                    type="email"
                    className="pl-10"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email')}
                  />
                </div>
              </Field>

              <Field label="Password" error={errors.password?.message}>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                </div>
              </Field>

              <div className="flex items-center justify-end text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-text-muted transition-colors hover:text-accent"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  'Logging in…'
                ) : (
                  <>
                    Log in <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-text-muted">
              New here?{' '}
              <Link to="/register" className="font-semibold text-accent hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
