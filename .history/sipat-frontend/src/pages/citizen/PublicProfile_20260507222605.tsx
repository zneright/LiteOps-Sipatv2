import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

interface UserComment {
    id: number;
    project_id: number;
    text_content: string;
    ai_match_score: number;
    is_ghost_alert: string | number;
    created_at: string;
}

// 🚀 ALL 8 GAMIFICATION TIERS
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
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
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

    const isMaxLevel = currentCount >= 500;
    const nextRank = isMaxLevel ? activeRank : ALL_RANKS[ALL_RANKS.findIndex(r => r.id === activeRank.id) + 1];
    const progressPercent = isMaxLevel ? 100 : ((currentCount - activeRank.req) / (nextRank.req - activeRank.req)) * 100;

    const ghostCaught = userComments.filter(c => Number(c.is_ghost_alert) === 1).length;
    const avgAI = currentCount === 0 ? 0 : Math.round(userComments.reduce((acc, c) => acc + Number(c.ai_match_score || 0), 0) / currentCount);

    const staggerContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } } };

    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex flex-col justify-center items-center gap-6 bg-slate-50 dark:bg-slate-950">
                <div className="relative">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-4 border-indigo-500 opacity-30"></motion.div>
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-16 w-16 md:h-20 md:w-20 rounded-full border-l-4 border-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] flex items-center justify-center text-2xl md:text-3xl">👤</motion.div>
                </div>
                <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xs md:text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Loading Profile...</motion.p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen relative overflow-x-hidden font-sans pb-24 bg-[#F8FAFC] dark:bg-[#0B1120] selection:bg-indigo-500/30">
            {/* Ambient Background Animations */}
            <div className="fixed inset-0 pointer-events-none -z-20">
                <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                <motion.div animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute top-[20%] right-[-10%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-purple-500/10 dark:bg-purple-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <div className="max-w-[80rem] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-8 md:gap-10 relative z-10">

                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.4 }}>
                    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2.5 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-slate-700/50 shadow-sm text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 hover:scale-105 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 w-fit">
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Return
                    </button>
                </motion.div>

                {/* HERO SECTION */}
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, type: "spring", bounce: 0.4 }} className="relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden">

                    <div className="absolute top-0 left-0 w-full h-40 sm:h-56 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                        <motion.div animate={{ x: [0, 40, 0], y: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className={`absolute -top-20 -left-20 w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br ${activeRank.grad} rounded-full blur-[60px] md:blur-[80px] opacity-40 md:opacity-30`} />
                        <motion.div animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 -right-20 w-72 h-72 md:w-96 md:h-96 bg-indigo-500 rounded-full blur-[80px] md:blur-[100px] opacity-30 md:opacity-20" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgxMDAsMTAwLDEwMCwwLjE1KSIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                    </div>

                    <motion.div
                        animate={isMaxLevel ? { rotateY: [0, 360] } : { y: [0, -8, 0] }}
                        transition={{ duration: isMaxLevel ? 4 : 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20 flex flex-col items-center group"
                    >
                        <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-[1.25rem] sm:rounded-[1.5rem] bg-gradient-to-br ${activeRank.grad} p-[2px] shadow-2xl shadow-${activeRank.color.split('-')[1]}-500/40 cursor-help transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[1.1rem] sm:rounded-[1.35rem] flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
                                {isAnonymous ? "🕵️" : activeRank.icon}
                            </div>
                        </div>
                        <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-all bg-slate-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1.5 rounded-xl whitespace-nowrap shadow-xl pointer-events-none transform translate-y-2 group-hover:translate-y-0 duration-300 uppercase tracking-[0.2em] border border-white/10 dark:border-slate-200">
                            {activeRank.title}
                        </div>
                    </motion.div>

                    <div className="px-6 sm:px-10 pb-8 sm:pb-10 pt-24 sm:pt-36 relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 text-center sm:text-left">
                        <div className="relative group">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-[2.5rem] bg-white/50 dark:bg-slate-800/50 p-2 backdrop-blur-xl shadow-2xl shrink-0 -mt-24 sm:-mt-16 relative z-10 transition-transform duration-500 group-hover:scale-105 border border-white/50 dark:border-slate-700/50">
                                <div className={`w-full h-full rounded-[1.75rem] sm:rounded-[2.25rem] bg-gradient-to-br ${activeRank.grad} p-[3px]`}>
                                    <div className="w-full h-full rounded-[1.6rem] sm:rounded-[2.1rem] bg-white dark:bg-slate-900 flex items-center justify-center text-5xl sm:text-6xl font-black text-slate-800 dark:text-white shadow-inner">
                                        {isAnonymous ? "?" : authorName?.charAt(0)?.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br ${activeRank.grad} p-0.5 z-20 shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300`}>
                                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[0.6rem] flex items-center justify-center text-sm">
                                    {activeRank.icon}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full flex flex-col items-center sm:items-start gap-2">
                            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none drop-shadow-sm">{authorName}</h1>
                            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-1 sm:mt-2">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest ${activeRank.bg} ${activeRank.color} shadow-sm border border-white/40 dark:border-slate-700/50 flex items-center gap-1.5`}>
                                    <span className="relative flex h-2 w-2">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 bg-current`}></span>
                                    </span>
                                    {activeRank.title}
                                </span>
                                <span className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/40 dark:border-slate-700/50 shadow-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {details.location}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* NO SCROLLING TROPHY CASE - GRID LAYOUT */}
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs md:text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            Trophy Matrix
                        </h3>
                        <span className="text-[10px] md:text-xs font-black bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            {ALL_RANKS.filter(r => currentCount >= r.req).length} / {ALL_RANKS.length} Unlocked
                        </span>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4 w-full">
                        {ALL_RANKS.map((rank) => {
                            const isUnlocked = currentCount >= rank.req;
                            return (
                                <motion.div key={rank.id} variants={fadeUp} whileHover={isUnlocked ? { y: -5, scale: 1.05 } : {}} className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] w-full aspect-square transition-all duration-300 ${isUnlocked ? `bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-slate-700/50 shadow-md hover:shadow-xl cursor-help` : 'bg-slate-200/50 dark:bg-slate-800/30 border border-slate-300/50 dark:border-slate-800/50 opacity-60 grayscale'}`}>
                                    {isUnlocked && (
                                        <div className={`absolute inset-0 bg-gradient-to-br ${rank.grad} opacity-[0.08] dark:opacity-10 rounded-[1.25rem] sm:rounded-[1.5rem] pointer-events-none`} />
                                    )}
                                    <div className="text-2xl sm:text-3xl mb-1.5 relative z-10 drop-shadow-md">{rank.icon}</div>
                                    <div className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-center leading-tight relative z-10 px-1 ${isUnlocked ? rank.color : 'text-slate-400'}`}>
                                        {rank.title}
                                    </div>
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-900/40 rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center backdrop-blur-[1px]">
                                            <div className="bg-slate-900/80 dark:bg-slate-800/90 backdrop-blur-md text-white dark:text-slate-300 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-white/10 shadow-lg">Need {rank.req}</div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    <motion.div variants={fadeUp} initial="hidden" animate="show" className="md:col-span-2 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 blur-[40px] rounded-full group-hover:bg-indigo-500/20 transition-colors duration-500 pointer-events-none"></div>

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    Audit Level Progression
                                </p>
                                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Leveling Up</h2>
                            </div>
                            <div className={`text-5xl sm:text-6xl drop-shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>{nextRank.icon}</div>
                        </div>

                        <div className="w-full relative z-10 bg-slate-50/60 dark:bg-slate-800/40 p-5 md:p-6 rounded-[1.5rem] border border-white/50 dark:border-slate-700/50 shadow-sm">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-baseline gap-2">
                                    <strong className={`text-3xl sm:text-4xl ${activeRank.color} drop-shadow-sm`}>{currentCount}</strong>
                                    <span className="hidden sm:inline">Engagements</span>
                                    <span className="sm:hidden">Total</span>
                                </span>
                                <span className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                    {isMaxLevel ? "Max Level Reached!" : `${nextRank.req - currentCount} to ${nextRank.title}`}
                                </span>
                            </div>
                            <div className="h-4 sm:h-5 w-full bg-slate-200/50 dark:bg-slate-900/50 rounded-full overflow-hidden shadow-inner relative border border-slate-300/30 dark:border-slate-800">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1.5, ease: "easeOut", type: "spring", bounce: 0.2 }} className={`h-full rounded-full bg-gradient-to-r ${activeRank.grad} relative shadow-[0_0_10px_rgba(99,102,241,0.5)]`}>
                                    <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-1/2 h-full bg-white/30 skew-x-12" />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeUp} initial="hidden" animate="show" className="md:col-span-1 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col relative overflow-hidden group">
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/10 blur-[40px] rounded-full group-hover:bg-purple-500/20 transition-colors duration-500 pointer-events-none"></div>

                        <h2 className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2 relative z-10">
                            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            About Protocol
                        </h2>
                        <div className="bg-slate-50/60 dark:bg-slate-800/40 p-5 rounded-2xl border border-white/50 dark:border-slate-700/50 flex-1 relative shadow-sm">
                            <span className="absolute top-2 left-2 text-4xl text-slate-200 dark:text-slate-700 opacity-50 font-serif leading-none">"</span>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-[15px] leading-relaxed font-medium italic relative z-10 px-3 pt-3 pb-2">
                                {details.bio}
                            </p>
                            <span className="absolute bottom-[-10px] right-4 text-4xl text-slate-200 dark:text-slate-700 opacity-50 font-serif rotate-180 leading-none">"</span>
                        </div>
                        <div className="mt-5 pt-5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between relative z-10">
                            <div className="flex flex-col">
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Integration Date</p>
                                <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-white/40 dark:border-slate-700/50 shadow-sm w-fit">
                                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    {details.joinDate}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeUp} initial="hidden" animate="show" className="md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            { label: "Total Proofs", val: currentCount, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/80 dark:bg-indigo-500/10", border: "border-indigo-100 dark:border-indigo-500/20", icon: "📑" },
                            { label: "AI Avg Score", val: `${avgAI}%`, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/80 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20", icon: "🤖" },
                            { label: "Ghosts Found", val: ghostCaught, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50/80 dark:bg-rose-500/10", border: "border-rose-100 dark:border-rose-500/20", icon: "👻" },
                            { label: "Community Role", val: details.role, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/80 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-500/20", icon: "🎭" },
                        ].map((stat, i) => (
                            <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className={`${stat.bg} p-5 sm:p-6 rounded-[2rem] border ${stat.border} shadow-sm flex flex-col relative overflow-hidden group transition-all duration-300`}>
                                <div className="absolute -right-4 -top-4 text-6xl opacity-[0.07] dark:opacity-[0.15] group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 grayscale">{stat.icon}</div>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 relative z-10">{stat.label}</p>
                                <p className={`text-3xl sm:text-4xl font-black ${stat.color} truncate w-full relative z-10 drop-shadow-sm`}>{stat.val}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                </div>

                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-10 border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[0.85rem] bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/30 text-indigo-500 shadow-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            Public Audit History
                        </h3>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                            {userComments.length} Records Found
                        </span>
                    </div>

                    {userComments.length === 0 ? (
                        <div className="bg-slate-50/60 dark:bg-slate-800/40 p-10 sm:p-16 rounded-[2rem] md:rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-sm flex items-center justify-center text-4xl mb-5 border border-slate-100 dark:border-slate-700">📭</div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No Audits Yet</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm max-w-sm leading-relaxed">This citizen hasn't verified any projects publicly yet.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 md:gap-6">
                            {userComments.slice().reverse().map((comment) => (
                                <motion.div key={comment.id} variants={fadeUp} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-5 sm:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-700/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] flex flex-col gap-4 group hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-300 transform-gpu hover:-translate-y-1">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <span className="text-[10px] md:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                Logged: {formatDateTime(comment.created_at)}
                                            </span>
                                        </div>
                                        {Number(comment.is_ghost_alert) === 1 ? (
                                            <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] md:text-[11px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl border border-rose-100 dark:border-rose-500/20 flex items-center gap-2 shadow-sm">
                                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                                                Ghost Flag
                                            </span>
                                        ) : (
                                            <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] md:text-[11px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex items-center gap-2 shadow-sm">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                AI Trust: {comment.ai_match_score}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="bg-slate-50/60 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                                        <p className="text-sm md:text-[15px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">"{comment.text_content}"</p>
                                    </div>
                                    <Link to={`/project/${comment.project_id}`} className="text-[11px] md:text-xs font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-fit flex items-center gap-2 mt-1 group-hover:translate-x-2 duration-300 bg-transparent px-0">
                                        Inspect Record
                                        <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/40 transition-colors shadow-sm">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
}