import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm transition-colors">
      <div className="w-full px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Copyright */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-700 dark:text-slate-300">© 2026 Sipat</span>
          <span className="hidden sm:inline">• Government Transparency Platform</span>
        </div>

        {/* Right Side: Links & Status */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="hidden sm:flex items-center gap-6">
            <Link to="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Documentation</Link>
            <Link to="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Support</Link>
          </div>
          
          {/* System Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">All systems operational</span>
          </div>
        </div>

      </div>
    </footer>
  );
}