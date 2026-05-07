import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface Comment {
    id: number;
    project_id: number;
    parent_id: number | null;
    target_phase: string;
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
    phases: any;
    likes: number;
    neutrals: number;
    unlikes: number;
    organization_name?: string;
}

export default function AgencyFeedback() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
    const [activePhase, setActivePhase] = useState<string>("Overall Project");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    useEffect(() => {
        if (user?.name) {
            const fetchAgencyData = async () => {
                try {
                    const projRes = await fetch(`${API_URL}/api/projects");
                    if (!projRes.ok) throw new Error("Failed to fetch projects");
                    const data = await projRes.json();

                    const agencyProjects = data.filter((p: Project) =>
                        p.organization_name === user?.name ||
                        (!p.organization_name && user?.name === "DPWH")
                    );

                    const commentsPromises = agencyProjects.map((p: Project) =>
                        fetch(`${ API_URL } / api / comments / ${ p.id }`).then(res => res.json())
                    );

                    const commentsArrays = await Promise.all(commentsPromises);
                    const allComments = commentsArrays.flat();

                    setProjects(agencyProjects);
                    setComments(allComments);
                } catch (error) {
                    console.error("Error fetching agency data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchAgencyData();
        }
    }, [user]);

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return "Just now";
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const safeParsePhases = (phasesData: any) => {
        if (!phasesData) return [];
        if (Array.isArray(phasesData)) return phasesData;
        try {
            const parsed = JSON.parse(phasesData);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    const getProjectAnalytics = (projectId: number) => {
        const projComments = comments.filter(c => c.project_id === projectId);
        const total = projComments.length;

        if (total === 0) return { total: 0, goodPct: 0, badPct: 0, neutralPct: 0, comments: [] };

        const badCount = projComments.filter(c => Number(c.is_ghost_alert) === 1).length;
        const goodCount = projComments.filter(c => Number(c.is_ghost_alert) === 0 && c.ai_match_score >= 50).length;
        const neutralCount = total - badCount - goodCount;

        return {
            total,
            goodPct: Math.round((goodCount / total) * 100),
            badPct: Math.round((badCount / total) * 100),
            neutralPct: Math.round((neutralCount / total) * 100),
            comments: projComments
        };
    };

    const renderComment = (comment: Comment, phaseComments: Comment[], isReply = false, parentName = "") => {
        const replies = phaseComments.filter(c => c.parent_id === comment.id);
        const isGhost = Number(comment.is_ghost_alert) === 1;

        return (
            <div key={comment.id} className="relative">
                {isReply && (
                    <div className="absolute -left-4 sm:-left-6 top-6 w-4 sm:w-6 h-10 border-b-2 border-l-2 border-slate-200 dark:border-slate-700/50 rounded-bl-xl" />
                )}

                <div className={`
                    ${ isReply? 'ml-6 sm:ml-8 mt-3': 'mt-4' } 
                    p - 4 sm: p - 5 rounded - [1.25rem] border shadow - sm flex flex - col gap - 3 transition - all hover: shadow - md
                    ${
                        isGhost? 'bg-red-50/80 dark:bg-red-900/10 border-red-200 dark:border-red-500/20 shadow-red-500/5'
                            : comment.ai_match_score >= 50 ? 'bg-emerald-50/80 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 shadow-emerald-500/5'
                                : 'bg-white/90 dark:bg-slate-800/80 border-slate-200/60 dark:border-white/5'
                    }
                        `}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                        <div className="flex flex-col gap-0.5">
                            <Link to={`/ public - profile / ${ encodeURIComponent(comment.author_name)
                }`} className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                {comment.author_name}
                            </Link>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{formatDateTime(comment.created_at)}</span>
                        </div>
                        <div className="shrink-0">
                            {isGhost ? (
                                <span className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-[10px] font-black px-2.5 py-1 rounded-md flex items-center w-fit gap-1"><span className="animate-pulse">🚨</span> GHOST FLAG</span>
                            ) : comment.ai_match_score >= 50 ? (
                                <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-md w-fit block">✓ VERIFIED ({comment.ai_match_score}%)</span>
                            ) : (
                                <span className="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-md w-fit block">NEUTRAL ({comment.ai_match_score}%)</span>
                            )}
                        </div>
                    </div>

                    {isReply && (
                        <div className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400">
                            Replying to @{parentName}
                        </div>
                    )}

                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{comment.text_content}</p>

                    {comment.image_url && (
                        <img src={comment.image_url} alt="Proof" className="w-full max-h-64 sm:max-h-80 object-cover rounded-xl border border-slate-200/50 dark:border-white/10 mt-2 shadow-sm" />
                    )}

                    <div className="flex items-center gap-4 border-t border-slate-200/60 dark:border-slate-700/50 pt-3 mt-1">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">👍 {comment.likes || 0}</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">😐 {comment.neutrals || 0}</span>
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">👎 {comment.unlikes || 0}</span>
                    </div>
                </div>

                {replies.length > 0 && (
                    <div className="ml-3 sm:ml-4 border-l-2 border-slate-200/60 dark:border-slate-700/50 relative">
                        {replies.map(reply => renderComment(reply, phaseComments, true, comment.author_name))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 bg-transparent">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-12 w-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent dark:border-t-transparent rounded-full shadow-lg shadow-indigo-500/20"></motion.div>
                <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Feedback Data...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-8 font-sans">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <motion.h2
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white"
                >
                    Citizen <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400">Feedback</span>
                </motion.h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
                    AI-Analyzed sentiment and proof validation for your active projects.
                </p>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-10 sm:p-16 rounded-[2rem] text-center border border-slate-200/60 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center justify-center">
                    <span className="text-5xl sm:text-6xl mb-5 block drop-shadow-md">📭</span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">No projects found</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium max-w-md">You haven't published any projects to receive feedback on yet. Once you do, citizen insights will appear here.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6 sm:gap-8">
                    {projects.map((project, idx) => {
                        const stats = getProjectAnalytics(project.id);
                        const isExpanded = expandedProjectId === project.id;
                        const parsedPhases = safeParsePhases(project.phases);
                        const availableTabs = ["Overall Project", ...parsedPhases.map((p: any) => p.title)];

                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                className="bg-white/90 dark:bg-slate-800/60 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none"
                            >
                                {/* Project Header Card */}
                                <div className="p-5 sm:p-6 md:p-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between relative overflow-hidden">
                                    <div className="flex-grow relative z-10 w-full">
                                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1.5 block">
                                            {project.category}
                                        </span>
                                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2 pr-4">
                                            {project.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                            Total Feedback: <strong className="text-slate-800 dark:text-slate-200">{stats.total} Submissions</strong>
                                        </p>
                                    </div>

                                    <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0 relative z-10 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="flex justify-between text-[11px] sm:text-xs font-black">
                                            <span className="text-emerald-600 dark:text-emerald-400">👍 {stats.goodPct}% Valid</span>
                                            <span className="text-slate-400 dark:text-slate-500">😐 {stats.neutralPct}%</span>
                                            <span className="text-red-600 dark:text-red-400">🚨 {stats.badPct}% Flagged</span>
                                        </div>

                                        <div className="w-full h-2.5 sm:h-3 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden flex shadow-inner">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${ stats.goodPct }% ` }} className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-1000" />
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${ stats.neutralPct }% ` }} className="h-full bg-slate-300 dark:bg-slate-500 transition-all duration-1000" />
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${ stats.badPct }% ` }} className="h-full bg-red-500 dark:bg-red-400 transition-all duration-1000" />
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (isExpanded) {
                                                    setExpandedProjectId(null);
                                                } else {
                                                    setExpandedProjectId(project.id);
                                                    setActivePhase("Overall Project");
                                                }
                                            }}
                                            className="mt-1 w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 border border-slate-200 dark:border-white/5 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-300 transition-all duration-300 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow"
                                        >
                                            {isExpanded ? (
                                                <>Hide Comments <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg></>
                                            ) : (
                                                <>View Evidence & Analysis <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg></>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Area with Tabs */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/20 overflow-hidden"
                                        >
                                            <div className="p-5 sm:p-6 md:p-8 flex flex-col gap-6">

                                                {/* OVERALL PROJECT REACTIONS */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 rounded-[1.25rem] border border-slate-200/60 dark:border-white/5 shadow-sm backdrop-blur-md">
                                                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Project Public Rating</span>
                                                    <div className="flex items-center gap-4 sm:gap-6 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/5">
                                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">👍 {project.likes || 0}</span>
                                                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">😐 {project.neutrals || 0}</span>
                                                        <span className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">👎 {project.unlikes || 0}</span>
                                                    </div>
                                                </div>

                                                {/* PHASE TABS */}
                                                <div className="flex overflow-x-auto pb-3 gap-2 snap-x custom-scrollbar">
                                                    {availableTabs.map((tab) => (
                                                        <button
                                                            key={tab}
                                                            onClick={() => setActivePhase(tab)}
                                                            className={`whitespace - nowrap px - 4 sm: px - 5 py - 2.5 rounded - xl text - xs sm: text - sm font - bold transition - all snap - start sm: snap - center focus: ring - 2 focus: ring - indigo - 500 focus: outline - none ${
                    activePhase === tab
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/40 scale-105"
                    : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white shadow-sm"
                } `}
                                                        >
                                                            {tab}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* FEEDBACK FOR ACTIVE PHASE */}
                                                <div className="flex flex-col gap-4">
                                                    {(() => {
                                                        const phaseComments = stats.comments.filter(c => (c.target_phase || "Overall Project") === activePhase);
                                                        const topLevelComments = phaseComments.filter(c => !c.parent_id);

                                                        if (topLevelComments.length === 0) {
                                                            return (
                                                                <div className="text-center text-slate-400 dark:text-slate-500 font-medium text-sm py-12 bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-white/5 border-dashed">
                                                                    No community feedback for <span className="font-bold text-slate-500 dark:text-slate-400">{activePhase}</span> yet.
                                                                </div>
                                                            );
                                                        }

                                                        return topLevelComments.map(comment => renderComment(comment, phaseComments, false));
                                                    })()}
                                                </div>

                                                <div className="flex justify-center mt-2 sm:mt-4">
                                                    <Link to={`/ agency / project / ${ project.id } `} className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1.5 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                                                        Open Full Project View
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}