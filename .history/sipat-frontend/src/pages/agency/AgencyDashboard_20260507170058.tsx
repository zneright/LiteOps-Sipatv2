import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // 🚀 IMPORT AUTH

interface Project {
  id: number;
  title: string;
  phases: any;
  organization_name?: string;
}

interface Comment {
  id: number;
  project_id: number;
  text_content: string;
  author_name: string;
  created_at: string;
  is_ghost_alert: number | string;
  ai_match_score: number;
  project_title?: string;
}

export default function AgencyDashboard() {
  const { user } = useAuth(); // 🚀 GRAB LOGGED IN USER
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic State
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    flaggedIssues: 0,
    totalFeedback: 0,
    completionRate: 0
  });
  const [recentFeedback, setRecentFeedback] = useState<Comment[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.name) return;

      try {
        // 1. Fetch All Projects
        const pRes = await fetch("http://localhost:8080/api/projects");
        const allProjects = await pRes.json();

        // 🚀 THE FIX: Filter down to ONLY this agency's projects
        const myProjects = allProjects.filter((p: Project) =>
          p.organization_name === user?.name ||
          (!p.organization_name && user?.name === "DPWH")
        );

        // 2. Fetch Comments for these specific projects
        const commentsPromises = myProjects.map((p: Project) =>
          fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
        );
        const commentsArrays = await Promise.all(commentsPromises);
        const allComments = commentsArrays.flat();

        // 3. Calculate Real Metrics
        let totalPhases = 0;
        let completedPhases = 0;

        myProjects.forEach((p: Project) => {
          let phases = [];
          try { phases = typeof p.phases === 'string' ? JSON.parse(p.phases) : (p.phases || []); } catch (e) { }
          if (Array.isArray(phases)) {
            totalPhases += phases.length;
            completedPhases += phases.filter((ph: any) => ph.status === 'completed' || ph.image_url).length;
          }
        });

        const flaggedCount = allComments.filter((c: Comment) => Number(c.is_ghost_alert) === 1).length;
        const completionPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

        setMetrics({
          activeProjects: myProjects.length,
          flaggedIssues: flaggedCount,
          totalFeedback: allComments.length,
          completionRate: completionPct
        });

        // 4. Process Recent Feedback for the List
        const sortedComments = allComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Attach the project title to the comment for context
        const enrichedComments = sortedComments.slice(0, 5).map((c: Comment) => {
          const proj = myProjects.find((p: Project) => p.id === c.project_id);
          return {
            ...c,
            project_title: proj ? proj.title : "Unknown Project"
          };
        });

        setRecentFeedback(enrichedComments);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatTimeSince = (dateString: string) => {
    if (!dateString) return "Just now";
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60; if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  const statCards = [
    { label: "Managed Projects", value: metrics.activeProjects, trend: `${metrics.completionRate}% Avg Completion`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100/50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" },
    { label: "Flagged Issues", value: metrics.flaggedIssues, trend: "Requires attention", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100/50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
    { label: "Citizen Feedback", value: metrics.totalFeedback, trend: "Total insights collected", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100/50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
  ];

  if (isLoading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute animate-ping h-12 w-12 rounded-full bg-indigo-400 opacity-20"></div>
          <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full shadow-lg"></div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Syncing Agency Data...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20 pt-6 px-4 sm:px-6 lg:px-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
              Agency{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Overview
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
            Welcome back, <span className="font-bold text-slate-700 dark:text-slate-300">{user?.name}</span>. Here is your operational status.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full sm:w-auto">
          <Link
            to="/agency/uploader"
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Publish New Project
          </Link>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-white dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden"
          >
            {/* Subtle Background Glow */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 ${stat.bg}`}></div>

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${stat.bg} ${stat.color} ${stat.border} shadow-inner`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <p className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-end gap-3 mt-1">
              <h3 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-1.5">{stat.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Recent Citizen Feedback Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-[1.5rem] shadow-sm flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                Recent{" "}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Citizen Feedback
              </span>
            </h2>
            <Link to="/agency/feedback" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors">
              View All Feedback &rarr;
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentFeedback.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No recent feedback received on your projects.</p>
              </div>
            ) : (
              recentFeedback.map((review, i) => (
                <div key={i} className="group p-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tracking-wide truncate max-w-[200px] sm:max-w-none border border-slate-200 dark:border-slate-700">
                        {review.project_title}
                      </span>
                      {Number(review.is_ghost_alert) === 1 ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-pulse"></span> Flagged
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-2 leading-relaxed">
                      "{review.text_content}"
                    </p>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mt-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {review.author_name.charAt(0).toUpperCase()}
                      </div>
                      <span>{review.author_name}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span>{formatTimeSince(review.created_at)}</span>
                    </div>
                  </div>

                  {/* CONNECTS TO PROJECT VIEW */}
                  <Link
                    to={`/agency/project/${review.project_id}`}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all duration-200 shrink-0 text-center shadow-sm group-hover:shadow-md"
                  >
                    Review Details
                  </Link>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-800 rounded-[1.5rem] p-8 text-white flex flex-col justify-between shadow-2xl shadow-blue-500/20 relative overflow-hidden h-full min-h-[300px]"
        >
          {/* Decorative geometric blobs */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white opacity-5 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-indigo-400 opacity-20 blur-2xl"></div>

          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
              <svg className="w-6 h-6 text-blue-100" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <h3 className="text-2xl font-black mb-3 tracking-tight">System Status</h3>
            <p className="text-blue-100/90 text-sm font-medium leading-relaxed">
              API connections to the central citizen database are fully operational. Data sync is occurring in real-time. All systems green.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 relative z-10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-blue-100 uppercase tracking-wider">Live API Sync</span>
              <span className="text-sm font-black text-emerald-300 flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                Active
              </span>
            </div>
            <div className="w-full h-2.5 bg-blue-900/40 rounded-full overflow-hidden backdrop-blur-sm border border-black/10">
              <div className="h-full bg-gradient-to-r from-blue-300 to-white w-full rounded-full relative">
                {/* Subtle moving highlight for the progress bar */}
                <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/50 w-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}