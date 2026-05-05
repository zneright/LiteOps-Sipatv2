import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import SipatLogo from "../../ui/SipatLogo";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext"; // <-- Import AuthContext

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth(); // <-- Dynamic State from Context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/home");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer group">
            <SipatLogo className="w-9 h-9 transform group-hover:scale-105 transition-transform duration-200" />
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">SIPAT</span>
          </div>
        </div>

        {/* Center Search */}
        <div className="flex-1 max-w-xl mx-6">
          <input
            type="text"
            placeholder="Search places, updates, or reports..."
            className="w-full px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            {theme === "light" ? <span className="text-xl leading-none">🌙</span> : <span className="text-xl leading-none">☀️</span>}
          </button>

          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <span className="text-xl leading-none">🔔</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-sm hover:ring-2 hover:ring-indigo-500/50 hover:ring-offset-2 dark:hover:ring-offset-slate-950 transition-all focus:outline-none font-bold text-sm"
            >
              {isLoggedIn && user ? (
                // If logged in, show the first letter of their name
                user.name.charAt(0).toUpperCase()
              ) : (
                // If logged out, show the icon
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />

                <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {isLoggedIn ? user?.name : "Guest Citizen"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate capitalize">
                      {isLoggedIn ? user?.role : "Not logged in"}
                    </p>
                  </div>

                  <div className="py-1">
                    {!isLoggedIn ? (
                      <>
                        <Link to="/login" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                          Log in
                        </Link>
                        <Link to="/signup" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                          Sign up
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          My Profile
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Sign Out
                        </button>
                      </>
                    )}
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