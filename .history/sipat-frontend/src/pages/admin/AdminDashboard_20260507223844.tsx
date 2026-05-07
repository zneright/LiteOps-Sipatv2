import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState({
    totalCitizens: 0,
    activeAgencies: 0,
    totalProjects: 0,
    totalSaves: 0,
    totalFollows: 0,
    totalReactions: 0,
    totalEvidence: 0,
    totalAiScans: 0,
    systemUptime: "99.99%",
  });

  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [topGlobalProjects, setTopGlobalProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          fetch(`${API_URL}/api/users"),
          fetch("http://localhost:8080/api/projects")
        ]);

        if (!usersRes.ok || !projectsRes.ok) throw new Error("Failed to fetch admin data");

        const allUsers = await usersRes.json();
        const allProjects = await projectsRes.json();

        const citizens = allUsers.filter((u: any) => u.role === "citizen");
        const agencies = allUsers.filter((u: any) => u.role === "agency");

        let globalSaves = 0;
        let globalFollows = 0;

        allUsers.forEach((u: any) => {
          try {
            const saves = u.saved_projects ? JSON.parse(u.saved_projects) : [];
            if (Array.isArray(saves)) globalSaves += saves.length;
          } catch (e) { }

          try {
            const follows = u.followed_agencies ? JSON.parse(u.followed_agencies) : [];
            if (Array.isArray(follows)) globalFollows += follows.length;
          } catch (e) { }
        });

        const allCommentsPromises = allProjects.map((p: any) =>
          fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
        );
        const commentsArrays = await Promise.all(allCommentsPromises);

        const flatComments = commentsArrays.flat().filter(c => !c.error);
        const totalComments = flatComments.length;

        let globalReactions = 0;
        const enrichedProjects = allProjects.map((p: any, index: number) => {
          const pLikes = Number(p.likes || 0);
          const pNeutrals = Number(p.neutrals || 0);
          const pUnlikes = Number(p.unlikes || 0);
          const pCommentsCount = (commentsArrays[index] || []).length;

          globalReactions += (pLikes + pNeutrals + pUnlikes);

          return {
            ...p,
            totalEngagement: pLikes + pNeutrals + pUnlikes + pCommentsCount
          };
        });

        enrichedProjects.sort((a, b) => b.totalEngagement - a.totalEngagement);

        const recentUsers = [...allUsers]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4);

        setMetrics({
          totalCitizens: citizens.length,
          activeAgencies: agencies.length,
          totalProjects: allProjects.length,
          totalSaves: globalSaves,
          totalFollows: globalFollows,
          totalReactions: globalReactions,
          totalEvidence: totalComments,
          totalAiScans: totalComments,
          systemUptime: "99.99%",
        });

        setRecentLogs(recentUsers);
        setTopGlobalProjects(enrichedProjects.slice(0, 4));

      } catch (error) {
        console.error("Admin Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-purple-500/30 dark:bg-purple-500/20 animate-pulse"></div>
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 dark:border-purple-400 border-t-transparent dark:border-t-transparent rounded-full relative z-10"></div>
        </div>
        <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 animate-pulse">Loading Global Subsystems...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-24 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 font-sans">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none">
            <span className="text-slate-900 dark:text-white">Super Admin </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400">
              Console
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
            <span className="px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] sm:text-xs font-black uppercase tracking-widest border border-purple-200 dark:border-purple-500/30">
              {user?.email || "System Root"}
            </span>
            Managing global infrastructure, AI loads, and platform vitals.
          </p>
        </div>
        <button className="w-full md:w-auto px-6 py-3.5 sm:py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-xl font-black shadow-lg shadow-purple-500/25 dark:shadow-purple-900/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 uppercase tracking-widest text-xs sm:text-sm">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          System Settings
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Total Citizens", val: metrics.totalCitizens, icon: "👤", up: true, bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-100 dark:border-indigo-500/20", glow: "group-hover:shadow-indigo-500/20" },
          { label: "Active Agencies", val: metrics.activeAgencies, icon: "🏛️", up: true, bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-100 dark:border-blue-500/20", glow: "group-hover:shadow-blue-500/20" },
          { label: "Global Saves", val: metrics.totalSaves, icon: "🔖", up: true, bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-100 dark:border-purple-500/20", glow: "group-hover:shadow-purple-500/20" },
          { label: "Global Follows", val: metrics.totalFollows, icon: "👥", up: true, bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10", text: "text-fuchsia-600 dark:text-fuchsia-400", border: "border-fuchsia-100 dark:border-fuchsia-500/20", glow: "group-hover:shadow-fuchsia-500/20" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-6 shadow-sm hover:shadow-xl ${stat.glow} transition-all duration-300 relative overflow-hidden group hover:-translate-y-1`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/0 to-current opacity-5 dark:opacity-10 rounded-bl-full transition-transform duration-700 group-hover:scale-125 pointer-events-none z-0" />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.text} border ${stat.border} flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold flex items-center gap-1 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 px-2.5 py-1 rounded-lg shadow-sm ${stat.up ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {stat.up ? (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7-7m-7-7v18" /></svg>) : (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>)}
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 relative z-10">{stat.label}</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white relative z-10 tracking-tight">{stat.val}</h2>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-2 sm:mt-4">
        {[
          { label: "Published Projects", val: metrics.totalProjects, icon: "🏗️", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-500/20" },
          { label: "Total Reactions", val: metrics.totalReactions, icon: "👍", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-500/20" },
          { label: "Evidence Submitted", val: metrics.totalEvidence, icon: "📸", bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-100 dark:border-rose-500/20" },
          { label: "AI Verifications", val: metrics.totalAiScans, icon: "🤖", bg: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-100 dark:border-cyan-500/20" },
        ].map((stat, i) => (
          <motion.div key={`bot-${i}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + (i * 0.1) }} className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-[1.5rem] p-5 sm:p-6 shadow-sm flex items-center gap-4 sm:gap-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl ${stat.bg} ${stat.text} border ${stat.border} flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300`}>{stat.icon}</div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">{stat.val}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-2 sm:mt-4">
        <div className="bg-white/90 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 shadow-lg shadow-slate-200/30 dark:shadow-none flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9.5a1.5 1.5 0 01-3 0V7a1 1 0 00-1-1h-1a1 1 0 010-2h-3a1 1 0 010 2H7a1 1 0 00-1 1v8.5a1.5 1.5 0 01-3 0V6a2 2 0 012-2z" clipRule="evenodd" /></svg>
              </div>
              Recent Registrations
            </h3>
            <span className="px-3 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-500/20 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              Live Log
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4 flex-grow">
            {recentLogs.length > 0 ? recentLogs.map((log, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/40 rounded-[1.25rem] border border-slate-200/50 dark:border-white/5 group hover:border-purple-200 dark:hover:border-purple-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-sm hover:shadow-md gap-3 sm:gap-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-lg sm:text-xl border border-purple-200/50 dark:border-purple-500/20 group-hover:scale-110 transition-transform">
                    {log.role === 'agency' ? '🏛️' : '👤'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base text-slate-900 dark:text-white font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                      {log.role === 'agency' ? log.organization_name : log.full_name}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">New {log.role} Account</p>
                  </div>
                </div>
                <div className="sm:text-right shrink-0 pl-14 sm:pl-0">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/50">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center py-10">
                <span className="text-4xl mb-3 opacity-50">📂</span>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No recent activity found.</p>
              </div>
            )}
          </div>
          <div className="pt-6 sm:pt-8 mt-auto border-t border-slate-100 dark:border-white/5">
            <Link to="/admin/logs" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group w-fit">
              View Full Database Audit
              <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 shadow-lg shadow-slate-200/30 dark:shadow-none flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.79-.61 1.431-.85 1.956l-.151.32c-.083.174-.15.3-.2.385l-.04.07c-.015.027-.023.041-.023.041A4.996 4.996 0 0110 5.5a1 1 0 100-2c-1.38 0-2.61.64-3.415 1.637l.036-.062c.05-.084.117-.21.2-.385.045-.096.095-.205.15-.32.241-.525.517-1.166.85-1.956.168-.403.357-.786.57-1.116.208-.322.477-.65.822-.88a1 1 0 00-1.11-1.666A5.996 5.996 0 005.5 3a5.996 5.996 0 00-2.585 1.116 1 1 0 101.11 1.666c.345-.23.614-.558.822-.88.214-.33.403-.713.57-1.116.334-.79.61-1.431.85-1.956l.151-.32c.083-.174.15-.3.2-.385l.04-.07c.015-.027.023-.041.023-.041a3 3 0 012.355 2.54 1 1 0 00-1.874.57C7 11.233 7 13 7 15c0 1.657 1.343 3 3 3s3-1.343 3-3c0-2 0-3.767-.126-5.43a1 1 0 00-1.874-.57 3 3 0 012.355-2.54c0 0 .008-.014.023-.041l.04-.07c.05-.085.117-.211.2-.385l.151-.32c.24-.525.516-1.166.85-1.956.167-.403.356-.786.57-1.116.208-.322.477-.65.822-.88z" clipRule="evenodd" /></svg>
              </div>
              Global Top Projects
            </h3>
            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20 shadow-sm flex items-center gap-1.5">
              <span className="text-[10px]">🔥</span> Trending
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4 flex-grow">
            {topGlobalProjects.length > 0 ? topGlobalProjects.map((p, index) => (
              <Link key={index} to={`/admin/project/${p.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/40 rounded-[1.25rem] border border-slate-200/50 dark:border-white/5 group hover:border-amber-200 dark:hover:border-amber-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-sm hover:shadow-md gap-3 sm:gap-0">
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm sm:text-base border border-amber-200/50 dark:border-amber-500/20 group-hover:scale-110 transition-transform shadow-sm">
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base text-slate-900 dark:text-white font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                      {p.title}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1 truncate">{p.organization_name || 'General'}</p>
                  </div>
                </div>
                <div className="sm:text-right shrink-0 pl-14 sm:pl-0 flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                  <span className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/5 shadow-sm">
                    {p.totalEngagement}
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 sm:mt-1">Engagements</span>
                </div>
              </Link>
            )) : (
              <div className="h-full flex flex-col items-center justify-center py-10">
                <span className="text-4xl mb-3 opacity-50">📈</span>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No project data available.</p>
              </div>
            )}
          </div>
          <div className="pt-6 sm:pt-8 mt-auto border-t border-slate-100 dark:border-white/5">
            <Link to="/admin/explore" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors group w-fit">
              View Global Feed
              <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}