import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export default function AgencyProfile() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 🚀 Initial State (No more "LOADING..." text jumps)
    const [details, setDetails] = useState({
        organization_name: "Fetching details...",
        location: "",
        bio: "",
        contact_email: "",
        transparencyScore: 0,
        approvalRating: 0,
        completionRate: 0,
        badge: "🏛️",
        badgeColor: "text-slate-500",
        rankTitle: "Calculating Rank..."
    });

    const [editForm, setEditForm] = useState({
        organization_name: "",
        location: "",
        bio: "",
        contact_email: ""
    });

    const [isEditing, setIsEditing] = useState(false);

    const calculateAgencyRank = (score: number) => {
        if (score >= 90) return { title: "Gold Standard Agency", badge: "🏆", color: "text-amber-400", bg: "bg-amber-100" };
        if (score >= 75) return { title: "Trusted Builder", badge: "🏅", color: "text-emerald-500", bg: "bg-emerald-100" };
        if (score >= 50) return { title: "Developing Transparency", badge: "📈", color: "text-blue-500", bg: "bg-blue-100" };
        if (score > 0) return { title: "Needs Improvement", badge: "⚠️", color: "text-red-500", bg: "bg-red-100" };
        return { title: "Unrated Agency", badge: "🏛️", color: "text-slate-500", bg: "bg-slate-100" };
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;

            const f_uid = user.uid || user.firebase_uid || user.id || null;
            if (!f_uid) return;

            try {
                // 1. Fetch Agency Profile from DB
                const uRes = await fetch(`http://localhost:8080/api/users?firebase_uid=${f_uid}`);
                let dbUser: any = {};

                if (uRes.ok) {
                    const uData = await uRes.json();
                    // 🚀 DEBUG: This will print your DB data to the console (F12)
                    console.log("Database User Data:", uData);
                    dbUser = Array.isArray(uData) && uData.length > 0 ? uData[0] : {};
                }

                // 2. Fetch Projects safely
                let allProjects: any[] = [];
                try {
                    const pRes = await fetch("http://localhost:8080/api/projects");
                    if (pRes.ok) {
                        const pData = await pRes.json();
                        if (Array.isArray(pData)) allProjects = pData;
                    }
                } catch (e) { console.warn("No projects found or API offline."); }

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

                // 🚀 THE FIX: Removed your personal name (`user.name`) from the fallback!
                // It will now ONLY use what the database says.
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
                    rankTitle: rank.title
                });

                setEditForm({
                    organization_name: orgName === "Unnamed Organization" ? "" : orgName,
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
        const f_uid = user?.uid || user?.firebase_uid;
        try {
            const res = await fetch(`http://localhost:8080/api/users/${f_uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                setDetails(prev => ({ ...prev, ...editForm }));
                setIsEditing(false);
            } else {
                alert("Failed to save. Ensure your CodeIgniter backend is running.");
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
                <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Syncing Agency Data...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 py-8 px-4 pb-20">

            {/* 🚀 PREMIUM AGENCY HEADER */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
                {/* Dynamic Gradient Banner */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90" />

                <div className="relative z-10 pt-16 px-8 pb-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">

                    {/* Avatar / Logo */}
                    <div className="w-32 h-32 shrink-0 rounded-[2rem] bg-white dark:bg-slate-950 border-4 border-white dark:border-slate-950 flex items-center justify-center text-5xl font-black text-indigo-600 shadow-xl relative">
                        {getInitial(details.organization_name)}
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm" title="Verified Agency">✓</div>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left pb-1">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {details.organization_name}
                            </h1>
                        </div>

                        <p className={`font-black uppercase tracking-widest text-sm mb-4 flex items-center justify-center md:justify-start gap-2 ${details.badgeColor}`}>
                            <span className="text-xl">{details.badge}</span> {details.rankTitle}
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 w-fit md:mx-0 mx-auto px-4 py-2 rounded-xl">
                            <span className="flex items-center gap-1.5">📍 {details.location || <span className="italic opacity-50">Location not set</span>}</span>
                            <span className="opacity-30">|</span>
                            <span className="flex items-center gap-1.5">✉️ {details.contact_email || <span className="italic opacity-50">Email not set</span>}</span>
                        </div>

                        <p className="mt-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-3xl">
                            {details.bio || <span className="italic opacity-50">Click "Edit Profile" to add an official mandate or bio for your organization.</span>}
                        </p>
                    </div>

                    <button onClick={() => setIsEditing(true)} className="mb-2 px-6 py-3 bg-slate-900 hover:bg-indigo-600 dark:bg-white dark:hover:bg-indigo-400 text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-md transition-colors whitespace-nowrap">
                        Edit Profile
                    </button>
                </div>
            </motion.div>

            {/* 🚀 AGENCY TRANSPARENCY STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-5 rounded-full blur-3xl" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Platform Transparency</p>
                    <p className={`text-6xl font-black mt-3 relative z-10 ${details.badgeColor}`}>{details.transparencyScore}%</p>
                    <p className="text-xs font-bold text-slate-500 mt-3 relative z-10">Combined Trust Metric</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-3">👍</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen Approval</p>
                    <p className="text-4xl font-black mt-2 text-blue-500">{details.approvalRating}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${details.approvalRating}%` }} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-3">🏗️</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion Rate</p>
                    <p className="text-4xl font-black mt-2 text-emerald-500">{details.completionRate}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${details.completionRate}%` }} />
                    </div>
                </motion.div>
            </div>

            {/* 🚀 EDIT MODAL */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl">
                            <h2 className="text-2xl font-black mb-6 text-slate-900 dark:text-white">Update Agency Details</h2>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Agency Name</label>
                                    <input className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-900 dark:text-white" placeholder="e.g. DPWH" value={editForm.organization_name} onChange={e => setEditForm({ ...editForm, organization_name: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Location / HQ</label>
                                        <input className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-900 dark:text-white" placeholder="e.g. Manila, PH" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Public Email</label>
                                        <input type="email" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-900 dark:text-white" placeholder="contact@agency.gov" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Official Mandate / Bio</label>
                                    <textarea className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium leading-relaxed text-slate-900 dark:text-white" placeholder="Describe the agency's primary responsibilities..." rows={4} value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSaving ? <span className="animate-pulse">Saving...</span> : "Save Details"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}