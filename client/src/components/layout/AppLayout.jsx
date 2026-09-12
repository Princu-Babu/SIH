import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import Footer from './Footer';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      {/* TopBar */}
      <TopBar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <main id="main-content" tabIndex="-1" className="flex-1 overflow-y-auto flex flex-col justify-between bg-surface-50">
          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            <div className="max-w-7xl mx-auto page-enter">
              <Breadcrumb />
              <Outlet />
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
