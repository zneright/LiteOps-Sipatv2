import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AgencyDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

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
        const pRes = await fetch("http://localhost:8080/api/projects");
        const allProjects = await pRes.json();

        const myProjects = allProjects.filter((p: Project) =>
          p.organization_name === user?.name ||
          (!p.organization_name && user?.name === "DPWH")
        );

        const commentsPromises = myProjects.map((p: Project) =>
          fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
        );
        const commentsArrays = await Promise.all(commentsPromises);
        const allComments = commentsArrays.flat();

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

        const sortedComments = allComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
    { label: "Managed Projects", value: metrics.activeProjects, trend: `${metrics.completionRate}% Avg Completion`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20" },
    { label: "Flagged Issues", value: metrics.flaggedIssues, trend: "Requires attention", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-500/20" },
    { label: "Citizen Feedback", value: metrics.totalFeedback, trend: "Total insights collected", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20" },
  ];

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-6 bg-transparent">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600 dark:border-indigo-400/20 dark:border-t-indigo-400 rounded-full"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
          className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-sm"
        >
          Syncing Agency Data...
        </motion.p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 pb-24 pt-6 px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <motion.div variants={itemVariants} className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            <span className="text-slate-900 dark:text-white">
              Agency{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 drop-shadow-sm">
              Overview
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-base sm:text-lg">
            Welcome back, <span className="text-slate-900 dark:text-slate-200 font-bold">{user?.name}</span>. Here is your operational status.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/agency/uploader">
            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Publish New Project
            </motion.button>
          </Link>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4 }}
            className={`bg-white dark:bg-slate-900/80 backdrop-blur-xl border ${stat.border} rounded-[2rem] p-6 shadow-xl shadow-slate-200/20 dark:shadow-none transition-colors duration-300`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${stat.bg} ${stat.color}`}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-baseline gap-3 mt-2">
              <h3 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{stat.trend}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mt-2">
        <motion.div
          variants={itemVariants}
          className="xl:col-span-2 bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col overflow-hidden"
        >
          <div className="p-6 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Recent Citizen Feedback
            </h2>
            <Link to="/agency/feedback">
              <motion.span whileHover={{ x: 2 }} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
                View All <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </motion.span>
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentFeedback.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">No recent feedback received on your projects.</div>
            ) : (
              <AnimatePresence>
                {recentFeedback.map((review, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    className="p-6 sm:px-8 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                  >
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tracking-wide truncate max-w-[200px] sm:max-w-[300px]">
                          {review.project_title}
                        </span>
                        {Number(review.is_ghost_alert) === 1 ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-pulse"></span> Flagged
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-base font-medium text-slate-900 dark:text-slate-200 mt-2 line-clamp-2 leading-relaxed">"{review.text_content}"</p>
                      <div className="flex items-center gap-2 mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 uppercase shadow-inner">
                          {review.author_name.charAt(0)}
                        </span>
                        <span>Submitted by <span className="text-slate-700 dark:text-slate-300 font-semibold">{review.author_name}</span> • {formatTimeSince(review.created_at)}</span>
                      </div>
                    </div>

                    <Link to={`/agency/project/${review.project_id}`} className="w-full sm:w-auto shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-bold transition-colors shadow-sm"
                      >
                        Review Issue
                      </motion.button>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 dark:from-blue-900 dark:via-indigo-900 dark:to-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-between shadow-2xl shadow-blue-600/20 dark:shadow-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-blue-400/20 blur-xl"></div>



          <div className="mt-10 pt-6 border-t border-white/10 relative z-10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-blue-100 tracking-wide">Live API Sync</span>
              <span className="text-sm font-black text-emerald-300 flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Active
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-400 to-white w-full rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}