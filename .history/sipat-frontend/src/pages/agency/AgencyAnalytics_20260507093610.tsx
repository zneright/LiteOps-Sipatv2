import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface Comment {
    id: number;
    text_content: string;
    author_name: string;
    created_at: string;
    is_ghost_alert: number | string;
    ai_match_score: number;
    target_phase: string;
    likes: number;
    unlikes: number;
}

export default function AgencyAnalytics() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, role } = useAuth();

    const [project, setProject] = useState<any>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Security check: Only allow agencies
        if (role !== "agency" && role !== "admin") {
            navigate("/home");
            return;
        }

        const fetchAnalytics = async () => {
            try {
                // Fetch Project Details
                const pRes = await fetch(`http://localhost:8080/api/projects/${id}`);
                if (!pRes.ok) throw new Error("Project not found");
                const pData = await pRes.json();

                let parsedPhases = [];
                try {
                    parsedPhases = typeof pData.phases === 'string' ? JSON.parse(pData.phases) : (pData.phases || []);
                } catch (e) { }
                pData.phases = parsedPhases;
                setProject(pData);

                // Fetch Comments/Feedback
                const cRes = await fetch(`http://localhost:8080/api/comments/${id}`);
                if (cRes.ok) {
                    const cData = await cRes.json();
                    setComments(Array.isArray(cData) ? cData : []);
                }
            } catch (error) {
                console.error("Failed to load analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [id, role, navigate]);

    // 🚀 --- ANALYTICS CALCULATIONS ---
    const totalReactions = (Number(project?.likes) || 0) + (Number(project?.neutrals) || 0) + (Number(project?.unlikes) || 0);
    const approvalRate = totalReactions > 0 ? Math.round(((Number(project?.likes) || 0) / totalReactions) * 100) : 0;

    const ghostAlerts = comments.filter(c => Number(c.is_ghost_alert) === 1);
    const verifiedProofs = comments.filter(c => Number(c.is_ghost_alert) === 0 && c.ai_match_score >= 60);
    const avgAiScore = comments.length > 0 ? Math.round(comments.reduce((acc, curr) => acc + Number(curr.ai_match_score || 0), 0) / comments.length) : 0;

    const completedPhases = project?.phases?.filter((p: any) => p.status === 'completed' || p.image_url)?.length || 0;
    const totalPhases = project?.phases?.length || 0;
    const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

    const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    if (isLoading) {
        return (
            <div className="w-full h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Compiling Analytics...</p>
            </div>
        );
    }

    if (!project) return <div className="text-center py-20 text-slate-500">Project not found.</div>;

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 pb-20 px-4 pt-4 sm:pt-8">

            {/* Header Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Analytics: <span className="text-indigo-600">{project.title}</span>
                    </h1>
                </div>
                <Link to={`/project/${project.id}`} className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
                    View Public Page
                </Link>
            </div>

            {/* 🌟 Top Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-blue-500">👍</span> Approval Rate</p>
                    <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{approvalRate}%</p>
                    <p className="text-xs font-bold text-slate-500 mt-2">Based on {totalReactions} votes</p>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-indigo-500">🤖</span> Avg AI Trust Score</p>
                    <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{avgAiScore}%</p>
                    <p className="text-xs font-bold text-slate-500 mt-2">Across all submitted photos</p>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-emerald-500">💬</span> Total Feedback</p>
                    <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{comments.length}</p>
                    <p className="text-xs font-bold text-slate-500 mt-2">{verifiedProofs.length} verified proofs</p>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }} className={`p-6 rounded-[2rem] border shadow-sm flex flex-col ${ghostAlerts.length > 0 ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-rose-500">🚨</span> Ghost Alerts</p>
                    <p className={`text-3xl sm:text-4xl font-black ${ghostAlerts.length > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{ghostAlerts.length}</p>
                    <p className={`text-xs font-bold mt-2 ${ghostAlerts.length > 0 ? 'text-rose-500' : 'text-slate-500'}`}>{ghostAlerts.length > 0 ? 'Immediate action required' : 'No anomalies detected'}</p>
                </motion.div>
            </div>

            {/* 🌟 Main Bento Box Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                {/* Left Column: Charts & Overview */}
                <div className="lg:col-span-1 flex flex-col gap-6 sm:gap-8">

                    {/* Reaction Breakdown Chart */}
                    <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Sentiment Breakdown</h3>

                        {totalReactions === 0 ? (
                            <div className="h-32 flex items-center justify-center text-sm font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">No ratings yet</div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300">
                                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Supportive (👍)</span>
                                    <span>{project.likes || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300">
                                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div> Neutral (😐)</span>
                                    <span>{project.neutrals || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300">
                                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Dissatisfied (👎)</span>
                                    <span>{project.unlikes || 0}</span>
                                </div>

                                {/* Visual Bar */}
                                <div className="w-full h-3 flex rounded-full overflow-hidden mt-2 shadow-inner">
                                    <div style={{ width: `${((project.likes || 0) / totalReactions) * 100}%` }} className="bg-emerald-500 h-full"></div>
                                    <div style={{ width: `${((project.neutrals || 0) / totalReactions) * 100}%` }} className="bg-slate-400 h-full"></div>
                                    <div style={{ width: `${((project.unlikes || 0) / totalReactions) * 100}%` }} className="bg-rose-500 h-full"></div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Timeline Progress */}
                    <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.5 }} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Timeline Status</h3>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-3xl font-black text-indigo-600">{progress}%</span>
                            <span className="text-xs font-bold text-slate-500 mb-1">{completedPhases} of {totalPhases} phases</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
                            <div style={{ width: `${progress}%` }} className="h-full bg-indigo-600 rounded-full"></div>
                        </div>
                        <p className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <strong>Budget:</strong> ₱{project.budget} <br />
                            <strong>Category:</strong> {project.category}
                        </p>
                    </motion.div>
                </div>

                {/* Right Column: Deep Dive Feedback */}
                <div className="lg:col-span-2">
                    <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.6 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm h-full">

                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Citizen Feedback Log</h3>
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest">
                                {comments.length} Entries
                            </span>
                        </div>

                        {comments.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center">
                                <span className="text-4xl mb-4">📭</span>
                                <p className="text-slate-500 font-bold">No feedback recorded for this project yet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                                {/* Always show Ghost Alerts first if they exist */}
                                {[...ghostAlerts, ...comments.filter(c => Number(c.is_ghost_alert) !== 1)].map((c, i) => (
                                    <div key={i} className={`p-5 rounded-2xl border transition-all flex flex-col gap-3 ${Number(c.is_ghost_alert) === 1 ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{c.author_name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Reported on Phase: <strong>{c.target_phase}</strong></p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {Number(c.is_ghost_alert) === 1 ? (
                                                    <span className="bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">Critical Ghost Alert</span>
                                                ) : (
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${c.ai_match_score >= 50 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                        AI Trust: {c.ai_match_score}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{c.text_content}"</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}