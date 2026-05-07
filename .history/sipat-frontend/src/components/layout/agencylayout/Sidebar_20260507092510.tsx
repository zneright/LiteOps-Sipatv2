import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const agencyNavItems = [
  { name: "Dashboard", path: "/agency/dashboard", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
  { name: "Manage Projects", path: "/agency/manage-projects", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { name: "Citizen Feedback", path: "/agency/feedback", icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" },
  { name: "Global Analytics", path: "/agency/analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { name: "Agency Profile", path: "/agency/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-50 h-full lg:h-[calc(100vh-4rem)] w-72 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col transform transition-all duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full lg:-ml-72"}`}
      >
        <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <span className="text-xs font-black tracking-widest uppercase text-slate-400">Navigation</span>
            <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4 ml-2">
            Command Center
          </p>

          <nav className="space-y-2">
            {agencyNavItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                  className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 overflow-hidden group ${isActive
                    ? "text-white shadow-md shadow-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  {/* 🚀 Liquid Tab Slider Animation */}
                  {isActive && (
                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 rounded-2xl -z-10" />
                  )}
                  <svg className={`w-5 h-5 shrink-0 transition-colors relative z-10 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                  </svg>
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quick Action */}
        <div className="p-6 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
          <Link to="/agency/uploader" className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-indigo-600 dark:bg-white dark:hover:bg-indigo-400 text-white dark:text-slate-900 rounded-2xl text-sm font-black shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Publish New Project
          </Link>
        </div>
      </aside>
    </>
  );
}