import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface Comment {
    id: number;
    project_id: number;
    author_name: string;
    text_content: string;
    ai_match_score: number;
    is_ghost_alert: string | number;
    created_at: string;
}

interface Project {
    id: number;
    title: string;
    budget: string;
    category: string;
    created_at: string;
}

export default function AgencyFeedback() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Track which project is expanded to view specific comments
    const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

    useEffect(() => {
        const fetchAgencyData = async () => {
            try {
                // 1. Fetch Projects (In a real app, this endpoint should filter by agency ID)
                const projRes = await fetch("http://localhost:8080/api/projects");
                if (!projRes.ok) throw new Error("Failed to fetch projects");
                const allProjects = await projRes.json();

                // 2. Fetch ALL Comments to calculate insights
                // Note: You might want to create a specific backend endpoint for this later, 
                // but for now, we will fetch and filter on the frontend.
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

    // 🚀 The AI Analytics Engine: Calculates Good vs Bad based on saved AI data
    const getProjectAnalytics = (projectId: number) => {
        const projComments = comments.filter(c => c.project_id === projectId);
        const total = projComments.length;

        if (total === 0) return { total: 0, goodPct: 0, badPct: 0, neutralPct: 0, badCount: 0, goodCount: 0 };

        // BAD: AI flagged it as a Ghost Project
        const badCount = projComments.filter(c => Number(c.is_ghost_alert) === 1).length;

        // GOOD: High AI Match Score (>= 50%) and NOT a ghost project
        const goodCount = projComments.filter(c => Number(c.is_ghost_alert) === 0 && c.ai_match_score >= 50).length;

        // NEUTRAL: Low match score, but not explicitly flagged as a ghost project
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
        <div className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <motion.h2
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white"
                >
                    Community Feedback Insights
                </motion.h2>
                <p className="text-slate-500 font-medium text-sm">
                    AI-Analyzed sentiment and proof validation for your active projects.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {projects.map((project, idx) => {
                    const stats = getProjectAnalytics(project.id);
                    const isExpanded = expandedProjectId === project.id;

                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
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
                                <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-emerald-600">👍 {stats.goodPct}% Valid</span>
                                        <span className="text-red-600">🚨 {stats.badPct}% Flagged</span>
                                    </div>

                                    {/* Multi-color Progress Bar */}
                                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.goodPct}%` }} className="h-full bg-emerald-500" />
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.neutralPct}%` }} className="h-full bg-slate-300 dark:bg-slate-600" />
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.badPct}%` }} className="h-full bg-red-500" />
                                    </div>

                                    <button
                                        onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                                        className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors text-right"
                                    >
                                        {isExpanded ? "Hide Comments ⬆" : "View AI Analysis ⬇"}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Comments Section */}
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6 md:p-8"
                                >
                                    {stats.comments.length === 0 ? (
                                        <div className="text-center text-slate-400 text-sm py-4">No community feedback yet.</div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            {stats.comments.map(comment => {
                                                const isGhost = Number(comment.is_ghost_alert) === 1;
                                                return (
                                                    <div key={comment.id} className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-bold text-sm text-slate-900 dark:text-white">{comment.author_name}</span>
                                                                {isGhost ? (
                                                                    <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-md">🚨 GHOST FLAG</span>
                                                                ) : comment.ai_match_score >= 50 ? (
                                                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-md">✓ VERIFIED ({comment.ai_match_score}%)</span>
                                                                ) : (
                                                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-md">NEUTRAL ({comment.ai_match_score}%)</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">{comment.text_content}</p>
                                                        </div>
                                                        <Link to={`/project/${project.id}`} className="text-xs font-bold text-indigo-500 hover:underline shrink-0">
                                                            View in Project →
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}