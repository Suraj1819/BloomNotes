// src/pages/public/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient.js';
import { Logo } from '../../components/common/Logo.jsx';
import { FloralBg } from '../../components/common/FloralBg.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Reset link sent.');
    } catch (err) {
      toast.error(err.message || 'Could not send reset email');
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
          <h1 className="font-serif text-2xl text-text-main text-center mb-1">Reset password</h1>
          <p className="text-sm text-text-muted text-center mb-5">We'll email you a reset link.</p>
          {sent ? (
            <div className="rounded-xl2 bg-highlight border border-border px-4 py-3 text-sm text-text-main">
              Check <strong>{email}</strong> for a reset link.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <Field label="Email">
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="you@example.com" />
                </div>
              </Field>
              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Sending…' : 'Send reset link'}</Button>
            </form>
          )}
          <p className="text-center text-sm text-text-muted mt-5"><Link to="/login" className="text-accent font-medium">Back to login</Link></p>
        </div>
      </div>
    </div>
  );
}
