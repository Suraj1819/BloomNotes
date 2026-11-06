
// src/components/navigation/Sidebar.jsx

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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[70] flex flex-col',
          'bg-white/35 dark:bg-black/30',
          'backdrop-blur-[2px]',
          'border-r border-white/40 dark:border-white/10',
          'transition-transform duration-200 ease-in-out',

          // Desktop positioning
          'md:relative md:inset-auto md:z-20 md:translate-x-0',
          'md:transition-[width]',

          // Mobile positioning
          mobileOpen ? 'translate-x-0' : '-translate-x-full',

          // Width
          collapsed ? 'w-[68px]' : 'w-[244px]'
        )}
      >
        {/* Header */}
        <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-white/40 dark:border-white/10">
          {!collapsed && <Logo size={28} />}

          {collapsed && (
            <Logo size={28} withText={false} />
          )}

          <button
            onClick={onToggle}
            className="hidden md:inline-flex p-1.5 rounded-lg text-text-muted hover:bg-white/40 dark:hover:bg-white/10"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <PanelLeft size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-text-muted hover:bg-white/40 dark:hover:bg-white/10"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-2 space-y-0.5">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl2 px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-white shadow-soft'
                    : 'text-text-main hover:bg-white/45 dark:hover:bg-white/10',
                  collapsed && 'justify-center px-0'
                )
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="shrink-0 px-4 py-3 border-t border-white/40 dark:border-white/10">
            <div className="rounded-xl2 bg-white/40 dark:bg-white/5 backdrop-blur-sm p-3 text-xs text-text-muted">
              <p className="font-medium text-text-main mb-0.5">
                BloomNotes
              </p>
              <p>Each note blooms in its own theme.</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
