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
    });
    const [topProjects, setTopProjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchGlobalAnalytics = async () => {
            if (!user?.name) return;

            try {
                // Fetch All Projects
                const pRes = await fetch("http://localhost:8080/api/projects");
                const allProjects = await pRes.json();

                // 🚀 Filter ONLY this agency's projects
                const myProjects = allProjects.filter((p: any) =>
                    p.organization_name === user?.name ||
                    (!p.organization_name && user?.name === "DPWH")
                );

                // Fetch Comments
                const commentsPromises = myProjects.map((p: any) =>
                    fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
                );
                const commentsArrays = await Promise.all(commentsPromises);
                const allComments = commentsArrays.flat();

                // Calculate Global Stats
                let likes = 0, neutrals = 0, unlikes = 0;
                myProjects.forEach((p: any) => {
                    likes += Number(p.likes || 0);
                    neutrals += Number(p.neutrals || 0);
                    unlikes += Number(p.unlikes || 0);
                });

                const totalReactions = likes + neutrals + unlikes;
                const approvalRate = totalReactions > 0 ? Math.round((likes / totalReactions) * 100) : 0;
                const ghostAlerts = allComments.filter((c: any) => Number(c.is_ghost_alert) === 1).length;
                const avgAiScore = allComments.length > 0 ? Math.round(allComments.reduce((acc: number, curr: any) => acc + Number(curr.ai_match_score || 0), 0) / allComments.length) : 0;

                setMetrics({
                    totalProjects: myProjects.length,
                    totalLikes: likes,
                    totalNeutrals: neutrals,
                    totalUnlikes: unlikes,
                    approvalRate,
                    totalComments: allComments.length,
                    ghostAlerts,
                    avgAiScore,
                });

                // Top 3 Projects by Engagement
                const sortedProjects = [...myProjects].sort((a, b) =>
                    ((b.likes || 0) + (b.unlikes || 0)) - ((a.likes || 0) + (a.unlikes || 0))
                ).slice(0, 3);
                setTopProjects(sortedProjects);

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-blue-500">👍</span> Total Approval</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{metrics.approvalRate}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div style={{ width: `${metrics.approvalRate}%` }} className="h-full bg-blue-500"></div>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-indigo-500">🤖</span> Avg Platform Trust</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{metrics.avgAiScore}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div style={{ width: `${metrics.avgAiScore}%` }} className="h-full bg-indigo-500"></div>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-emerald-500">💬</span> Processed Evidence</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{metrics.totalComments}</p>
                    <p className="text-xs font-bold text-slate-500 mt-2">Unique submissions</p>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }} className={`p-6 rounded-[2rem] border shadow-sm ${metrics.ghostAlerts > 0 ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-rose-500">🚨</span> Critical Flags</p>
                    <p className={`text-4xl font-black ${metrics.ghostAlerts > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{metrics.ghostAlerts}</p>
                    <p className={`text-xs font-bold mt-2 ${metrics.ghostAlerts > 0 ? 'text-rose-500' : 'text-slate-500'}`}>{metrics.ghostAlerts > 0 ? 'Active anomalies' : 'System healthy'}</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-4">
                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center text-center items-center">
                    <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 dark:border-slate-800 flex items-center justify-center relative mb-6">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="96" cy="96" r="84" fill="none" stroke="currentColor" strokeWidth="12" className="text-emerald-500" strokeDasharray={`${(metrics.totalLikes / (metrics.totalLikes + metrics.totalNeutrals + metrics.totalUnlikes || 1)) * 527} 527`} />
                        </svg>
                        <div className="text-center">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{metrics.totalLikes}</span>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Upvotes</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-8 w-full">
                        <div>
                            <span className="text-xl font-black text-slate-700 dark:text-slate-300">{metrics.totalNeutrals}</span>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Neutral</span>
                        </div>
                        <div>
                            <span className="text-xl font-black text-rose-500">{metrics.totalUnlikes}</span>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Downvotes</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.5 }} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.79-.61 1.431-.85 1.956l-.151.32c-.083.174-.15.3-.2.385l-.04.07c-.015.027-.023.041-.023.041A4.996 4.996 0 0110 5.5a1 1 0 100-2c-1.38 0-2.61.64-3.415 1.637l.036-.062c.05-.084.117-.21.2-.385.045-.096.095-.205.15-.32.241-.525.517-1.166.85-1.956.168-.403.357-.786.57-1.116.208-.322.477-.65.822-.88a1 1 0 00-1.11-1.666A5.996 5.996 0 005.5 3a5.996 5.996 0 00-2.585 1.116 1 1 0 101.11 1.666c.345-.23.614-.558.822-.88.214-.33.403-.713.57-1.116.334-.79.61-1.431.85-1.956l.151-.32c.083-.174.15-.3.2-.385l.04-.07c.015-.027.023-.041.023-.041a3 3 0 012.355 2.54 1 1 0 00-1.874.57C7 11.233 7 13 7 15c0 1.657 1.343 3 3 3s3-1.343 3-3c0-2 0-3.767-.126-5.43a1 1 0 00-1.874-.57 3 3 0 012.355-2.54c0 0 .008-.014.023-.041l.04-.07c.05-.085.117-.211.2-.385l.151-.32c.24-.525.516-1.166.85-1.956.167-.403.356-.786.57-1.116.208-.322.477-.65.822-.88z" clipRule="evenodd" /></svg> Top Engaging Projects</h3>
                    <div className="flex flex-col gap-4">
                        {topProjects.map((p, idx) => (
                            <Link key={p.id} to={`/agency/project/${p.id}`} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-sm">{idx + 1}</div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{p.title}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{p.category}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{(Number(p.likes) || 0) + (Number(p.neutrals) || 0) + (Number(p.unlikes) || 0)}</span>
                                    <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Reactions</span>
                                </div>
                            </Link>
                        ))}
                        {topProjects.length === 0 && <p className="text-center text-sm font-bold text-slate-400 py-10">No project data available.</p>}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}