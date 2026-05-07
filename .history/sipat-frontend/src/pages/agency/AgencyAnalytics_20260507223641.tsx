import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export default function AgencyAnalytics() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalProjects: 0,
        totalLikes: 0,
        totalNeutrals: 0,
        totalUnlikes: 0,
        approvalRate: 0,
        totalComments: 0,
        ghostAlerts: 0,
        avgAiScore: 0,
        totalFollowers: 0,
        totalSaves: 0,
    });
    const [detailedProjects, setDetailedProjects] = useState<any[]>([]);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    useEffect(() => {
        const fetchGlobalAnalytics = async () => {
            const orgName = user?.name || "DPWH";

            try {
                const [pRes, uRes] = await Promise.all([
                    fetch(`${API_URL}/api/projects"),
                    fetch(`${API_URL}/api/users")
                ]);

                const allProjects = await pRes.json();
                const allUsers = await uRes.json();

                const myProjects = allProjects.filter((p: any) =>
                    p.organization_name === orgName || (!p.organization_name && orgName === "DPWH")
                );

                let followersCount = 0;
                const projectSavesMap: Record<number, number> = {};

                allUsers.forEach((u: any) => {
                    // Check Follows
                    try {
                        const followed = u.followed_agencies ? JSON.parse(u.followed_agencies) : [];
                        if (Array.isArray(followed) && followed.includes(orgName)) {
                            followersCount++;
                        }
                    } catch (e) { }

                    try {
                        const saved = u.saved_projects ? JSON.parse(u.saved_projects) : [];
                        if (Array.isArray(saved)) {
                            saved.forEach((id: number) => {
                                projectSavesMap[id] = (projectSavesMap[id] || 0) + 1;
                            });
                        }
                    } catch (e) { }
                });

                const commentsPromises = myProjects.map((p: any) =>
                    fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
                    );
                const commentsArrays = await Promise.all(commentsPromises);

                let ghostAlerts = 0;
                let totalAiScore = 0;
                let totalCommentsCount = 0;

                let overallLikes = 0;
                let overallNeutrals = 0;
                let overallUnlikes = 0;
                let overallSaves = 0;

                const enrichedProjects = myProjects.map((p: any, index: number) => {
                    const projectComments = commentsArrays[index] || [];
                    const pLikes = Number(p.likes || 0);
                    const pNeutrals = Number(p.neutrals || 0);
                    const pUnlikes = Number(p.unlikes || 0);
                    const pSaves = projectSavesMap[p.id] || 0;

                    overallLikes += pLikes;
                    overallNeutrals += pNeutrals;
                    overallUnlikes += pUnlikes;
                    overallSaves += pSaves;
                    totalCommentsCount += projectComments.length;

                    projectComments.forEach((c: any) => {
                        if (Number(c.is_ghost_alert) === 1) ghostAlerts++;
                        totalAiScore += Number(c.ai_match_score || 0);
                    });

                    let phases = [];
                    try { phases = typeof p.phases === 'string' ? JSON.parse(p.phases) : (p.phases || []); } catch (e) { }
                    const completedPhases = Array.isArray(phases) ? phases.filter((ph: any) => ph.status === 'completed' || ph.image_url).length : 0;
                    const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;

                    return {
                        ...p,
                        savesCount: pSaves,
                        commentsCount: projectComments.length,
                        progress,
                        totalEngagement: pLikes + pNeutrals + pUnlikes + projectComments.length + pSaves
                    };
                });

                const totalReactions = overallLikes + overallNeutrals + overallUnlikes;
                const approvalRate = totalReactions > 0 ? Math.round((overallLikes / totalReactions) * 100) : 100;
                const avgAiScore = totalCommentsCount > 0 ? Math.round(totalAiScore / totalCommentsCount) : 0;

                setMetrics({
                    totalProjects: myProjects.length,
                    totalLikes: overallLikes,
                    totalNeutrals: overallNeutrals,
                    totalUnlikes: overallUnlikes,
                    approvalRate,
                    totalComments: totalCommentsCount,
                    ghostAlerts,
                    avgAiScore,
                    totalFollowers: followersCount,
                    totalSaves: overallSaves
                });

                enrichedProjects.sort((a: any, b: any) => b.totalEngagement - a.totalEngagement);
                setDetailedProjects(enrichedProjects);

            } catch (error) {
                console.error("Failed to load global analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGlobalAnalytics();
    }, [user]);

    const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

    if (isLoading) return (
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 bg-transparent">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-12 w-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent dark:border-t-transparent rounded-full shadow-lg shadow-indigo-500/20"></motion.div>
            <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-sm animate-pulse">Compiling Global Analysis...</p>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 pb-20 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 text-slate-900 dark:text-slate-100 font-sans">
            {/* Header Section */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-1 sm:space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">Global <span className="text-indigo-600 dark:text-indigo-400 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400">Analysis</span></h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">Platform-wide sentiment and intelligence for <span className="text-slate-700 dark:text-slate-300 font-bold">{user?.name}</span></p>
            </motion.div>

            {/* Top Stat Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <motion.div variants={fadeUp} initial="hidden" animate="show" whileHover={{ y: -4, scale: 1.01 }} className="bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-600 dark:to-indigo-900 p-6 sm:p-7 rounded-[2rem] shadow-xl shadow-indigo-500/20 dark:shadow-indigo-900/40 text-white relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-0 right-0 opacity-10 text-8xl -translate-y-4 translate-x-4 select-none pointer-events-none">👥</div>
                    <p className="text-[11px] font-black text-indigo-100 dark:text-indigo-200 uppercase tracking-widest mb-1 relative z-10 opacity-90">Total Followers</p>
                    <p className="text-4xl sm:text-5xl font-black relative z-10 tracking-tight">{metrics.totalFollowers}</p>
                    <p className="text-xs font-medium text-indigo-200 mt-2 relative z-10">Citizens tracking your agency</p>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} whileHover={{ y: -4, scale: 1.01 }} className="bg-gradient-to-br from-rose-500 to-pink-600 dark:from-rose-600 dark:to-pink-900 p-6 sm:p-7 rounded-[2rem] shadow-xl shadow-rose-500/20 dark:shadow-rose-900/40 text-white relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-0 right-0 opacity-10 text-8xl -translate-y-4 translate-x-4 select-none pointer-events-none">🔖</div>
                    <p className="text-[11px] font-black text-rose-100 dark:text-rose-200 uppercase tracking-widest mb-1 relative z-10 opacity-90">Project Bookmarks</p>
                    <p className="text-4xl sm:text-5xl font-black relative z-10 tracking-tight">{metrics.totalSaves}</p>
                    <p className="text-xs font-medium text-rose-200 mt-2 relative z-10">Total times projects were saved</p>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} whileHover={{ y: -4, scale: 1.01 }} className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-6 sm:p-7 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all duration-300 flex flex-col justify-center">
                    <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-blue-500 dark:text-blue-400 text-base">👍</span> Total Approval</p>
                    <p className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{metrics.approvalRate}%</p>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full mt-4 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${metrics.approvalRate}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} className="h-full bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-400 rounded-full"></motion.div>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }} whileHover={{ y: -4, scale: 1.01 }} className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-6 sm:p-7 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all duration-300 flex flex-col justify-center">
                    <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-indigo-500 dark:text-indigo-400 text-base">🤖</span> Avg AI Trust</p>
                    <p className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{metrics.avgAiScore}%</p>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full mt-4 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${metrics.avgAiScore}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.4 }} className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 rounded-full"></motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Middle Stat Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-2">
                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.4 }} whileHover={{ y: -4 }} className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-5 sm:p-6 rounded-[1.5rem] border border-slate-200/50 dark:border-white/5 shadow-md shadow-slate-200/50 dark:shadow-none transition-all duration-300 flex items-center gap-5 sm:gap-6 group cursor-default">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">💬</div>
                    <div>
                        <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Evidence Processed</p>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{metrics.totalComments}</p>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.5 }} whileHover={{ y: -4 }} className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-5 sm:p-6 rounded-[1.5rem] border border-slate-200/50 dark:border-white/5 shadow-md shadow-slate-200/50 dark:shadow-none transition-all duration-300 flex items-center gap-5 sm:gap-6 group cursor-default">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">🏗️</div>
                    <div>
                        <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Projects</p>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{metrics.totalProjects}</p>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.6 }} whileHover={{ y: -4 }} className={`p-5 sm:p-6 rounded-[1.5rem] border shadow-md flex items-center gap-5 sm:gap-6 transition-all duration-300 cursor-default group sm:col-span-2 md:col-span-1 ${metrics.ghostAlerts > 0 ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-900/20 dark:border-rose-500/20 shadow-rose-200/50 dark:shadow-none' : 'bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border-slate-200/50 dark:border-white/5 shadow-slate-200/50 dark:shadow-none'}`}>
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300 ${metrics.ghostAlerts > 0 ? 'bg-rose-100 dark:bg-rose-500/20 animate-pulse' : 'bg-slate-50 dark:bg-slate-700/50'}`}>🚨</div>
                    <div>
                        <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${metrics.ghostAlerts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>Critical Ghost Flags</p>
                        <p className={`text-2xl sm:text-3xl font-black ${metrics.ghostAlerts > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-slate-900 dark:text-white'}`}>{metrics.ghostAlerts}</p>
                    </div>
                </motion.div>
            </div>

            {/* Data Table Section */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.7 }} className="bg-white/90 dark:bg-slate-800/60 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none mt-4 sm:mt-6 overflow-hidden flex flex-col">
                <div className="p-5 sm:p-8 border-b border-slate-200/60 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                            Per-Project Intelligence
                        </h3>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5 ml-7">Detailed breakdown of community engagement</p>
                    </div>
                </div>

                <div className="overflow-x-auto w-full custom-scrollbar">
                    {detailedProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <span className="text-4xl mb-3 opacity-50">📂</span>
                            <p className="text-sm sm:text-base font-bold text-slate-400 dark:text-slate-500">No project data available to analyze.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-200/60 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/20">
                                    <th className="py-5 px-6 sm:px-8 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">Project Details</th>
                                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center whitespace-nowrap">Progress</th>
                                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center whitespace-nowrap">Saves</th>
                                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center whitespace-nowrap">Evidence</th>
                                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center whitespace-nowrap">Sentiment</th>
                                    <th className="py-5 px-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                                {detailedProjects.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors group">
                                        <td className="py-5 px-6 sm:px-8 max-w-[250px] sm:max-w-[300px]">
                                            <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate" title={p.title}>{p.title}</p>
                                            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mt-1.5">{p.category || "General"}</p>
                                        </td>
                                        <td className="py-5 px-6 text-center align-middle">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className={`text-[11px] sm:text-xs font-black ${p.progress === 100 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>{p.progress}%</span>
                                                <div className="w-16 sm:w-20 h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-indigo-500 dark:bg-indigo-400'}`}></motion.div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-center align-middle">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] sm:text-xs font-black border border-rose-100 dark:border-rose-500/20 shadow-sm">
                                                🔖 {p.savesCount}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 text-center align-middle">
                                            <span className="inline-flex justify-center min-w-[2.5rem] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">{p.commentsCount}</span>
                                        </td>
                                        <td className="py-5 px-6 align-middle">
                                            <div className="flex items-center justify-center gap-3 sm:gap-4">
                                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md" title="Upvotes">
                                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg> {p.likes || 0}
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md" title="Neutral">
                                                    😐 {p.neutrals || 0}
                                                </div>
                                                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md" title="Downvotes">
                                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg> {p.unlikes || 0}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 pr-6 sm:pr-8 text-right align-middle">
                                            <Link to={`/agency/project/${p.id}`} className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all focus:ring-2 focus:ring-indigo-500 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 shadow-sm hover:shadow-md">
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}