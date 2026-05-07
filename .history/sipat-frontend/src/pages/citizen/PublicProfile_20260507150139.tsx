import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface UserComment {
    id: number;
    project_id: number;
    text_content: string;
    ai_match_score: number;
    is_ghost_alert: string | number;
    created_at: string;
}

const ALL_RANKS = [
    { id: 1, title: "Newcomer", icon: "🌱", req: 0, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30", grad: "from-emerald-400 to-green-500" },
    { id: 2, title: "Observer", icon: "👀", req: 5, color: "text-teal-500", bg: "bg-teal-100 dark:bg-teal-900/30", grad: "from-teal-400 to-emerald-500" },
    { id: 3, title: "Civic Watchman", icon: "🛡️", req: 10, color: "text-cyan-500", bg: "bg-cyan-100 dark:bg-cyan-900/30", grad: "from-cyan-400 to-blue-500" },
    { id: 4, title: "Active Sentinel", icon: "⚔️", req: 25, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", grad: "from-blue-400 to-indigo-500" },
    { id: 5, title: "Lead Verifier", icon: "🥇", req: 50, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30", grad: "from-indigo-400 to-purple-500" },
    { id: 6, title: "Master Verifier", icon: "💎", req: 100, color: "text-fuchsia-500", bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", grad: "from-fuchsia-500 to-purple-600" },
    { id: 7, title: "Grand Inspector", icon: "🦅", req: 250, color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/30", grad: "from-rose-400 via-fuchsia-500 to-indigo-500" },
    { id: 8, title: "Supreme Oracle", icon: "👑", req: 500, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30", grad: "from-amber-300 via-yellow-500 to-orange-600" },
];

export default function PublicProfile() {
    const { authorName } = useParams<{ authorName: string }>();
    const navigate = useNavigate();

    const [userComments, setUserComments] = useState<UserComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [details, setDetails] = useState({
        location: "Classified",
        bio: "This citizen is out in the field auditing projects.",
        role: "Citizen",
        joinDate: "Unknown"
    });

    const isAnonymous = authorName === "Anonymous Citizen";

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                if (!isAnonymous) {
                    const userRes = await fetch("http://localhost:8080/api/users");
                    const usersData = await userRes.json();
                    const matchedUser = usersData.find((u: any) => u.full_name === authorName || u.name === authorName);

                    if (matchedUser) {
                        setDetails({
                            location: matchedUser.location || "Location Private",
                            bio: matchedUser.bio || "This citizen hasn't written a bio yet.",
                            role: matchedUser.role || "Citizen",
                            joinDate: matchedUser.created_at ? new Date(matchedUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : "Recently"
                        });
                    }
                } else {
                    setDetails({
                        location: "Shadow Realm",
                        bio: "A collective of anonymous citizens keeping the system honest.",
                        role: "Anonymous",
                        joinDate: "Since the beginning"
                    });
                }

                const projectsRes = await fetch("http://localhost:8080/api/projects");
                const projects = await projectsRes.json();

                const commentsPromises = projects.map((p: any) => fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json()));
                const allCommentsArrays = await Promise.all(commentsPromises);
                const flattened = allCommentsArrays.flat();

                const filtered = flattened.filter((c: any) => c.author_name === authorName);
                setUserComments(filtered);

            } catch (error) {
                console.error("Error loading public profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicData();
    }, [authorName, isAnonymous]);

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return "Just now";
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const currentCount = userComments.length;

    const currentRankIndex = useMemo(() => {
        return ALL_RANKS.slice().reverse().findIndex(r => currentCount >= r.req);
    }, [currentCount]);
    const activeRank = ALL_RANKS[ALL_RANKS.length - 1 - (currentRankIndex === -1 ? ALL_RANKS.length - 1 : currentRankIndex)];

    const ghostCaught = userComments.filter(c => Number(c.is_ghost_alert) === 1).length;
    const avgAI = currentCount === 0 ? 0 : Math.round(userComments.reduce((acc, c) => acc + Number(c.ai_match_score || 0), 0) / currentCount);

    const staggerContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } };

    if (isLoading) {
        return (
            <div className="w-full h-[70vh] flex justify-center items-center">
                <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-6xl">
                    🔍
                </motion.div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 pb-20 px-4 pt-4 sm:pt-8 font-sans">

            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit -mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Project
            </button>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 dark:border-slate-700/50 shadow-sm overflow-hidden">

                <div className="absolute top-0 left-0 w-full h-40 sm:h-56 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                    <motion.div animate={{ x: [0, 50, 0], y: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className={`absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br ${activeRank.grad} rounded-full blur-[80px] opacity-40`} />
                </div>

                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20 flex flex-col items-center group">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${activeRank.grad} rounded-full p-1 shadow-2xl cursor-default`}>
                        <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-3xl sm:text-4xl">
                            {isAnonymous ? "🕵️" : activeRank.icon}
                        </div>
                    </div>
                    <div className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                        {activeRank.title}
                    </div>
                </motion.div>

                <div className="px-6 sm:px-10 pb-8 sm:pb-10 pt-20 sm:pt-32 relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white/50 dark:bg-slate-800/50 p-2 backdrop-blur-xl shadow-2xl shrink-0 -mt-20 sm:-mt-10">
                        <div className={`w-full h-full rounded-full bg-gradient-to-br ${activeRank.grad} p-[3px]`}>
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-5xl sm:text-6xl font-black text-slate-800 dark:text-white">
                                {isAnonymous ? "?" : authorName?.charAt(0)?.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{authorName}</h1>
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-3">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${activeRank.bg} ${activeRank.color} shadow-sm border border-white/20 dark:border-slate-700/50`}>
                                {activeRank.title}
                            </span>
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                                📍 {details.location}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">

                <motion.div variants={fadeUp} initial="hidden" animate="show" className="md:col-span-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white/40 dark:border-slate-700/50 shadow-sm flex flex-col">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        About This Auditor
                    </h2>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium flex-1 italic">
                        "{details.bio}"
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined Community</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{details.joinDate}</p>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" className="md:col-span-2 grid grid-cols-2 gap-4 sm:gap-6">
                    {[
                        { label: "Total Proofs", val: currentCount, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
                        { label: "AI Avg Score", val: `${avgAI}%`, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                        { label: "Ghosts Found", val: ghostCaught, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
                        { label: "Community Role", val: details.role, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} p-6 sm:p-8 rounded-[2rem] border border-white/40 dark:border-slate-700/50 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left transition-all`}>
                            <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-3xl sm:text-4xl font-black ${stat.color} truncate w-full`}>{stat.val}</p>
                        </div>
                    ))}
                </motion.div>

            </div>

            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-white/40 dark:border-slate-700/50 shadow-sm">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Public Audit History
                </h3>

                {userComments.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 sm:p-10 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <p className="text-slate-500 font-medium text-sm sm:text-base">This user has no public audit history.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {userComments.slice().reverse().map((comment) => (
                            <motion.div key={comment.id} variants={fadeUp} className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col gap-3 group hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start sm:items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posted {formatDateTime(comment.created_at)}</span>
                                    {Number(comment.is_ghost_alert) === 1 ? (
                                        <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-black px-3 py-1 rounded-full">🚨 Ghost Flag</span>
                                    ) : (
                                        <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">AI Trust: {comment.ai_match_score}%</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">"{comment.text_content}"</p>
                                <Link to={`/project/${comment.project_id}`} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors w-fit flex items-center gap-1 mt-1 group-hover:translate-x-1 duration-300">
                                    Inspect Record <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

        </div>
    );
}