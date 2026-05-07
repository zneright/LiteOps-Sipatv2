import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminNavItems = [
  { name: "Command Center", path: "/admin/dashboard", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" },

  { name: "Global Users", path: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { name: "Security Logs", path: "/admin/logs", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },

];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-50 h-full lg:h-[calc(100vh-4rem)] w-72 bg-slate-100/50 dark:bg-slate-950/80 backdrop-blur-md border-r border-slate-200/60 dark:border-slate-800/80 flex flex-col transform transition-all duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full lg:-ml-72"
          }`}
      >
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <span className="text-sm font-black tracking-widest uppercase text-slate-500">Navigation</span>
            <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <p className="text-[10px] font-black text-purple-600 dark:text-purple-500 uppercase tracking-widest mb-4 px-3">
            Core Infrastructure
          </p>

          <nav className="space-y-1.5">
            {adminNavItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400 dark:shadow-none border border-transparent dark:border-purple-500/30"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                    }`}
                >
                  <svg className={`w-5 h-5 transition-colors ${isActive ? "text-white dark:text-purple-400" : "text-slate-400 group-hover:text-purple-500 dark:text-slate-500 dark:group-hover:text-purple-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Database Quick Stats */}
        <div className="p-5 border-t border-slate-200/60 dark:border-slate-800">
          <div className="bg-slate-200/50 dark:bg-slate-900 rounded-xl p-4 border border-slate-300 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              DB Connection
            </div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">14ms latency</div>
          </div>
        </div>
      </aside>
    </>
  );
}