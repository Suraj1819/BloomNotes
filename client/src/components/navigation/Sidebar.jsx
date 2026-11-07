
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
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[70] flex flex-col',
          'h-full bg-bg border-r border-border',
          'transition-[transform,width] duration-300 ease-in-out',
          'md:relative md:inset-auto md:z-20 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[68px]' : 'w-[244px]'
        )}
      >

        {/* Header */}
        <div
          className={cn(
            'h-16 min-h-16 shrink-0 flex items-center',
            'border-b border-border',
            collapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >

          {/* Logo */}
          <div className="flex items-center min-w-0 overflow-hidden">
            <Logo size={28} withText={!collapsed} />
          </div>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden md:flex shrink-0 items-center justify-center',
              'h-8 w-8 rounded-lg',
              'text-text-muted hover:text-text-main',
              'hover:bg-highlight transition-colors duration-200',
              collapsed && 'absolute left-[68px] top-4 -translate-x-1/2 z-30 bg-bg border border-border shadow-sm'
            )}
          >
            {collapsed ? (
              <PanelLeft size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="md:hidden h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-text-muted hover:text-text-main hover:bg-highlight transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-4 px-2"
        >

          {!collapsed && (
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
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
                    'group relative flex items-center gap-3',
                    'h-10 rounded-xl px-3',
                    'text-[13px] font-medium',
                    'transition-colors duration-200',
                    isActive
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-highlight',
                    collapsed && 'justify-center px-0'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className="shrink-0"
                    />

                    {!collapsed && (
                      <span className="truncate">{label}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="shrink-0 p-3 border-t border-border">
            <div className="rounded-xl border border-border bg-highlight/50 p-3">

              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
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

            <p className="text-[10px] text-text-muted text-center mt-3">
              Made for your thoughts
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
