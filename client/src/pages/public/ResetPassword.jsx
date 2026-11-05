// src/pages/public/ResetPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient.js';
import { Logo } from '../../components/common/Logo.jsx';
import { FloralBg } from '../../components/common/FloralBg.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { z } from 'zod';

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Include an uppercase').regex(/[a-z]/, 'Include a lowercase').regex(/[0-9]/, 'Include a number'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated. Please log in.');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Could not update password');
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
          <h1 className="font-serif text-2xl text-text-main text-center mb-1">Set a new password</h1>
          <p className="text-sm text-text-muted text-center mb-5">Pick a strong password.</p>
          <form onSubmit={submit} className="space-y-4">
            <Field label="New password" error={error}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Updating…' : 'Update password'}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
