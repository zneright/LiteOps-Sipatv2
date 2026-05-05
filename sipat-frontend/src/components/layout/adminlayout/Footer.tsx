export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm transition-colors">
      <div className="w-full px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-500">
          <span>Sipat OS Core v2.4.1</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
          <span className="text-slate-400 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
             Node: Asia-East
          </span>
          <span className="text-slate-400 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
             Master Sync
          </span>
        </div>

      </div>
    </footer>
  );
}