import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

    const calculateAgencyRank = (score: number) => {
        if (score >= 90) return { title: "Gold Standard Agency", badge: "🏆", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", ring: "text-amber-400" };
        if (score >= 75) return { title: "Trusted Builder", badge: "🏅", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", ring: "text-emerald-400" };
        if (score >= 50) return { title: "Developing Transparency", badge: "📈", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", ring: "text-blue-400" };
        if (score > 0) return { title: "Needs Improvement", badge: "⚠️", color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", ring: "text-red-400" };
        return { title: "Unrated Agency", badge: "🏛️", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/50", ring: "text-slate-300 dark:text-slate-700" };
    };

    const getCategoryUI = (category: string) => {
        const cat = (category || "").toLowerCase();
        if (cat.includes("health") || cat.includes("medical") || cat.includes("safety") || cat.includes("hospital")) return { bg: "from-rose-500 to-pink-600", icon: "🏥" };
        if (cat.includes("environment") || cat.includes("green") || cat.includes("agriculture") || cat.includes("park") || cat.includes("tree")) return { bg: "from-emerald-500 to-teal-600", icon: "🌿" };
        if (cat.includes("education") || cat.includes("school") || cat.includes("university")) return { bg: "from-violet-500 to-purple-600", icon: "📚" };
        if (cat.includes("water") || cat.includes("flood") || cat.includes("sanitation") || cat.includes("drainage")) return { bg: "from-cyan-500 to-blue-600", icon: "💧" };
        if (cat.includes("commerce") || cat.includes("market") || cat.includes("economy") || cat.includes("business")) return { bg: "from-amber-500 to-orange-500", icon: "🏪" };
        if (cat.includes("road") || cat.includes("bridge") || cat.includes("highway") || cat.includes("street")) return { bg: "from-slate-600 to-slate-800 dark:from-slate-700 dark:to-slate-900", icon: "🛣️" };
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

    // Smooth Staggered Animations
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    if (isLoading) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full"></div>
            <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Official Profile...</p>
        </motion.div>
    );

    if (!details) return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-5xl mx-auto py-20 px-4 text-center">
            <div className="text-6xl mb-4">🕵️‍♂️</div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Agency Not Found</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">We couldn't find an official registered agency named "{decodedName}".</p>
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all">Go Back</button>
        </motion.div>
    );

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="w-full max-w-5xl mx-auto flex flex-col gap-6 md:gap-8 py-6 md:py-8 px-4 pb-20"
        >
            <motion.button variants={itemVariants} onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-fit group">
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back to Feed
            </motion.button>

            <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 md:h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div></div>

                <div className="relative z-10 pt-16 md:pt-20 px-5 sm:px-8 md:px-10 pb-8 flex flex-col md:flex-row gap-5 md:gap-8 items-center md:items-end">
                    <div className="relative shrink-0">
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2rem] bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center text-5xl md:text-6xl font-black text-slate-800 dark:text-white shadow-2xl overflow-hidden">{getInitial(details.organization_name)}</div>
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md border border-slate-100 dark:border-slate-800"><div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg></div></div>
                    </div>

                    <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start gap-1 pb-1">
                        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{details.organization_name}</h1>
                            <button onClick={handleToggleFollow} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 ${isFollowing ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700" : "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 hover:scale-105 active:scale-95"}`}>
                                {isFollowing ? (<><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> Following</>) : "+ Follow Agency"}
                            </button>
                        </div>

                        <div className={`mt-3 mb-4 px-4 py-1.5 rounded-full inline-flex items-center gap-2 ${details.badgeBg} ${details.badgeColor} border border-current/10 shadow-sm`}><span className="text-lg leading-none">{details.badge}</span><span className="text-xs font-black uppercase tracking-widest">{details.rankTitle}</span></div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start text-sm font-medium text-slate-500 dark:text-slate-400 mt-1"><span className="flex items-center gap-2">📍 {details.location}</span><span className="flex items-center gap-2">✉️ {details.contact_email}</span></div>
                    </div>
                </div>

                <div className="px-5 sm:px-8 md:px-10 pb-8 md:pb-10 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> Official Mandate</p>
                    <p className="text-slate-700 dark:text-slate-300 text-[14px] md:text-[15px] leading-relaxed max-w-4xl border-l-4 border-indigo-500 dark:border-indigo-400 pl-4 py-1">{details.bio}</p>
                </div>
            </motion.div>

            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08] rounded-full blur-3xl transition-opacity duration-500" />
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10 mb-2">Platform Transparency</p>
                    <div className="relative">
                        <svg className="w-28 h-28 md:w-32 md:h-32 transform -rotate-90">
                            <circle cx="50%" cy="50%" r="40%" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                            <motion.circle cx="50%" cy="50%" r="40%" fill="transparent" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className={details.ring} strokeDasharray={351.85} initial={{ strokeDashoffset: 351.85 }} animate={{ strokeDashoffset: 351.85 - (351.85 * details.transparencyScore) / 100 }} transition={{ duration: 1.5, ease: "easeOut" }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center"><p className={`text-3xl md:text-4xl font-black ${details.badgeColor}`}>{details.transparencyScore}%</p></div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 relative z-10">Combined Trust Metric</p>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-lg transition-all">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">👍</div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Citizen Approval</p>
                    <p className="text-3xl md:text-4xl font-black mt-1 text-slate-900 dark:text-white">{details.approvalRating}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-5 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${details.approvalRating}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-blue-500 dark:bg-blue-400" /></div>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-lg transition-all">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">🏗️</div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completion Rate</p>
                    <p className="text-3xl md:text-4xl font-black mt-1 text-slate-900 dark:text-white">{details.completionRate}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-5 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${details.completionRate}%` }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-emerald-500 dark:bg-emerald-400" /></div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-3">Across {details.totalProjects} Projects</p>
                </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-4 md:mt-8">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                    Projects Managed
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold">{agencyProjects.length}</span>
                </h3>

                {agencyProjects.length === 0 ? (
                    <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 md:p-12 text-center border border-slate-200 dark:border-slate-800 border-dashed"><span className="text-4xl mb-4 block">📭</span><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No projects found</h3><p className="text-slate-500 dark:text-slate-400 text-sm">This agency hasn't published any infrastructure projects yet.</p></div>
                ) : (
                    <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {agencyProjects.map((project) => (
                            <motion.div key={project.id} variants={itemVariants} whileHover={{ y: -5 }}>
                                <Link to={`/project/${project.id}`} className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full">
                                    <div className={`h-32 md:h-36 bg-gradient-to-br ${project.ui.bg} relative overflow-hidden flex flex-col items-center justify-center`}>
                                        <div className="absolute inset-0 opacity-30 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-overlay">
                                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /></svg>
                                        </div>
                                        <span className="text-4xl md:text-5xl drop-shadow-xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">{project.ui.icon}</span>
                                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider shadow-sm">{project.category || "General"}</div>
                                    </div>

                                    <div className="p-4 md:p-5 flex flex-col flex-grow">
                                        <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{project.title}</h4>
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider mb-3">Budget: ₱{project.budget}</p>
                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400"><span>👍 {project.likes || 0}</span><span className="text-indigo-500 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">View Details →</span></div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}