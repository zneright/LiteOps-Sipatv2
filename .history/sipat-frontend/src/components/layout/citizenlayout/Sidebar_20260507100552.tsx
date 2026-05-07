import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    name: "Home",
    path: "/home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    requireAuth: false,
  },
  {
    name: "Explore",
    path: "/explore",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    requireAuth: false,
  },
  {
    name: "Categories",
    path: "/categories",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    requireAuth: false,
  },
  {
    name: "Saved",
    path: "/saved",
    icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
    requireAuth: true,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    requireAuth: true,
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.requireAuth || isLoggedIn,
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-50 h-full lg:h-[calc(100vh-4rem)] w-72 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col transform transition-all duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full lg:-ml-72"
          }`}
      >
        <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">

          <div className="flex items-center justify-between mb-8 lg:hidden">
            <span className="text-xs font-black tracking-widest uppercase text-slate-400">Navigation</span>
            <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4 ml-2">
            Citizen Hub
          </p>

          <nav className="space-y-2">
            {visibleItems.map((item) => {
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
                    <motion.div layoutId="activeCitizenTab" className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 rounded-2xl -z-10" />
                  )}
                  <svg
                    className={`w-5 h-5 shrink-0 transition-colors relative z-10 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                  </svg>
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Auth Action */}
        <div className="p-6 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
          {!isLoggedIn ? (
            <Link
              to="/login"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95"
            >
              Sign In to Access All Features
            </Link>
          ) : (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-sm font-black hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}