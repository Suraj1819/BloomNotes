// src/components/layout/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar.jsx';
import { TopBar } from '../navigation/TopBar.jsx';
import { useState } from 'react';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
