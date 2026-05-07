import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export default function PublicAgencyProfile() {
    const { name } = useParams();
    const decodedName = decodeURIComponent(name || "");
    const navigate = useNavigate();
    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [details, setDetails] = useState<any>(null);
    const [agencyProjects, setAgencyProjects] = useState<any[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const calculateAgencyRank = (score: number) => {
        if (score >= 90) return { title: "Gold Standard Agency", badge: "🏆", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", ring: "text-amber-400" };
        if (score >= 75) return { title: "Trusted Builder", badge: "🏅", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", ring: "text-emerald-400" };
        if (score >= 50) return { title: "Developing Transparency", badge: "📈", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", ring: "text-blue-400" };
        if (score > 0) return { title: "Needs Improvement", badge: "⚠️", color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", ring: "text-red-400" };
        return { title: "Unrated Agency", badge: "🏛️", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800", ring: "text-slate-300 dark:text-slate-600" };
    };

    const getCategoryUI = (category: string) => {
        const cat = (category || "").toLowerCase();
        if (cat.includes("health") || cat.includes("medical") || cat.includes("safety") || cat.includes("hospital")) return { bg: "from-rose-500 to-pink-600", icon: "🏥" };
        if (cat.includes("environment") || cat.includes("green") || cat.includes("agriculture") || cat.includes("park") || cat.includes("tree")) return { bg: "from-emerald-500 to-teal-600", icon: "🌿" };
        if (cat.includes("education") || cat.includes("school") || cat.includes("university")) return { bg: "from-violet-500 to-purple-600", icon: "📚" };
        if (cat.includes("water") || cat.includes("flood") || cat.includes("sanitation") || cat.includes("drainage")) return { bg: "from-cyan-500 to-blue-600", icon: "💧" };
        if (cat.includes("commerce") || cat.includes("market") || cat.includes("economy") || cat.includes("business")) return { bg: "from-amber-500 to-orange-500", icon: "🏪" };
        if (cat.includes("road") || cat.includes("bridge") || cat.includes("highway") || cat.includes("street")) return { bg: "from-slate-600 to-slate-800", icon: "🛣️" };
        if (cat.includes("energy") || cat.includes("power") || cat.includes("solar") || cat.includes("electric")) return { bg: "from-yellow-400 to-amber-500", icon: "⚡" };
        if (cat.includes("housing") || cat.includes("residential") || cat.includes("home")) return { bg: "from-indigo-400 to-cyan-400", icon: "🏘️" };
        return { bg: "from-indigo-500 to-blue-600", icon: "🏗️" }; // Default
    };

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                const uRes = await fetch(`http://localhost:8080/api/users`);
                if (!uRes.ok) throw new Error();
                const allUsers = await uRes.json();

                const agencyUser = allUsers.find((u: any) => u.organization_name === decodedName && u.role === "agency");

                if (!agencyUser) {
                    setDetails(null);
                    setIsLoading(false);
                    return;
                }

                let allProjects: any[] = [];
                try {
                    const pRes = await fetch("http://localhost:8080/api/projects");
                    if (pRes.ok) {
                        const pData = await pRes.json();
                        if (Array.isArray(pData)) allProjects = pData;
                    }
                } catch (e) { }

                const filteredProjects = allProjects.filter((p: any) =>
                    p.organization_name === decodedName || (!p.organization_name && decodedName === "DPWH")
                ).map((p: any) => ({
                    ...p,
                    ui: getCategoryUI(p.category)
                }));

                setAgencyProjects(filteredProjects);

                let totalLikes = 0; let totalUnlikes = 0; let totalPhases = 0; let completedPhases = 0;

                filteredProjects.forEach((p: any) => {
                    totalLikes += Number(p.likes || 0); totalUnlikes += Number(p.unlikes || 0);
                    let phases = [];
                    try { phases = typeof p.phases === 'string' ? JSON.parse(p.phases) : p.phases; } catch (e) { }
                    if (Array.isArray(phases)) {
                        totalPhases += phases.length;
                        completedPhases += phases.filter((ph: any) => ph.status === 'completed' || ph.image_url).length;
                    }
                });

                const totalVotes = totalLikes + totalUnlikes;
                const approvalRating = totalVotes > 0 ? Math.round((totalLikes / totalVotes) * 100) : 100;
                const completionRate = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
                const transparencyScore = filteredProjects.length > 0 ? Math.round((approvalRating + completionRate) / 2) : 0;

                const rank = calculateAgencyRank(transparencyScore);

                setDetails({
                    organization_name: agencyUser.organization_name,
                    location: agencyUser.location || "Location not specified",
                    bio: agencyUser.bio || "This agency has not provided a public mandate yet.",
                    contact_email: agencyUser.email || "No email provided",
                    transparencyScore, approvalRating, completionRate,
                    badge: rank.badge, badgeColor: rank.color, badgeBg: rank.bg, ring: rank.ring,
                    rankTitle: rank.title, totalProjects: filteredProjects.length
                });

            } catch (e) { console.error("Public Profile Fetch Error:", e); } finally { setIsLoading(false); }
        };
        fetchPublicData();
        if (user?.email && decodedName) {
            fetch("http://localhost:8080/api/logs/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    actor_email: user.email,
                    action_type: "VIEW",
                    description: `Viewed official agency profile: ${decodedName}`
                })
            }).catch(console.error);
        }
    }, [decodedName]);

    useEffect(() => {
        if (user?.email && decodedName) {
            fetch(`http://localhost:8080/api/users/followed-agencies?email=${user.email}`)
                .then(res => res.json())
                .then(data => { if (data.followed_agencies) setIsFollowing(data.followed_agencies.includes(decodedName)); })
                .catch(console.error);
        }
    }, [user, decodedName]);

    const handleToggleFollow = async () => {
        if (!user?.email) return alert("Please log in to follow agencies.");
        setIsFollowing(!isFollowing);
        try {
            await fetch("http://localhost:8080/api/users/toggle-follow-agency", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, agency_name: decodedName })
            });
        } catch (error) { console.error("Failed to follow agency", error); }
    };

    const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "🏛️";

    if (isLoading) return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950">
            <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 rounded-full border-t-4 border-indigo-500 opacity-30"></motion.div>
                <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="h-16 w-16 md:h-20 md:w-20 rounded-full border-l-4 border-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] flex items-center justify-center text-2xl md:text-3xl">🏛️</motion.div>
            </div>
            <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xs md:text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Loading Official Profile...</motion.p>
        </div>
    );

    if (!details) return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-slate-50 dark:bg-slate-950">
            <div className="text-6xl sm:text-7xl mb-6 opacity-80 filter drop-shadow-md">🕵️‍♂️</div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Agency Not Found</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-3 mb-8 max-w-md leading-relaxed font-medium">We couldn't find an official registered agency named "<span className="text-slate-700 dark:text-slate-300 font-bold">{decodedName}</span>".</p>
            <button onClick={() => navigate(-1)} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/30 transform hover:-translate-y-1 active:scale-95 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Return to Directory
            </button>
        </motion.div>
    );

    return (
        <div className="w-full min-h-screen relative overflow-x-hidden font-sans pb-24 bg-slate-50 dark:bg-slate-950 selection:bg-indigo-500/30">
            <div className="fixed inset-0 pointer-events-none -z-20">
                <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                <motion.div animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute top-[20%] right-[-10%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-purple-500/10 dark:bg-purple-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <div className="max-w-[85rem] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-8 md:gap-12 relative z-10">

                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.4 }}>
                    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2.5 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-slate-700/50 shadow-sm text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 hover:scale-105 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 w-fit">
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Feed
                    </button>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, type: "spring", bounce: 0.4 }} className="relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-48 sm:h-64 bg-slate-900 dark:bg-slate-950 overflow-hidden">
                        <motion.div animate={{ x: [0, 50, 0], y: [0, -20, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className={`absolute -top-20 -left-20 w-80 h-80 md:w-96 md:h-96 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-[80px] md:blur-[100px] opacity-50 md:opacity-40`} />
                        <motion.div animate={{ x: [0, -50, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 -right-20 w-72 h-72 md:w-96 md:h-96 bg-blue-500 rounded-full blur-[80px] md:blur-[100px] opacity-40 md:opacity-30" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-50" />
                    </div>

                    <div className="px-6 sm:px-10 pb-10 sm:pb-12 pt-28 sm:pt-44 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 text-center md:text-left">
                        <div className="relative group shrink-0">
                            <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-[2rem] sm:rounded-[2.5rem] bg-white/80 dark:bg-slate-800/80 p-2.5 backdrop-blur-xl shadow-2xl -mt-24 sm:-mt-20 relative z-10 transition-transform duration-500 group-hover:scale-105 border border-white/50 dark:border-slate-700/50">
                                <div className={`w-full h-full rounded-[1.6rem] sm:rounded-[2.1rem] bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200/50 dark:border-slate-700 flex items-center justify-center text-6xl sm:text-7xl font-black text-indigo-600 dark:text-indigo-400 shadow-inner`}>
                                    {getInitial(details.organization_name)}
                                </div>
                            </div>
                            <div className={`absolute -bottom-3 -right-3 w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] bg-white dark:bg-slate-800 p-1.5 z-20 shadow-xl transform rotate-12 group-hover:rotate-0 transition-transform duration-300 border border-slate-100 dark:border-slate-700`}>
                                <div className="w-full h-full bg-blue-50 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full flex flex-col items-center md:items-start gap-2">
                            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 w-full justify-center md:justify-start">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none drop-shadow-sm">{details.organization_name}</h1>
                                <button onClick={handleToggleFollow} className={`shrink-0 px-6 py-3 sm:py-3.5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-md flex items-center gap-2 border ${isFollowing ? "bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 border-slate-200 dark:border-slate-700 backdrop-blur-md" : "bg-indigo-600 text-white border-transparent hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-500/30"}`}>
                                    {isFollowing ? (<><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Following</>) : (<><span className="text-sm leading-none">+</span> Follow Agency</>)}
                                </button>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-3 sm:mt-4">
                                <div className={`px-4 sm:px-5 py-2 rounded-full inline-flex items-center gap-2 ${details.badgeBg} ${details.badgeColor} border border-current/20 shadow-sm`}>
                                    <span className="text-lg sm:text-xl leading-none drop-shadow-sm">{details.badge}</span>
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{details.rankTitle}</span>
                                </div>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/40 dark:border-slate-700/50 shadow-sm">
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {details.location}
                                </span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/40 dark:border-slate-700/50 shadow-sm">
                                    <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    {details.contact_email}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 sm:px-10 pb-8 sm:pb-10 pt-6 sm:pt-8 border-t border-slate-200/60 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="max-w-4xl mx-auto md:mx-0">
                            <p className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-center md:justify-start gap-2">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Official Mandate & Description
                            </p>
                            <div className="bg-white/80 dark:bg-slate-800/50 p-5 sm:p-6 rounded-[1.5rem] border border-white/50 dark:border-slate-700/50 shadow-sm relative">
                                <span className="absolute top-2 left-2 text-4xl text-indigo-500/10 font-serif leading-none">"</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed font-medium relative z-10 px-2 italic text-center md:text-left">{details.bio}</p>
                                <span className="absolute bottom-[-10px] right-4 text-4xl text-indigo-500/10 font-serif rotate-180 leading-none">"</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 100 }} whileHover={{ y: -8, scale: 1.02 }} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-colors duration-500" />
                        <p className="text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] relative z-10 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            Platform Transparency
                        </p>
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-md">
                                <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                                <motion.circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className={details.ring} strokeDasharray={439.8} initial={{ strokeDashoffset: 439.8 }} animate={{ strokeDashoffset: 439.8 - (439.8 * details.transparencyScore) / 100 }} transition={{ duration: 2, ease: "easeOut", type: "spring", bounce: 0.2 }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className={`text-5xl font-black ${details.badgeColor} drop-shadow-sm`}>{details.transparencyScore}%</p>
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-6 relative z-10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700/50">Combined Trust Metric</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 100 }} whileHover={{ y: -8, scale: 1.02 }} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/20 blur-[50px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-500" />
                        <div className="w-20 h-20 rounded-[1.5rem] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-4xl mb-6 shadow-inner border border-blue-100 dark:border-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">👍</div>
                        <p className="text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">Citizen Approval</p>
                        <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">{details.approvalRating}%</p>
                        <div className="w-full h-2 sm:h-2.5 bg-slate-200/50 dark:bg-slate-800 rounded-full mt-8 overflow-hidden shadow-inner border border-slate-300/30 dark:border-slate-700/50">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${details.approvalRating}%` }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.3, type: "spring" }} className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 relative">
                                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 100 }} whileHover={{ y: -8, scale: 1.02 }} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/20 transition-colors duration-500" />
                        <div className="w-20 h-20 rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-4xl mb-6 shadow-inner border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">🏗️</div>
                        <p className="text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">Completion Rate</p>
                        <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">{details.completionRate}%</p>
                        <div className="w-full h-2 sm:h-2.5 bg-slate-200/50 dark:bg-slate-800 rounded-full mt-8 overflow-hidden shadow-inner border border-slate-300/30 dark:border-slate-700/50">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${details.completionRate}%` }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.4, type: "spring" }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 relative">
                                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                            </motion.div>
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mt-4 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/50">Across {details.totalProjects} Projects</p>
                    </motion.div>
                </div>

                <div className="mt-8 md:mt-12 flex flex-col gap-6 md:gap-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
                            Managed Projects
                        </h3>
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/40 dark:border-slate-700/50 shadow-sm flex items-center gap-2.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Portfolio</span>
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-black border border-indigo-200 dark:border-indigo-500/30">{agencyProjects.length}</span>
                        </div>
                    </div>

                    {agencyProjects.length === 0 ? (
                        <div className="w-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-12 sm:p-20 text-center border-2 border-slate-200/60 dark:border-slate-700/50 border-dashed shadow-xl flex flex-col items-center justify-center">
                            <div className="w-24 h-24 mb-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-5xl shadow-inner border border-slate-100 dark:border-slate-700">📭</div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">No projects found</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium max-w-sm leading-relaxed">This agency hasn't published any official infrastructure projects to the public ledger yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {agencyProjects.map((project, index) => (
                                <motion.div key={project.id} initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: index * 0.05, duration: 0.5, type: "spring", stiffness: 100 }} className="flex h-full">
                                    <Link to={`/project/${project.id}`} className="w-full group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/50 overflow-hidden shadow-lg shadow-slate-200/40 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-2xl dark:hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)] transition-all duration-500 flex flex-col transform-gpu hover:-translate-y-2">
                                        <div className={`h-40 sm:h-48 bg-gradient-to-br ${project.ui.bg} relative overflow-hidden flex flex-col items-center justify-center shadow-inner group/image`}>
                                            <div className="absolute inset-0 opacity-40 group-hover/image:scale-125 group-hover/image:rotate-2 transition-transform duration-1000 ease-out mix-blend-overlay">
                                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white/50"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /><circle cx="80" cy="80" r="40" /></svg>
                                            </div>
                                            <span className="text-6xl drop-shadow-2xl group-hover/image:scale-110 group-hover/image:-rotate-6 transition-transform duration-500 z-10">{project.ui.icon}</span>

                                            <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white font-black tracking-widest uppercase text-[9px] shadow-sm border border-white/20 group-hover/image:scale-105 transition-transform duration-300 z-20">
                                                {project.category || "General"}
                                            </div>

                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm z-20">
                                                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-6 py-3 rounded-2xl text-slate-900 dark:text-white font-black tracking-widest uppercase text-[11px] shadow-2xl translate-y-8 group-hover/image:translate-y-0 transition-transform duration-500 ease-out flex items-center gap-2">
                                                    View Details
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 sm:p-6 flex flex-col flex-grow relative z-10 bg-transparent">
                                            <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-4">{project.title}</h4>

                                            <div className="flex flex-col gap-1 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm mt-auto mb-4">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Allocated Budget</span>
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₱{project.budget}</span>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center gap-4">
                                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                                                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">{project.likes || 0}</span>
                                                </div>

                                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-colors shadow-sm">
                                                    <svg className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}