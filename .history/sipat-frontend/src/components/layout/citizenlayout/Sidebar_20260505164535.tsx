import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // <-- Import AuthContext

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
  const { isLoggedIn, logout } = useAuth(); // <-- Dynamic State from Context

  const visibleItems = navItems.filter(
    (item) => !item.requireAuth || isLoggedIn,
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-slate-950 border-r border-slate-200/60 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8 text-slate-900 dark:text-white">
            <span className="text-xl font-black tracking-tight">Menu</span>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 space-y-1.5">
            {visibleItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            {!isLoggedIn ? (
              <Link
                to="/login"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
              >
                Sign In to Access All Features
              </Link>
            ) : (
              <button 
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}