import { useState } from "react";
import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface AgencyLayoutProps {
  children: ReactNode;
}

export default function AgencyLayout({ children }: AgencyLayoutProps) {
const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col font-sans">
      {/* Top Navigation */}
<Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 relative w-full">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* The active page content gets injected here */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Agency Footer */}
      <Footer />
    </div>
  );
}