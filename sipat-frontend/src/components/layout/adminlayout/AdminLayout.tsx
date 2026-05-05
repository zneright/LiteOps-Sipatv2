import { useState } from "react";
import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Start open on large screens, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col font-sans relative overflow-hidden z-0">
      
      {/* Ambient Root Glow - Persists across all Admin pages */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 dark:bg-purple-600/20 blur-[120px] rounded-[100%] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 relative w-full">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Active Page Content */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Admin Footer */}
      <Footer />
    </div>
  );
}