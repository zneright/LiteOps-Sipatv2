import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20 pt-4">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {/* ✅ READABLE GRADIENT H1 */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
              Super Admin{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400">
              Console
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest">
              {user?.email || "System Root"}
            </span>
            Manage global infrastructure and platform vitals.
          </p>
        </div>
        <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md hover:shadow-xl hover:shadow-purple-500/20 transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          System Settings
        </button>
      </div>

      {/* System Vitals */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Users", val: "142,893", up: true },
          { label: "Active Agencies", val: "48", up: true },
          { label: "API Calls / min", val: "3,402", up: false },
          { label: "System Uptime", val: "99.99%", up: true },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }} 
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden group"
          >
            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full transition-transform duration-500 group-hover:scale-110 pointer-events-none z-0" />
            
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 relative z-10">
              {stat.label}
            </p>
            
            <div className="flex items-center gap-3 relative z-10">
              
              {/* ⚠️ FORCED COLOR FIX HERE */}
              <h2 className="text-3xl font-black !text-black dark:!text-purple-400">
                {stat.val}
              </h2>
              
              <span className={`text-sm font-bold flex items-center ${stat.up ? '!text-emerald-500' : '!text-rose-500'}`}>
                {stat.up ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                )}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Admin Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Security Logs Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Security & Access Logs</h3>
          <div className="space-y-4">
             {[1, 2, 3].map((log) => (
               <div key={log} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Agency LGU Login Success</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">10.0.0.{log * 42}</span>
               </div>
             ))}
          </div>
          <Link to="/admin/security" className="inline-block mt-6 text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline">
            View full security audit &rarr;
          </Link>
        </div>
        
        {/* Platform Controls Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] p-8 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-900/10 pointer-events-none" />
          
          <div className="w-20 h-20 bg-purple-50 dark:bg-slate-800/80 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 border border-purple-100 dark:border-purple-500/20 relative z-10 shadow-sm">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">Platform Controls</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-sm mb-6 relative z-10">
            Manage global database rules, configure agency quotas, and monitor infrastructure health.
          </p>
          
          <button className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg shadow-purple-500/20 transition-all relative z-10">
            Open Master Settings
          </button>
        </div>

      </div>
    </div>
  );
}