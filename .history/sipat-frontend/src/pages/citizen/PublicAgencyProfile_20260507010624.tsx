import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function PublicAgencyProfile() {
    const { name } = useParams();
    const decodedName = decodeURIComponent(name || "");
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [details, setDetails] = useState<any>(null);
    const [agencyProjects, setAgencyProjects] = useState<any[]>([]);

    const calculateAgencyRank = (score: number) => {
        if (score >= 90) return { title: "Gold Standard Agency", badge: "🏆", color: "text-amber-500", bg: "bg-amber-50", ring: "text-amber-400" };
        if (score >= 75) return { title: "Trusted Builder", badge: "🏅", color: "text-emerald-500", bg: "bg-emerald-50", ring: "text-emerald-400" };
        if (score >= 50) return { title: "Developing Transparency", badge: "📈", color: "text-blue-500", bg: "bg-blue-50", ring: "text-blue-400" };
        if (score > 0) return { title: "Needs Improvement", badge: "⚠️", color: "text-red-500", bg: "bg-red-50", ring: "text-red-400" };
        return { title: "Unrated Agency", badge: "🏛️", color: "text-slate-500", bg: "bg-slate-50", ring: "text-slate-300" };
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

                // 🚀 Filter projects managed by this agency (Fallback to DPWH for your existing test data)
                const filteredProjects = allProjects.filter((p: any) =>
                    p.organization_name === decodedName || (!p.organization_name && decodedName === "DPWH")
                );
                setAgencyProjects(filteredProjects);

                let totalLikes = 0;
                let totalUnlikes = 0;
                let totalPhases = 0;
                let completedPhases = 0;

                filteredProjects.forEach((p: any) => {
                    totalLikes += Number(p.likes || 0);
                    totalUnlikes += Number(p.unlikes || 0);
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
                    transparencyScore,
                    approvalRating,
                    completionRate,
                    badge: rank.badge,
                    badgeColor: rank.color,
                    badgeBg: rank.bg,
                    ring: rank.ring,
                    rankTitle: rank.title,
                    totalProjects: filteredProjects.length
                });

            } catch (e) {
                console.error("Public Profile Fetch Error:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicData();
    }, [decodedName]);

    const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "🏛️";

    if (isLoading) return (
        <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Official Profile...</p>
        </div>
    );

    if (!details) return (
        <div className="w-full max-w-5xl mx-auto py-20 px-4 text-center">
            <div className="text-6xl mb-4">🕵️‍♂️</div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Agency Not Found</h1>
            <p className="text-slate-500 mt-2 mb-6">We couldn't find an official registered agency named "{decodedName}".</p>
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Go Back</button>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 py-8 px-4 pb-20">

            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Feed
            </button>

            {/* 🚀 STUNNING HERO BANNER */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
                </div>

                <div className="relative z-10 pt-20 px-6 sm:px-10 pb-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 rounded-[2rem] bg-white dark:bg-slate-950 border-4 border-white dark:border-slate-950 flex items-center justify-center text-6xl font-black text-slate-800 shadow-2xl overflow-hidden">
                            {getInitial(details.organization_name)}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md border border-slate-100 dark:border-slate-800" title="Verified Agency Account">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start gap-1 pb-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {details.organization_name}
                            </h1>
                        </div>

                        <div className={`mt-2 mb-4 px-4 py-1.5 rounded-full inline-flex items-center gap-2 ${details.badgeBg} ${details.badgeColor} border border-current/10 shadow-sm`}>
                            <span className="text-lg leading-none">{details.badge}</span>
                            <span className="text-xs font-black uppercase tracking-widest">{details.rankTitle}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start text-sm font-medium text-slate-500 mt-2">
                            <span className="flex items-center gap-2">📍 {details.location}</span>
                            <span className="flex items-center gap-2">✉️ {details.contact_email}</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 sm:px-10 pb-10 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        Official Mandate
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed max-w-4xl border-l-4 border-indigo-500 pl-4 py-1">
                        {details.bio}
                    </p>
                </div>
            </motion.div>

            {/* 🚀 METRICS DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-lg transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10 mb-2">Platform Transparency</p>
                    <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                            <motion.circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className={details.ring} strokeDasharray={351.85} initial={{ strokeDashoffset: 351.85 }} animate={{ strokeDashoffset: 351.85 - (351.85 * details.transparencyScore) / 100 }} transition={{ duration: 1.5, ease: "easeOut" }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className={`text-4xl font-black ${details.badgeColor}`}>{details.transparencyScore}%</p>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-4 relative z-10">Combined Trust Metric</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-lg transition-all">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">👍</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen Approval</p>
                    <p className="text-4xl font-black mt-1 text-slate-900 dark:text-white">{details.approvalRating}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${details.approvalRating}%` }} transition={{ duration: 1 }} className="h-full bg-blue-500" />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-lg transition-all">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">🏗️</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion Rate</p>
                    <p className="text-4xl font-black mt-1 text-slate-900 dark:text-white">{details.completionRate}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${details.completionRate}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-3">Across {details.totalProjects} Projects</p>
                </motion.div>
            </div>

            {/* 🚀 AGENCY PORTFOLIO */}
            <div className="mt-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                    Projects Managed by {details.organization_name}
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-xs font-bold">{agencyProjects.length}</span>
                </h3>

                {agencyProjects.length === 0 ? (
                    <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 border-dashed">
                        <span className="text-4xl mb-4 block">📭</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No projects found</h3>
                        <p className="text-slate-500 text-sm">This agency hasn't published any infrastructure projects yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agencyProjects.map((project, idx) => (
                            <Link key={project.id} to={`/project/${project.id}`} className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                                <div className="h-32 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                                    {project.file_url ? (
                                        <img src={project.file_url} alt={project.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">🏗️</div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black text-slate-800 uppercase tracking-wider shadow-sm">
                                        {project.category || "General"}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{project.title}</h4>
                                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider mb-3">Budget: ₱{project.budget}</p>
                                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-500">
                                        <span>👍 {project.likes || 0}</span>
                                        <span className="text-indigo-500 group-hover:translate-x-1 transition-transform">View Details →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}