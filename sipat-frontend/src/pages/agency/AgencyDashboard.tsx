import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Mock Data
const stats = [
  { label: "Active Projects", value: "24", trend: "+3 this month", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
  { label: "Pending Reviews", value: "12", trend: "5 urgent", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  { label: "Resolved Issues", value: "892", trend: "94% resolution rate", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
];

const pendingReviews = [
  { id: "REV-001", title: "Streetlight outage on Rizal Ave", citizen: "Juan D.", date: "2 hours ago", priority: "High" },
  { id: "REV-002", title: "Pothole repair verification", citizen: "Maria S.", date: "5 hours ago", priority: "Medium" },
  { id: "REV-003", title: "Delay in pipe laying project", citizen: "Alex Reyes", date: "1 day ago", priority: "Low" },
];

export default function AgencyDashboard() {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20 pt-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
              Agency{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Overview
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage your ongoing infrastructure projects and citizen feedback.
          </p>
        </div>
        <Link
          to="/agency/uploader"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Publish New Project
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[1.5rem] p-6 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-end gap-3 mt-1">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">{stat.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Pending Reviews Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[1.5rem] shadow-sm flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                Action Required:{" "}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Citizen Commits
              </span>
            </h2>
            <Link to="/agency/reviews" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">View All</Link>
          </div>
          <div className="flex flex-col">
            {pendingReviews.map((review, i) => (
              <div key={i} className="p-6 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 tracking-wider">{review.id}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${review.priority === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>{review.priority}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{review.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Submitted by {review.citizen} • {review.date}</p>
                </div>
                {/* CONNECTS TO REVIEW PAGE */}
                <Link to={`/agency/review/${review.id}`} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors">
                  Review
                </Link>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick System Status */}
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
           className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[1.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-blue-500/20"
        >
          <div>
            <h3 className="text-xl font-black mb-2">System Status</h3>
            <p className="text-blue-100 text-sm font-medium leading-relaxed">
              API connections to the central citizen database are fully operational. Data sync is occurring in real-time.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-blue-500/30">
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-blue-100">Storage Quota</span>
                <span className="text-sm font-black">45%</span>
             </div>
             <div className="w-full h-2 bg-blue-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[45%] rounded-full"></div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}