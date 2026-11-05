// src/pages/public/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient.js';
import { Logo } from '../../components/common/Logo.jsx';
import { FloralBg } from '../../components/common/FloralBg.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name').max(120),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters')
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
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
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <FloralBg />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6"><Logo size={36} className="justify-center" /></div>
        <div className="bn-card p-7">
          <h1 className="font-serif text-2xl text-text-main text-center mb-1">Plant your first note</h1>
          <p className="text-sm text-text-muted text-center mb-5">Create your BloomNotes account.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Full name" error={errors.full_name?.message}>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input className="pl-9" placeholder="Jane Bloom" {...register('full_name')} />
              </div>
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input type="email" className="pl-9" placeholder="you@example.com" {...register('email')} />
              </div>
            </Field>
            <Field label="Password" error={errors.password?.message} hint="Min. 8 chars with upper, lower, and a number.">
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input type="password" className="pl-9" placeholder="••••••••" {...register('password')} />
              </div>
            </Field>
            <Field label="Confirm password" error={errors.confirm?.message}>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input type="password" className="pl-9" placeholder="••••••••" {...register('confirm')} />
              </div>
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account…' : <>Create account <ArrowRight size={14} /></>}
            </Button>
          </form>
          <p className="text-center text-sm text-text-muted mt-5">
            Already have an account? <Link to="/login" className="text-accent font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
