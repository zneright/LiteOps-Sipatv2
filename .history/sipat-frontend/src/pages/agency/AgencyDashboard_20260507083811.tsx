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

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Syncing Agency Data...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4 sm:px-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
              Agency{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Overview
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Welcome back, {user?.name}. Here is your operational status.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to="/agency/uploader"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Publish New Project
          </Link>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
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

        {/* Recent Citizen Feedback Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[1.5rem] shadow-sm flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                Recent{" "}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Citizen Feedback
              </span>
            </h2>
            <Link to="/agency/feedback" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">View All Feedback</Link>
          </div>

          <div className="flex flex-col">
            {recentFeedback.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No recent feedback received on your projects.</div>
            ) : (
              recentFeedback.map((review, i) => (
                <div key={i} className="p-6 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 tracking-wider truncate max-w-[150px] sm:max-w-none">
                        {review.project_title}
                      </span>
                      {Number(review.is_ghost_alert) === 1 ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">🚨 Flagged</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">✓ Verified</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-2 line-clamp-2">"{review.text_content}"</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Submitted by {review.author_name} • {formatTimeSince(review.created_at)}</p>
                  </div>

                  {/* CONNECTS TO PROJECT VIEW */}
                  <Link to={`/agency/project/${review.project_id}`} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors shrink-0">
                    Review
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
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[1.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-blue-500/20"
        >
          <div>
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              System Status
            </h3>
            <p className="text-blue-100 text-sm font-medium leading-relaxed">
              API connections to the central citizen database are fully operational. Data sync is occurring in real-time. All systems green.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-blue-500/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-blue-100">Live API Sync</span>
              <span className="text-sm font-black text-emerald-300 flex items-center gap-1">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                Active
              </span>
            </div>
            <div className="w-full h-2 bg-blue-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-white w-full rounded-full"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}