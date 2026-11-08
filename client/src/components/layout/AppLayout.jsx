
// src/components/layout/AppLayout.jsx

import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '../navigation/Sidebar.jsx';
import { TopBar } from '../navigation/TopBar.jsx';

import lavenderBg from '../../../assets/background/favv1.png';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="relative flex h-screen overflow-hidden"
      style={{
        backgroundColor: '#f8f5ff',
        backgroundImage: `url(${lavenderBg})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '100% 100%',
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 z-0 bg-white/15 dark:bg-black/25 pointer-events-none" />

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0 min-h-0">
        <TopBar onOpenMobile={() => setMobileOpen(true)} />

        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
