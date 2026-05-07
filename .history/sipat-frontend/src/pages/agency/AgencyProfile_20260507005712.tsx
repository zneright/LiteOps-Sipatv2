import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export default function AgencyProfile() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [realUid, setRealUid] = useState<string | null>(null);

    const [details, setDetails] = useState({
        organization_name: "Loading...",
        location: "",
        bio: "",
        contact_email: "",
        transparencyScore: 0,
        approvalRating: 0,
        completionRate: 0,
        badge: "🏛️",
        badgeColor: "text-slate-500",
        badgeBg: "bg-slate-100",
        rankTitle: "Calculating Rank...",
        totalProjects: 0
    });

    const [editForm, setEditForm] = useState({
        organization_name: "",
        location: "",
        bio: "",
        contact_email: ""
    });

    const [isEditing, setIsEditing] = useState(false);

    const calculateAgencyRank = (score: number) => {
        if (score >= 90) return { title: "Gold Standard Agency", badge: "🏆", color: "text-amber-500", bg: "bg-amber-50" };
        if (score >= 75) return { title: "Trusted Builder", badge: "🏅", color: "text-emerald-500", bg: "bg-emerald-50" };
        if (score >= 50) return { title: "Developing Transparency", badge: "📈", color: "text-blue-500", bg: "bg-blue-50" };
        if (score > 0) return { title: "Needs Improvement", badge: "⚠️", color: "text-red-500", bg: "bg-red-50" };
        return { title: "Unrated Agency", badge: "🏛️", color: "text-slate-500", bg: "bg-slate-50" };
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.email) return;

            try {
                // 1. Fetch DB User
                const uRes = await fetch(`http://localhost:8080/api/users?email=${user.email}`);
                let dbUser: any = {};
                if (uRes.ok) {
                    const uData = await uRes.json();
                    dbUser = Array.isArray(uData) && uData.length > 0 ? uData[0] : {};
                    if (dbUser.firebase_uid) setRealUid(dbUser.firebase_uid);
                }

                // 2. Fetch Projects safely
                let allProjects: any[] = [];
                try {
                    const pRes = await fetch("http://localhost:8080/api/projects");
                    if (pRes.ok) {
                        const pData = await pRes.json();
                        if (Array.isArray(pData)) allProjects = pData;
                    }
                } catch (e) { }

                // 3. Calculate Math
                let totalLikes = 0;
                let totalUnlikes = 0;
                let totalPhases = 0;
                let completedPhases = 0;

                allProjects.forEach((p: any) => {
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
                const transparencyScore = allProjects.length > 0 ? Math.round((approvalRating + completionRate) / 2) : 0;

                const rank = calculateAgencyRank(transparencyScore);
                const orgName = dbUser.organization_name || "Government Agency";
                const email = dbUser.email || user.email || "";

                setDetails({
                    organization_name: orgName,
                    location: dbUser.location || "",
                    bio: dbUser.bio || "",
                    contact_email: email,
                    transparencyScore,
                    approvalRating,
                    completionRate,
                    badge: rank.badge,
                    badgeColor: rank.color,
                    badgeBg: rank.bg,
                    rankTitle: rank.title,
                    totalProjects: allProjects.length
                });

                setEditForm({
                    organization_name: orgName === "Government Agency" ? "" : orgName,
                    location: dbUser.location || "",
                    bio: dbUser.bio || "",
                    contact_email: email
                });

            } catch (e) {
                console.error("Profile Fetch Error:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        if (!realUid) {
            alert("Error: Cannot find your account ID. Please refresh the page.");
            setIsSaving(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/api/users/${realUid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                setDetails(prev => ({
                    ...prev,
                    organization_name: editForm.organization_name,
                    location: editForm.location,
                    bio: editForm.bio,
                    contact_email: editForm.contact_email
                }));
                setIsEditing(false);
            } else {
                alert("Failed to save details.");
            }
        } catch (e) {
            alert("Network error while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "🏛️";

    if (isLoading) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Syncing Official Data...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 py-8 px-4 pb-20">

            {/* 🚀 PREMIUM BANNER */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">

                {/* Dynamic Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                </div>

                <div className="relative z-10 pt-20 px-6 sm:px-10 pb-8 flex flex-col md:flex-row gap-6 items-center md:items-end">

                    {/* Avatar Container */}
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 rounded-[2rem] bg-white dark:bg-slate-950 border-4 border-white dark:border-slate-950 flex items-center justify-center text-6xl font-black text-indigo-600 shadow-xl overflow-hidden">
                            {getInitial(details.organization_name)}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md border border-slate-100 dark:border-slate-800" title="Verified Agency Account">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start gap-1 pb-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {details.organization_name}
                            </h1>
                        </div>

                        <div className={`mt-2 mb-4 px-4 py-1.5 rounded-full inline-flex items-center gap-2 ${details.badgeBg} ${details.badgeColor} border border-current/10`}>
                            <span className="text-lg leading-none">{details.badge}</span>
                            <span className="text-xs font-black uppercase tracking-widest">{details.rankTitle}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start text-sm font-medium text-slate-500 mt-2">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {details.location || <span className="italic opacity-50">Location not set</span>}
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {details.contact_email || <span className="italic opacity-50">Email not set</span>}
                            </span>
                        </div>
                    </div>

                    <button onClick={() => setIsEditing(true)} className="mt-4 md:mt-0 px-8 py-3 bg-slate-900 hover:bg-indigo-600 dark:bg-white dark:hover:bg-indigo-400 text-white dark:text-slate-900 rounded-xl font-black text-sm shadow-lg shadow-slate-900/10 transition-all hover:scale-105 active:scale-95 whitespace-nowrap border border-transparent">
                        Update Profile
                    </button>
                </div>

                {/* Bio Section */}
                <div className="px-6 sm:px-10 pb-10 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Official Mandate</p>
                    <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed max-w-4xl">
                        {details.bio || <span className="italic text-slate-400">Click "Update Profile" to add an official mandate, history, or primary responsibilities for your organization. This helps citizens understand your mission.</span>}
                    </p>
                </div>
            </motion.div>

            {/* 🚀 AGENCY METRICS DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Transparency Score */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-3xl transition-opacity duration-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10 mb-2">Platform Transparency</p>
                    <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                            <motion.circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className={details.badgeColor} strokeDasharray={351.85} initial={{ strokeDashoffset: 351.85 }} animate={{ strokeDashoffset: 351.85 - (351.85 * details.transparencyScore) / 100 }} transition={{ duration: 1.5, ease: "easeOut" }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className={`text-4xl font-black ${details.badgeColor}`}>{details.transparencyScore}%</p>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-4 relative z-10">Combined Trust Metric</p>
                </motion.div>

                {/* Citizen Approval */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center group hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">👍</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen Approval</p>
                    <p className="text-4xl font-black mt-1 text-slate-900 dark:text-white">{details.approvalRating}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${details.approvalRating}%` }} transition={{ duration: 1 }} className="h-full bg-blue-500" />
                    </div>
                </motion.div>

                {/* Completion Rate */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center group hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">🏗️</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion Rate</p>
                    <p className="text-4xl font-black mt-1 text-slate-900 dark:text-white">{details.completionRate}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${details.completionRate}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-3">Across {details.totalProjects} Projects</p>
                </motion.div>
            </div>

            {/* 🚀 EDIT MODAL */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl">

                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Update Official Details</h2>
                                <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">✕</button>
                            </div>

                            <div className="flex flex-col gap-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Organization Name</label>
                                    <input className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-bold text-slate-900 dark:text-white transition-all" placeholder="e.g. Department of Public Works" value={editForm.organization_name} onChange={e => setEditForm({ ...editForm, organization_name: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Location / HQ</label>
                                        <input className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-bold text-slate-900 dark:text-white transition-all" placeholder="e.g. Manila, Philippines" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Public Contact Email</label>
                                        <input type="email" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-bold text-slate-900 dark:text-white transition-all" placeholder="contact@gov.ph" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Official Mandate</label>
                                    <textarea className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium leading-relaxed text-slate-900 dark:text-white transition-all resize-none" placeholder="Describe the agency's primary responsibilities..." rows={4} value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50 text-sm">Cancel</button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                                    {isSaving ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Saving Changes...
                                        </>
                                    ) : "Save Official Details"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}