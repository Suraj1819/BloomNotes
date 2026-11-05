// src/components/layout/AppLayout.jsx

import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '../navigation/Sidebar.jsx';
import { TopBar } from '../navigation/TopBar.jsx';

import lavenderBg from '../../../assets/background/lavender.png';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative isolate flex h-screen overflow-hidden">
      {/* Global lavender background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${lavenderBg})` }}
      />

      {/* Background overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-white/25 dark:bg-black/25"
      />

      {/* Sidebar */}
      <div className="relative z-10 flex h-full shrink-0">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobile={() => setMobileOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}