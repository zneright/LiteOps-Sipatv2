export default function SkeletonCard() {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col gap-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/50 rounded-full" />
          </div>
        </div>
        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="space-y-2 mt-2">
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full" />
        <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800/50 rounded-full" />
      </div>
      <div className="mt-4 h-2 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full" />
    </div>
  );
}
