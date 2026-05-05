import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface CitizenLayoutProps {
  children: React.ReactNode;
}

export default function CitizenLayout({ children }: CitizenLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navbar */}
      <Navbar onMenuToggle={toggleSidebar} />

      {/* Sidebar (overlay-based always) */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <main className="py-8 animate-in fade-in duration-500">{children}</main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
