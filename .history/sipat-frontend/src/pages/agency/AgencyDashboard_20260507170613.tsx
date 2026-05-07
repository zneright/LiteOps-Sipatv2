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
    { label: "Managed Projects", value: metrics.activeProjects, trend: `${metrics.completionRate}% Avg Completion`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Flagged Issues", value: metrics.flaggedIssues, trend: "Requires attention", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Citizen Feedback", value: metrics.totalFeedback, trend: "Total insights collected", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  ];

  // Smooth Staggered Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full shadow-lg"></div>
        <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-xs">Syncing Agency Data...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="w-full max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 pb-20 pt-4 px-4 sm:px-6 lg:px-8"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
        <motion.div variants={itemVariants} className="flex-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-300">
              Agency{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Overview
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Welcome back, <strong className="text-slate-700 dark:text-slate-200">{user?.name}</strong>. Here is your operational status across all managed infrastructure projects.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full sm:w-auto shrink-0">
          <Link
            to="/agency/uploader"
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Publish New Project
          </Link>
        </motion.div>
      </div>

      {/* Stats Row */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.01 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[1.5rem] p-5 sm:p-6 shadow-sm hover:shadow-xl dark:hover:shadow-indigo-500/5 transition-all duration-300 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-end gap-3 mt-1.5">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</h3>
              <span className="text-[11px] sm:text-sm font-bold text-slate-400 dark:text-slate-500 mb-0.5">{stat.trend}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Action Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">

        {/* Recent Citizen Feedback Panel */}
        <motion.div
          variants={itemVariants}
          className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[1.5rem] shadow-sm flex flex-col overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                Recent{" "}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Citizen Feedback
              </span>
            </h2>
            <Link to="/agency/feedback" className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 group">
              View All
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-slate-50 dark:divide-slate-800/60">
            {recentFeedback.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">📬</span>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No recent feedback received on your projects.</p>
              </div>
            ) : (
              recentFeedback.map((review, i) => (
                <div key={i} className="p-5 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tracking-wider truncate max-w-[200px] sm:max-w-xs border border-slate-200 dark:border-slate-700">
                        {review.project_title}
                      </span>
                      {Number(review.is_ghost_alert) === 1 ? (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Flagged
                        </span>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm sm:text-[15px] font-medium text-slate-900 dark:text-slate-100 mt-1 leading-relaxed line-clamp-2">"{review.text_content}"</p>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {review.author_name}
                      <span className="mx-1 opacity-50">•</span>
                      {formatTimeSince(review.created_at)}
                    </p>
                  </div>

                  {/* CONNECTS TO PROJECT VIEW */}
                  <Link
                    to={`/agency/project/${review.project_id}`}
                    className="w-full sm:w-auto text-center px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all shrink-0 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick System Status */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 dark:from-slate-800 dark:via-indigo-900 dark:to-slate-900 rounded-[1.5rem] p-6 sm:p-8 text-white flex flex-col justify-between shadow-xl shadow-blue-500/20 dark:shadow-none border border-transparent dark:border-slate-700/50 relative overflow-hidden group"
        >
          {/* Decorative background blur */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-black mb-3 flex items-center gap-2.5 tracking-tight">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5 text-blue-100" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </div>
              System Status
            </h3>
            <p className="text-blue-100 dark:text-slate-300 text-sm font-medium leading-relaxed opacity-90">
              API connections to the central citizen database are fully operational. Data sync is occurring in real-time. All systems green.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-blue-400/30 dark:border-slate-700/50 relative z-10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-blue-100 dark:text-slate-300">Live API Sync</span>
              <span className="text-xs sm:text-sm font-black text-emerald-300 flex items-center gap-1.5 bg-emerald-900/30 px-2.5 py-1 rounded-md backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/20 dark:bg-black/40 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 w-full rounded-full relative"
              >
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}