import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export default function AgencyProfile() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [projects, setProjects] = useState<any[]>([]);

    // Real Data State
    const [details, setDetails] = useState({
        organization_name: "Loading...",
        location: "Not Set",
        bio: "No official bio added yet.",
        contact_email: "",
        transparencyScore: 0,
        approvalRating: 0,
        completionRate: 0,
        badge: "🏛️",
        badgeColor: "text-slate-500",
        rankTitle: "Unrated Agency"
    });

    const [editForm, setEditForm] = useState({
        organization_name: "",
        location: "",
        bio: "",
        contact_email: ""
    });

    const [isEditing, setIsEditing] = useState(false);
    const f_uid = user?.uid || user?.firebase_uid;

    const calculateAgencyRank = (score: number) => {
        if (score >= 90) return { title: "Gold Standard Agency", badge: "🏆", color: "text-amber-400" };
        if (score >= 75) return { title: "Trusted Builder", badge: "🏅", color: "text-emerald-500" };
        if (score >= 50) return { title: "Developing Transparency", badge: "📈", color: "text-blue-500" };
        if (score > 0) return { title: "Needs Improvement", badge: "⚠️", color: "text-red-500" };
        return { title: "Unrated Agency", badge: "🏛️", color: "text-slate-500" };
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!f_uid) return;
            try {
                // 1. Fetch Agency Profile from DB
                const uRes = await fetch(`http://localhost:8080/api/users?firebase_uid=${f_uid}`);
                const uData = await uRes.json();
                const dbUser = uData[0] || {};

                // 2. Fetch Projects to calculate scores
                const pRes = await fetch("http://localhost:8080/api/projects");
                const allProjects = await pRes.json();

                // Safety check to prevent array method crashes
                if (!Array.isArray(allProjects)) return;

                setProjects(allProjects);

                // 3. Calculate Transparency Metrics
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

                // Math: Approval Rating
                const totalVotes = totalLikes + totalUnlikes;
                const approvalRating = totalVotes > 0 ? Math.round((totalLikes / totalVotes) * 100) : 100;

                // Math: Completion Rate
                const completionRate = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

                // 🚀 THE FIX: Use allProjects.length instead of totalProjects
                const transparencyScore = allProjects.length > 0 ? Math.round((approvalRating + completionRate) / 2) : 0;

                const rank = calculateAgencyRank(transparencyScore);

                // 🚀 Sets the actual data to your screen
                setDetails({
                    organization_name: dbUser.organization_name || user?.name || "Government Agency",
                    location: dbUser.location || "Location Not Set",
                    bio: dbUser.bio || "No official statement provided.",
                    contact_email: dbUser.email || user?.email || "",
                    transparencyScore,
                    approvalRating,
                    completionRate,
                    badge: rank.badge,
                    badgeColor: rank.color,
                    rankTitle: rank.title
                });

                setEditForm({
                    organization_name: dbUser.organization_name || "",
                    location: dbUser.location || "",
                    bio: dbUser.bio || "",
                    contact_email: dbUser.email || ""
                });

            } catch (e) {
                console.error("Profile Fetch Error:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [f_uid, user]);
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Re-using the update endpoint you already built!
            const res = await fetch(`http://localhost:8080/api/users/${f_uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                setDetails(prev => ({ ...prev, ...editForm }));
                setIsEditing(false);
            }
        } catch (e) {
            alert("Update failed");
        } finally {
            setIsSaving(false);
        }
    };

    const totalProjects = projects.length;

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 py-8 px-4">

            {/* 🚀 AGENCY HEADER */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-5 rounded-full blur-3xl" />

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                    <div className="w-28 h-28 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-950 flex items-center justify-center text-5xl shadow-lg">
                        {details.badge}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {details.organization_name}
                            </h1>
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                                Official Agency Profile
                            </span>
                        </div>

                        <p className={`font-black uppercase tracking-widest text-sm mb-3 ${details.badgeColor}`}>
                            {details.rankTitle}
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1">📍 {details.location}</span>
                            <span className="flex items-center gap-1">✉️ {details.contact_email}</span>
                        </div>

                        <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">
                            {details.bio}
                        </p>
                    </div>

                    <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform whitespace-nowrap">
                        Edit Details
                    </button>
                </div>
            </div>

            {/* 🚀 AGENCY TRANSPARENCY STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Transparency Score</p>
                    <p className={`text-5xl font-black mt-2 ${details.badgeColor}`}>{details.transparencyScore}%</p>
                    <p className="text-xs font-bold text-slate-500 mt-2">Combined Trust Metric</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-3xl mb-2">👍</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen Approval Rating</p>
                    <p className="text-3xl font-black mt-1 text-blue-500">{details.approvalRating}%</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">Positive Community Feedback</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-3xl mb-2">🏗️</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Completion Rate</p>
                    <p className="text-3xl font-black mt-1 text-emerald-500">{details.completionRate}%</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">Across {totalProjects} Projects</p>
                </div>
            </div>

            {/* 🚀 EDIT MODAL */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl">
                            <h2 className="text-2xl font-black mb-6">Update Agency Details</h2>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">Agency / Organization Name</label>
                                    <input className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.organization_name} onChange={e => setEditForm({ ...editForm, organization_name: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">Location / HQ</label>
                                        <input className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">Public Contact Email</label>
                                        <input type="email" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">Official Mandate / Bio</label>
                                    <textarea className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed" rows={4} value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors disabled:opacity-50">Cancel</button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors disabled:opacity-50">{isSaving ? "Saving..." : "Save Details"}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}