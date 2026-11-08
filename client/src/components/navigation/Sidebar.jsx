
import { NavLink } from 'react-router-dom';
import { Logo } from '../common/Logo.jsx';
import { cn } from '../../lib/utils.js';

import {
  LayoutDashboard,
  NotebookPen,
  Star,
  Pin,
  Clock,
  FolderTree,
  BookOpen,
  Bell,
  Sparkles,
  Lock,
  Trash2,
  Settings,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';

const items = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/notes', label: 'All Notes', icon: NotebookPen },
  { to: '/app/favorites', label: 'Favorites', icon: Star },
  { to: '/app/pinned', label: 'Pinned', icon: Pin },
  { to: '/app/recent', label: 'Recent', icon: Clock },
  { to: '/app/folders', label: 'Folders', icon: FolderTree },
  { to: '/app/journal', label: 'Journal', icon: BookOpen },
  { to: '/app/reminders', label: 'Reminders', icon: Bell },
  { to: '/app/personal-space', label: 'Personal Space', icon: Sparkles },
  { to: '/app/vault', label: 'Vault', icon: Lock },
  { to: '/app/trash', label: 'Trash', icon: Trash2 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}) {
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/25 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[70] flex flex-col',
          'h-full overflow-hidden',
          'border-r border-white/30 dark:border-white/10',
          'bg-transparent',
          'shadow-[8px_0_40px_rgba(0,0,0,0.05)]',
          'transition-[transform,width] duration-300 ease-in-out',
          'md:relative md:inset-auto md:z-20 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'w-[244px]',
          collapsed ? 'md:w-[68px]' : 'md:w-[244px]'
        )}
      >
        {/* Floral Background Image */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/background/sidebar41.png')",
          }}
          aria-hidden="true"
        />

        {/* Light / Dark Overlay - No Blur */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-white/70 dark:bg-[#17131A]/80"
          aria-hidden="true"
        />

        {/* Subtle Accent Glow */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -right-16 top-20 h-48 w-48 rounded-full bg-accent/10 blur-[70px]" />
          <div className="absolute -left-20 bottom-20 h-48 w-48 rounded-full bg-accent-2/10 blur-[70px]" />
        </div>

        {/* Header */}
        <div
          className={cn(
            'relative z-10 flex h-16 min-h-16 shrink-0 items-center',
            'border-b border-border/40',
            collapsed
              ? 'justify-center px-2 md:justify-center'
              : 'justify-between px-4'
          )}
        >
          <div className="flex min-w-0 items-center overflow-hidden">
            <Logo size={28} withText={!collapsed} />
          </div>

          {/* Desktop Collapse */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden md:flex shrink-0 items-center justify-center',
              'h-8 w-8 rounded-lg',
              'border border-transparent',
              'text-text-muted hover:text-accent',
              'hover:bg-accent/10 hover:border-accent/15',
              'transition-all duration-200',
              collapsed &&
                'absolute left-[68px] top-4 z-30 -translate-x-1/2 bg-card/90 border-border/60 shadow-md'
            )}
          >
            {collapsed ? (
              <PanelLeft size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-highlight hover:text-text-main md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-5"
        >
          {!collapsed && (
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted/80">
              Workspace
            </p>
          )}

          <div className="space-y-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onCloseMobile}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex h-10 items-center gap-3',
                    'rounded-xl px-3',
                    'text-[13px] font-medium',
                    'transition-all duration-200',

                    isActive
                      ? [
                          'border border-accent/20',
                          'bg-accent/12 text-accent',
                          'shadow-[0_3px_12px_rgba(120,90,180,0.08)]',
                          'dark:bg-accent/20',
                        ]
                      : [
                          'border border-transparent',
                          'text-text-muted',
                          'hover:bg-white/35',
                          'hover:text-text-main',
                          'dark:hover:bg-white/[0.06]',
                        ],

                    collapsed && 'md:justify-center md:px-0'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                    )}

                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={cn(
                        'shrink-0 transition-colors',
                        isActive
                          ? 'text-accent'
                          : 'text-text-muted group-hover:text-accent'
                      )}
                    />

                    <span
                      className={cn(
                        'truncate transition-opacity duration-200',
                        collapsed && 'md:hidden'
                      )}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            'relative z-10 shrink-0 border-t border-border/40',
            collapsed ? 'p-2 md:p-2' : 'p-3'
          )}
        >
          {!collapsed && (
            <>
              <div className="rounded-xl border border-white/50 bg-white/45 p-3 dark:border-white/10 dark:bg-[#241B22]/55">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/15 bg-accent/10 text-accent">
                    <Sparkles size={15} />
                  </div>

                  <p className="text-xs font-semibold text-text-main">
                    BloomNotes
                  </p>
                </div>

                <p className="text-[11px] leading-relaxed text-text-muted">
                  Every note has its own space to bloom.
                </p>
              </div>

              <p className="mt-3 text-center text-[10px] text-text-muted/80">
                Made for your thoughts
              </p>
            </>
          )}

          {collapsed && (
            <div className="hidden justify-center md:flex">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent"
                title="BloomNotes"
              >
                <Sparkles size={17} />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
