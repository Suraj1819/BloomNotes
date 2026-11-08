// src/pages/public/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient.js';
import { Logo } from '../../components/common/Logo.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

import noteCardBackground from '../../../assets/background/favvv.png';
import registerBackground from '../../../assets/background/favv.png';

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name').max(120),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters')
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '', confirm: '' },
  });

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { full_name: values.full_name } },
      });

      if (error) throw error;

      if (!data.session) {
        // Email verification flow.
        toast.success('Account created — check your email to verify.');
        navigate('/verify-email');
      } else {
        toast.success('Welcome to BloomNotes!');
        navigate('/app');
      }
    } catch (e) {
      toast.error(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#F8EFF3] p-4 sm:p-6 dark:bg-[#211722]">
      {/* Full-page background image */}
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <img
          src={registerBackground}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Subtle page overlay; image remains visible */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[1] bg-[#F8EFF3]/35 dark:bg-[#211722]/55"
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-7 text-center">
          <Logo size={36} className="justify-center" />
        </div>

        {/* Large registration card with full-card notecard artwork */}
        <div className="bn-card !bg-transparent relative isolate w-full overflow-hidden rounded-3xl p-7 sm:p-9">
          {/* Full-card notecard background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl"
          >
            <img
              src={noteCardBackground}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            {/* Readability overlay */}
            <div className="absolute inset-0 bg-white/55 dark:bg-[#241820]/75" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-rose-100/25 dark:from-rose-950/10 dark:to-black/15" />
          </div>

          {/* Registration form content */}
          <div className="relative z-10">
            <h1 className="mb-1 text-center font-serif text-2xl text-text-main sm:text-3xl">
              Plant your first note
            </h1>

            <p className="mb-7 text-center text-sm text-text-muted">
              Create your BloomNotes account.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Field label="Full name" error={errors.full_name?.message}>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <Input
                    className="pl-10"
                    placeholder="Jane Bloom"
                    autoComplete="name"
                    {...register('full_name')}
                  />
                </div>
              </Field>

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

              <Field
                label="Password"
                error={errors.password?.message}
                hint="Min. 8 chars with upper, lower, and a number."
              >
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                </div>
              </Field>

              <Field label="Confirm password" error={errors.confirm?.message}>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register('confirm')}
                  />
                </div>
              </Field>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  'Creating account…'
                ) : (
                  <>
                    Create account <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-text-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-accent hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
