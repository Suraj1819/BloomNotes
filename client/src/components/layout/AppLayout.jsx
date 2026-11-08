
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
      {/* Background Overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-white/15 dark:bg-black/25" />

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div className="relative z-10 flex min-w-0 min-h-0 flex-1 flex-col">
        <TopBar onOpenMobile={() => setMobileOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
