// src/pages/public/Landing.jsx
import { Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { ArrowRight, NotebookPen, ShieldCheck, Sparkles, CalendarClock, FolderTree, Lock, Sun, Moon } from 'lucide-react';

// 👇 background image import
import landingBg from '../../../assets/background/lavender.png';

export default function Landing() {
  const { session } = useAuth();
  const { parentTheme, setParentTheme } = useTheme();

  const isDark = parentTheme === 'dark';
  const toggleTheme = () => setParentTheme(isDark ? 'light' : 'dark');

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ===== Background image (lavender.jpg) ===== */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `url("${landingBg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
        aria-hidden="true"
      />
      {/* Soft veil for readability — no blur, image stays sharp */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 dark:bg-black/55"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(250,240,255,0.08))',
        }}
        aria-hidden="true"
      />

      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/80 text-text-main hover:bg-highlight transition-colors"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {session ? (
            <Link to="/app"><Button variant="primary" size="sm">Open app<ArrowRight size={14} /></Button></Link>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link to="/register"><Button variant="primary" size="sm">Get started</Button></Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <section>
          <span className="bn-chip mb-5"><Sparkles size={12} /> Floral notes, beautifully organized</span>
          <h1 className="text-5xl md:text-6xl font-serif font-semibold leading-tight text-text-main">
            Your thoughts,<br />
            <span style={{ color: 'rgb(var(--c-accent))' }}>in full bloom.</span>
          </h1>
          <p className="mt-5 text-lg text-text-muted max-w-md">
            BloomNotes is a premium personal notes, journal and private vault — wrapped in a soft floral design system with eight seasonal note themes.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register"><Button variant="primary" size="lg">Create your garden<ArrowRight size={16} /></Button></Link>
            <Link to="/login"><Button variant="outline" size="lg">Log in</Button></Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-3 text-sm text-text-muted">
            <li className="flex items-center gap-2"><NotebookPen size={14} /> Rich-text editor</li>
            <li className="flex items-center gap-2"><FolderTree size={14} /> Folders & tags</li>
            <li className="flex items-center gap-2"><CalendarClock size={14} /> Reminders</li>
            <li className="flex items-center gap-2"><ShieldCheck size={14} /> Row-level security</li>
            <li className="flex items-center gap-2"><Lock size={14} /> Private file vault</li>
            <li className="flex items-center gap-2"><Sparkles size={14} /> Eight floral themes</li>
          </ul>
        </section>

        <section className="relative">
          <div className="bn-card p-6 rotate-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: 'rgb(var(--c-accent))' }} />
                <span className="text-sm font-medium text-text-main">Sakura Pink</span>
              </div>
              <span className="text-xs text-text-muted">Theme 1 / 8</span>
            </div>
            <h3 className="font-serif text-2xl text-text-main mb-2">Morning pages</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Today I planted three new ideas. One for a small library app, one for a journal, one for a private space where my notes can simply exist…
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['morning','ideas','calm'].map((t) => <span key={t} className="bn-chip">{t}</span>)}
            </div>
          </div>
          <div className="bn-card p-5 absolute -bottom-6 -left-6 w-44 rotate-[-3deg] hidden sm:block">
            <p className="text-xs text-text-muted">Reminder</p>
            <p className="text-sm font-medium text-text-main">Water the garden — 6:30 PM</p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 text-center text-xs text-text-muted pb-8">
        © {new Date().getFullYear()} BloomNotes — made with care.
      </footer>
    </div>
  );
}