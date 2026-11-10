
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '../navigation/Sidebar.jsx';
import { TopBar } from '../navigation/TopBar.jsx';
import { FloatingPetals } from '../ui/FloatingPetals.jsx';

import lavenderBg from '../../../assets/background/favv1.png';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <div
      className="
        relative isolate flex h-screen w-full
        overflow-hidden
        bg-[#f8f5ff] dark:bg-[#17131d]
      "
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
      }}
    >
      {/* Background overlay */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 z-0
          bg-white/15 dark:bg-black/25
        "
      />

      {/* Global floating petals */}
      <FloatingPetals />

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Main application area */}
      <div
        className="
          relative z-10
          flex min-w-0 min-h-0 flex-1 flex-col
        "
      >
        {/* Top navigation */}
        <TopBar
          onOpenMobile={() => setMobileOpen(true)}
        />

        {/* Page content */}
        <main
          className="
            relative min-h-0 min-w-0
            flex-1 overflow-y-auto overflow-x-hidden
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
