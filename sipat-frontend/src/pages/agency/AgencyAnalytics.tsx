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
        totalSaves: 0, // Overall Bookmarks
    });
    const [detailedProjects, setDetailedProjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchGlobalAnalytics = async () => {
            const orgName = user?.name || "DPWH"; // Using the finalized org name from Auth context

            try {
                // 1. Fetch All Projects & All Users
                const [pRes, uRes] = await Promise.all([
                    fetch("http://localhost:8080/api/projects"),
                    fetch("http://localhost:8080/api/users")
                ]);

                const allProjects = await pRes.json();
                const allUsers = await uRes.json();

                // 2. Filter ONLY this agency's projects
                const myProjects = allProjects.filter((p: any) =>
                    p.organization_name === orgName || (!p.organization_name && orgName === "DPWH")
                );

                // 3. Process Users for Follows & Saves
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

                    // Check Saves
                    try {
                        const saved = u.saved_projects ? JSON.parse(u.saved_projects) : [];
                        if (Array.isArray(saved)) {
                            saved.forEach(id => {
                                projectSavesMap[id] = (projectSavesMap[id] || 0) + 1;
                            });
                        }
                    } catch (e) { }
                });

                // 4. Fetch Comments for Agency Projects
                const commentsPromises = myProjects.map((p: any) =>
                    fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
                );
                const commentsArrays = await Promise.all(commentsPromises);

                let ghostAlerts = 0;
                let totalAiScore = 0;
                let totalCommentsCount = 0;

                // 5. Enrich Projects with Individual Analytics
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

                    // Calculate progress
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

                // Calculate Global Stats
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

                // Sort by total engagement
                enrichedProjects.sort((a, b) => b.totalEngagement - a.totalEngagement);
                setDetailedProjects(enrichedProjects);

            } catch (error) {
                console.error("Failed to load global analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGlobalAnalytics();
    }, [user]);

    const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    if (isLoading) return (
        <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Compiling Global Analytics...</p>
        </div>
    );

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 pb-20 px-4 pt-4 sm:pt-8">
            <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Global <span className="text-indigo-600">Analytics</span></h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Platform-wide sentiment and intelligence for {user?.name}</p>
            </div>

            {/* 🚀 TOP ROW: Primary Engagement Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-[2rem] shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 text-8xl -translate-y-4 translate-x-4">👥</div>
                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1 relative z-10">Total Followers</p>
                    <p className="text-4xl font-black relative z-10">{metrics.totalFollowers}</p>
                    <p className="text-xs font-medium text-indigo-200 mt-2 relative z-10">Citizens tracking your agency</p>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-[2rem] shadow-lg shadow-rose-500/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 text-8xl -translate-y-4 translate-x-4">🔖</div>
                    <p className="text-[10px] font-black text-rose-100 uppercase tracking-widest mb-1 relative z-10">Project Bookmarks</p>
                    <p className="text-4xl font-black relative z-10">{metrics.totalSaves}</p>
                    <p className="text-xs font-medium text-rose-200 mt-2 relative z-10">Total times projects were saved</p>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-blue-500">👍</span> Total Approval</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{metrics.approvalRate}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div style={{ width: `${metrics.approvalRate}%` }} className="h-full bg-blue-500"></div>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-indigo-500">🤖</span> Avg AI Trust Score</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{metrics.avgAiScore}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div style={{ width: `${metrics.avgAiScore}%` }} className="h-full bg-indigo-500"></div>
                    </div>
                </motion.div>
            </div>

            {/* 🚀 SECOND ROW: Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-2">
                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-3xl">💬</div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence Processed</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{metrics.totalComments}</p>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.5 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-3xl">🏗️</div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Projects</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{metrics.totalProjects}</p>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.6 }} className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-6 ${metrics.ghostAlerts > 0 ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${metrics.ghostAlerts > 0 ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-slate-50 dark:bg-slate-800'}`}>🚨</div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${metrics.ghostAlerts > 0 ? 'text-rose-500' : 'text-slate-400'}`}>Critical Ghost Flags</p>
                        <p className={`text-3xl font-black ${metrics.ghostAlerts > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{metrics.ghostAlerts}</p>
                    </div>
                </motion.div>
            </div>

            {/* 🚀 PER PROJECT ANALYTICS TABLE */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.7 }} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm mt-4 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                            Per-Project Intelligence
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">Detailed breakdown of community engagement</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {detailedProjects.length === 0 ? (
                        <p className="text-center text-sm font-bold text-slate-400 py-16">No project data available to analyze.</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Project Details</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Progress</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Saves</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Evidence</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Sentiment</th>
                                    <th className="py-4 px-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {detailedProjects.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="py-4 px-6 max-w-[250px]">
                                            <p className="font-bold text-slate-900 dark:text-white truncate" title={p.title}>{p.title}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">{p.category || "General"}</p>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className={`text-xs font-black ${p.progress === 100 ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-300'}`}>{p.progress}%</span>
                                                <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full ${p.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${p.progress}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-100 dark:border-rose-500/20">
                                                🔖 {p.savesCount}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.commentsCount}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold" title="Upvotes"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg> {p.likes || 0}</div>
                                                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold" title="Neutral">😐 {p.neutrals || 0}</div>
                                                <div className="flex items-center gap-1 text-rose-500 text-xs font-bold" title="Downvotes"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg> {p.unlikes || 0}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Link to={`/agency/project/${p.id}`} className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all opacity-0 group-hover:opacity-100">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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