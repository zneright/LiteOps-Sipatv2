import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// 🚀 NEW: Updated Interface to include reactions and images
interface Comment {
    id: number;
    project_id: number;
    author_name: string;
    text_content: string;
    image_url: string | null;
    ai_match_score: number;
    is_ghost_alert: string | number;
    created_at: string;
    likes: number;
    neutrals: number;
    unlikes: number;
}

interface Project {
    id: number;
    title: string;
    budget: string;
    category: string;
    created_at: string;
}

export default function AgencyFeedback() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

    useEffect(() => {
        const fetchAgencyData = async () => {
            try {
                const projRes = await fetch("http://localhost:8080/api/projects");
                if (!projRes.ok) throw new Error("Failed to fetch projects");
                const allProjects = await projRes.json();

                const commentsPromises = allProjects.map((p: Project) =>
                    fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
                );

                const commentsArrays = await Promise.all(commentsPromises);
                const allComments = commentsArrays.flat();

                setProjects(allProjects);
                setComments(allComments);
            } catch (error) {
                console.error("Error fetching agency data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAgencyData();
    }, []);

    // 🚀 NEW: Format Date and Time
    const formatDateTime = (dateString?: string) => {
        if (!dateString) return "Just now";
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getProjectAnalytics = (projectId: number) => {
        const projComments = comments.filter(c => c.project_id === projectId);
        const total = projComments.length;

        if (total === 0) return { total: 0, goodPct: 0, badPct: 0, neutralPct: 0, badCount: 0, goodCount: 0, comments: [] };

        const badCount = projComments.filter(c => Number(c.is_ghost_alert) === 1).length;
        const goodCount = projComments.filter(c => Number(c.is_ghost_alert) === 0 && c.ai_match_score >= 50).length;
        const neutralCount = total - badCount - goodCount;

        return {
            total,
            goodCount,
            badCount,
            goodPct: Math.round((goodCount / total) * 100),
            badPct: Math.round((badCount / total) * 100),
            neutralPct: Math.round((neutralCount / total) * 100),
            comments: projComments
        };
    };

    if (isLoading) {
        return (
            <div className="w-full py-20 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <motion.h2
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black text-slate-900 dark:text-white"
                >
                    Citizen Feedback
                </motion.h2>
                <p className="text-slate-500 font-medium text-sm">
                    AI-Analyzed sentiment and proof validation for your active projects.
                </p>
            </div>

            <div className="flex flex-col gap-6">
                {projects.map((project, idx) => {
                    const stats = getProjectAnalytics(project.id);
                    const isExpanded = expandedProjectId === project.id;

                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                        >
                            {/* Project Header Card */}
                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                <div className="flex-grow">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1 block">
                                        {project.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
                                        {project.title}
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500">
                                        Total Feedback: <strong className="text-slate-800 dark:text-slate-200">{stats.total} Submissions</strong>
                                    </p>
                                </div>

                                {/* AI Sentiment Bar */}
                                <div className="w-full md:w-72 flex flex-col gap-2 shrink-0">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-emerald-600">👍 {stats.goodPct}% Valid</span>
                                        <span className="text-slate-400">😐 {stats.neutralPct}%</span>
                                        <span className="text-red-600">🚨 {stats.badPct}% Flagged</span>
                                    </div>

                                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.goodPct}%` }} className="h-full bg-emerald-500 transition-all duration-1000" />
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.neutralPct}%` }} className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-1000" />
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.badPct}%` }} className="h-full bg-red-500 transition-all duration-1000" />
                                    </div>

                                    <button
                                        onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                                        className="mt-3 w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors rounded-xl flex items-center justify-center gap-2"
                                    >
                                        {isExpanded ? (
                                            <>Hide Comments <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg></>
                                        ) : (
                                            <>View Evidence & Analysis <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg></>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Comments Section */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden"
                                    >
                                        <div className="p-6 md:p-8">
                                            {stats.comments.length === 0 ? (
                                                <div className="text-center text-slate-400 text-sm py-8 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                                                    No community feedback yet.
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-6">
                                                    {stats.comments.map(comment => {
                                                        const isGhost = Number(comment.is_ghost_alert) === 1;
                                                        return (
                                                            // 🚀 NEW: Stacked layout for displaying image, text, and reactions
                                                            <div key={comment.id} className={`p-5 md:p-6 rounded-2xl border shadow-sm flex flex-col gap-4 ${isGhost ? 'bg-red-50 dark:bg-red-500/10 border-red-200' : comment.ai_match_score >= 50 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}>

                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="font-bold text-sm text-slate-900 dark:text-white">{comment.author_name}</span>
                                                                        <span className="text-xs font-medium text-slate-400">{formatDateTime(comment.created_at)}</span>
                                                                    </div>
                                                                    <div>
                                                                        {isGhost ? (
                                                                            <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded-md">🚨 GHOST FLAG</span>
                                                                        ) : comment.ai_match_score >= 50 ? (
                                                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md">✓ VERIFIED ({comment.ai_match_score}%)</span>
                                                                        ) : (
                                                                            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-md">NEUTRAL ({comment.ai_match_score}%)</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{comment.text_content}</p>

                                                                {/* 🚀 NEW: Image Proof rendering directly inside the dashboard */}
                                                                {comment.image_url && (
                                                                    <img src={comment.image_url} alt="Proof submitted by citizen" className="w-full max-h-80 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                                                                )}

                                                                {/* 🚀 NEW: Reactions display and action link */}
                                                                <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/60 pt-4 mt-2">
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">👍 {comment.likes || 0}</span>
                                                                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">😐 {comment.neutrals || 0}</span>
                                                                        <span className="text-xs font-bold text-red-600 flex items-center gap-1">👎 {comment.unlikes || 0}</span>
                                                                    </div>
                                                                    <Link to={`/agency/project/${project.id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0 flex items-center gap-1 mt-2 md:mt-0 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                                                                        View Context
                                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                                                    </Link>
                                                                </div>

                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}