import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { Button } from '../ui/Button.jsx';
import {
  notesApi,
  notificationsApi,
  profileApi,
} from '../../services/index.js';
import { cn, relativeTime } from '../../lib/utils.js';

import topbarBg from '../../../assets/background/topbar.png';

const dropdownClass = [
  'absolute right-0 mt-2 z-50',
  'rounded-2xl border shadow-xl',
  'border-white/60 bg-white/95',
  'backdrop-blur-2xl',
  'dark:border-white/[0.12]',
  'dark:bg-[#211b29]/95',
  'dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
].join(' ');

const dropdownItemClass = [
  'flex w-full items-center gap-2',
  'rounded-xl px-3 py-2',
  'text-sm text-text-main',
  'transition-colors duration-200',
  'hover:bg-black/[0.04]',
  'dark:hover:bg-white/[0.08]',
].join(' ');

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

  const isDark = parentTheme === 'dark';

  // Notifications
  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 8 }),
    refetchInterval: 60_000,
  });

  const unread = (notifs?.items || []).filter(
    (n) => !n.is_read
  ).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }

      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }

      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false);
      }
    };

    document.addEventListener('mousedown', onClick);

    return () => {
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  // Create Note
  const createNote = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled note' }),

    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      navigate(`/app/notes/${note.id}`);
    },

    onError: (e) => {
      toast.error(e.message || 'Could not create note');
    },
  });

  // Mark All Notifications Read
  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Theme Selection
  const setTheme = async (t) => {
    setParentTheme(t);
    setThemeOpen(false);

    try {
      await profileApi.update({ parent_theme: t });
    } catch {
      // Keep local theme even if profile sync fails.
    }
  };

  // Search
  const onSearch = (e) => {
    e.preventDefault();

    if (q.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  // Theme Icon
  const themeIcon = activeNoteTheme ? (
    <Sparkles size={17} />
  ) : parentTheme === 'dark' ? (
    <Moon size={17} />
  ) : parentTheme === 'light' ? (
    <Sun size={17} />
  ) : (
    <Monitor size={17} />
  );

  return (
    <header
      className={cn(
  'relative z-40 flex h-16 min-h-16 items-center gap-3',
  'px-3 sm:px-4 md:px-6',

  // Light mode border
  'border-b border-pink-200/50',

  // Dark mode: remove visible separator
  'dark:border-b-0',

  'bg-cover bg-center bg-no-repeat',
  'shadow-[0_2px_18px_rgba(30,20,50,0.04)]',
  'dark:shadow-none'
)}
style={{
        backgroundImage: `url(${topbarBg})`,
        backgroundColor: isDark ? '#211b29' : '#fff8fc',
        backgroundBlendMode: isDark ? 'luminosity' : 'normal',
      }}
    >
      {/* Theme-aware background overlay */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 transition-colors duration-300',
          'bg-white/65',
          'dark:bg-[#17131f]/85'
        )}
      />

      {/* All Header Content */}
      <div className="relative z-10 flex w-full min-w-0 items-center gap-3">

        {/* Mobile Menu */}
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-highlight hover:text-text-main md:hidden"
          onClick={onOpenMobile}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <form
          onSubmit={onSearch}
          className="relative min-w-0 max-w-md flex-1"
        >
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes, journal, vault…"
            aria-label="Search"
            className={cn(
              'w-full rounded-xl border py-2 pl-9 pr-3',
              'text-sm text-text-main placeholder:text-text-muted',
              'outline-none transition-all duration-200',
              'border-white/80 bg-white/85 backdrop-blur-md',
              'focus:border-accent/50 focus:ring-2 focus:ring-accent/10',
              'dark:border-white/[0.12]',
              'dark:bg-[#302b38]/85',
              'dark:placeholder:text-white/45',
              'dark:focus:border-accent/50',
              'dark:focus:bg-[#302b38]/95'
            )}
          />
        </form>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">

          {/* New Note */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => createNote.mutate()}
            loading={createNote.isPending}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New note</span>
          </Button>

          {/* Theme Control */}
          <div className="relative" ref={themeRef}>
            <button
              type="button"
              onClick={() => setThemeOpen((o) => !o)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                'text-text-main transition-all duration-200',
                'hover:bg-white/60 hover:text-accent',
                'dark:text-white/85 dark:hover:bg-white/[0.10]',
                themeOpen && 'bg-white/60 text-accent dark:bg-white/[0.10]'
              )}
              aria-label="Theme"
              aria-expanded={themeOpen}
            >
              {themeIcon}
            </button>

            {themeOpen && (
              <div className={cn(dropdownClass, 'w-52 p-2')}>
                {activeNoteTheme && (
                  <p className="px-3 py-2 text-xs leading-relaxed text-text-muted">
                    Note theme active — closes on note exit.
                  </p>
                )}

                {[
                  {
                    id: 'light',
                    label: 'Sakura Blossom',
                    icon: Sun,
                    color: 'text-amber-500',
                  },
                  {
                    id: 'dark',
                    label: 'Midnight Rose',
                    icon: Moon,
                    color: 'text-violet-400',
                  },
                  {
                    id: 'system',
                    label: 'System',
                    icon: Monitor,
                    color: 'text-blue-500',
                  },
                ].map(({ id, label, icon: Icon, color }) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setTheme(id)}
                    className={cn(
                      dropdownItemClass,
                      parentTheme === id &&
                        'bg-accent/10 text-accent dark:bg-accent/15'
                    )}
                  >
                    <Icon size={16} className={color} />

                    <span className="flex-1 text-left">
                      {label}
                    </span>

                    {parentTheme === id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-xl',
                'text-text-main transition-all duration-200',
                'hover:bg-white/60 hover:text-accent',
                'dark:text-white/85 dark:hover:bg-white/[0.10]',
                notifOpen && 'bg-white/60 text-accent dark:bg-white/[0.10]'
              )}
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell size={18} />

              {unread > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-accent dark:border-[#282430]" />
              )}
            </button>

            {notifOpen && (
              <div
                className={cn(
                  dropdownClass,
                  'w-[min(320px,calc(100vw-24px))]'
                )}
              >
                <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 dark:border-white/[0.08]">
                  <span className="text-sm font-semibold text-text-main">
                    Notifications
                  </span>

                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllRead.mutate()}
                      disabled={markAllRead.isPending}
                      className="text-xs font-medium text-accent transition-opacity hover:opacity-75 disabled:opacity-50"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {(notifs?.items || []).length === 0 ? (
                    <p className="px-4 py-7 text-center text-sm text-text-muted">
                      No notifications yet.
                    </p>
                  ) : (
                    notifs.items.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'border-b border-border/60 px-4 py-3 last:border-0',
                          'dark:border-white/[0.06]',
                          !n.is_read &&
                            'bg-accent/[0.045] dark:bg-accent/[0.10]'
                        )}
                      >
                        <p className="text-sm font-medium text-text-main">
                          {n.title}
                        </p>

                        {n.body && (
                          <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                            {n.body}
                          </p>
                        )}

                        <p className="mt-1.5 text-[10px] text-text-muted">
                          {relativeTime(n.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl p-1.5',
                'transition-all duration-200',
                'hover:bg-white/60 dark:hover:bg-white/[0.10]',
                menuOpen && 'bg-white/60 dark:bg-white/[0.10]'
              )}
              aria-label="User menu"
              aria-expanded={menuOpen}
            >
              {/* Profile Avatar */}
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-gradient-to-br from-accent to-pink-400 text-sm font-semibold text-white shadow-sm dark:border-white/20">
                <span>
                  {(profile?.full_name || user?.email || '?')
                    .charAt(0)
                    .toUpperCase()}
                </span>

                {profile?.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile?.full_name || 'User'} profile`}
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>

              <ChevronDown
                size={14}
                className={cn(
                  'text-text-muted transition-transform duration-200',
                  'dark:text-white/70',
                  menuOpen && 'rotate-180'
                )}
              />
            </button>

            {menuOpen && (
              <div className={cn(dropdownClass, 'w-56 overflow-hidden')}>
                <div className="border-b border-border/70 px-4 py-3 dark:border-white/[0.08]">
                  <p className="truncate text-sm font-semibold text-text-main">
                    {profile?.full_name || 'User'}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {user?.email}
                  </p>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/app/settings');
                    }}
                    className={dropdownItemClass}
                  >
                    <UserIcon size={16} className="text-blue-500" />
                    Settings
                  </button>

                  <button
                    type="button"
                    onClick={() => signOut()}
                    className={cn(
                      dropdownItemClass,
                      'text-red-500 hover:bg-red-500/[0.08]',
                      'dark:text-red-400 dark:hover:bg-red-400/[0.10]'
                    )}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Sparkles({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 14l.9 2.7L8.6 18l-2.7.9L5 21.6l-.9-2.7L1.4 18l2.7-.9L5 14zm14 0l.9 2.7 2.7.9-2.7.9L19 21.6l-.9-2.7-2.7-.9 2.7-.9L19 14z" />
    </svg>
  );
}