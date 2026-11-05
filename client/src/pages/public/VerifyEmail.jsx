// src/pages/public/VerifyEmail.jsx
import { Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo.jsx';
import { FloralBg } from '../../components/common/FloralBg.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { MailCheck } from 'lucide-react';

export default function VerifyEmail() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <FloralBg />
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mb-6 flex justify-center"><Logo size={36} /></div>
        <div className="bn-card p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-highlight text-accent">
            <MailCheck size={26} />
          </div>
          <h1 className="font-serif text-2xl text-text-main mb-2">Verify your email</h1>
          <p className="text-sm text-text-muted mb-5">
            We sent a verification link to your inbox. Click it to activate your account.
          </p>
          <Link to="/login"><Button variant="primary" className="w-full">Continue to login</Button></Link>
        </div>
      </div>
    </div>
  );
}
