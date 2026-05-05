import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SipatLogo from "../../ui/SipatLogo";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-purple-200/50 dark:border-purple-500/20 transition-colors duration-300">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Section (Burger & Logo) */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
            title="Toggle Sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 blur-md opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
              <SipatLogo className="w-8 h-8 transform group-hover:scale-105 transition-transform duration-200 relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">
                SIPAT
              </span>
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest leading-none mt-0.5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                System Root
              </span>
            </div>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400">
            {theme === "light" ? (
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-800 mx-1"></div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 focus:outline-none group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30 font-black text-sm border border-purple-300 dark:border-purple-500 group-hover:scale-105 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-purple-50/50 dark:bg-slate-950/50">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {user?.name || "Super Admin"}
                    </p>
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate">
                      {user?.email || "root@sipat.ph"}
                    </p>
                  </div>
                  <div className="py-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Terminate Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}