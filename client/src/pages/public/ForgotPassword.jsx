// src/pages/public/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient.js';
import { Logo } from '../../components/common/Logo.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Mail } from 'lucide-react';

import noteCardBackground from '../../../assets/background/favv.png';
import pageBackground from '../../../assets/background/favv.png';

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
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#F8EFF3] p-4 sm:p-6 dark:bg-[#211722]">
      {/* Full-page background image */}
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <img
          src={pageBackground}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Subtle overlay keeps the page content readable */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[1] bg-[#F8EFF3]/35 dark:bg-[#211722]/55"
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-7 text-center">
          <Logo size={36} className="justify-center" />
        </div>

        {/* Large card with full-card notecard artwork */}
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

            <div className="absolute inset-0 bg-white/55 dark:bg-[#241820]/75" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-rose-100/25 dark:from-rose-950/10 dark:to-black/15" />
          </div>

          {/* Forgot password content */}
          <div className="relative z-10">
            <h1 className="mb-1 text-center font-serif text-2xl text-text-main sm:text-3xl">
              Reset password
            </h1>

            <p className="mb-7 text-center text-sm text-text-muted">
              We'll email you a reset link.
            </p>

            {sent ? (
              <div className="rounded-xl2 border border-border bg-highlight/90 px-4 py-4 text-sm leading-6 text-text-main">
                Check <strong className="break-all">{email}</strong> for a reset link.
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <Field label="Email">
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                </Field>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            )}

            <p className="mt-7 text-center text-sm text-text-muted">
              <Link
                to="/login"
                className="font-semibold text-accent hover:underline"
              >
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
