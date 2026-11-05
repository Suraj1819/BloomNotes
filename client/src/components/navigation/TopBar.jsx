// src/components/navigation/TopBar.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, Search, Plus, Bell, Sun, Moon, Monitor, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { Button } from '../ui/Button.jsx';
import { notesApi, notificationsApi, profileApi } from '../../services/index.js';
import { cn, relativeTime } from '../../lib/utils.js';

export function TopBar({ onOpenMobile }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, profile, signOut } = useAuth();
  const { parentTheme, setParentTheme, activeNoteTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const themeRef = useRef(null);

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 8 }),
    refetchInterval: 60_000, // polling — does NOT extend session
  });
  const unread = (notifs?.items || []).filter((n) => !n.is_read).length;

  useEffect(() => {
    const onClick = (e) => {
      [menuRef, notifRef, themeRef].forEach((r) => {
        if (r.current && !r.current.contains(e.target)) {
          if (r === menuRef) setMenuOpen(false);
          if (r === notifRef) setNotifOpen(false);
          if (r === themeRef) setThemeOpen(false);
        }
      });
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const createNote = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled note' }),
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      navigate(`/app/notes/${note.id}`);
    },
    onError: (e) => toast.error(e.message || 'Could not create note'),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const setTheme = async (t) => {
    setParentTheme(t);
    setThemeOpen(false);
    try { await profileApi.update({ parent_theme: t }); } catch { /* ignore */ }
  };

  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/app/search?q=${encodeURIComponent(q.trim())}`);
  };

  const themeIcon = activeNoteTheme ? <Sparkles size={16} /> :
    parentTheme === 'dark' ? <Moon size={16} /> :
    parentTheme === 'light' ? <Sun size={16} /> : <Monitor size={16} />;

  return (
    <header className="h-16 flex items-center gap-3 px-4 md:px-6 bg-bg border-b border-border">
      <button className="md:hidden p-2 rounded-lg text-text-muted hover:bg-highlight" onClick={onOpenMobile} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <form onSubmit={onSearch} className="flex-1 max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes, journal, vault…"
          className="w-full rounded-xl2 border border-border bg-input pl-9 pr-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
        />
      </form>

      <div className="flex items-center gap-1">
        <Button variant="primary" size="sm" onClick={() => createNote.mutate()} loading={createNote.isPending}>
          <Plus size={14} /> <span className="hidden sm:inline">New note</span>
        </Button>

        {/* Theme control */}
        <div className="relative" ref={themeRef}>
          <button onClick={() => setThemeOpen((o) => !o)} className="p-2 rounded-lg text-text-main hover:bg-highlight" aria-label="Theme">
            {themeIcon}
          </button>
          {themeOpen && (
            <div className="absolute right-0 mt-1 w-44 bn-card p-1 z-30">
              {activeNoteTheme && (
                <p className="px-3 py-1 text-xs text-text-muted">Note theme active — closes on note exit.</p>
              )}
              {[{ id: 'light', label: 'Sakura Blossom', icon: Sun }, { id: 'dark', label: 'Midnight Rose', icon: Moon }, { id: 'system', label: 'System', icon: Monitor }].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTheme(id)} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-xl2 text-sm hover:bg-highlight', parentTheme === id && 'text-accent')}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen((o) => !o)} className="p-2 rounded-lg text-text-main hover:bg-highlight relative" aria-label="Notifications">
            <Bell size={18} />
            {unread > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-1 w-80 bn-card z-30">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-text-main">Notifications</span>
                {unread > 0 && <button onClick={() => markAllRead.mutate()} className="text-xs text-accent">Mark all read</button>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {(notifs?.items || []).length === 0 ? (
                  <p className="px-4 py-6 text-sm text-text-muted text-center">No notifications yet.</p>
                ) : notifs.items.map((n) => (
                  <div key={n.id} className={cn('px-4 py-3 border-b border-border last:border-0', !n.is_read && 'bg-highlight')}>
                    <p className="text-sm text-text-main">{n.title}</p>
                    {n.body && <p className="text-xs text-text-muted mt-0.5">{n.body}</p>}
                    <p className="text-[10px] text-text-muted mt-1">{relativeTime(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 p-1.5 rounded-xl2 hover:bg-highlight">
            <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-medium">
              {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <ChevronDown size={14} className="text-text-muted" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-56 bn-card z-30">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-text-main truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <button onClick={() => { setMenuOpen(false); navigate('/app/settings'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl2 text-sm hover:bg-highlight">
                  <UserIcon size={14} /> Settings
                </button>
                <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl2 text-sm text-red-500 hover:bg-highlight">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sparkles({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 14l.9 2.7L8.6 18l-2.7.9L5 21.6l-.9-2.7L1.4 18l2.7-.9L5 14zm14 0l.9 2.7 2.7.9-2.7.9L19 21.6l-.9-2.7-2.7-.9 2.7-.9L19 14z" />
    </svg>
  );
}
