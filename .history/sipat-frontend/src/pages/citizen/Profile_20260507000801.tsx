import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const [myComments, setMyComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [details, setDetails] = useState({
    location: "",
    bio: "",
    trustScore: 0,
    rank: "Newcomer",
    badge: "🌱",
    badgeColor: "text-emerald-400",
    nextGoal: 1
  });

  const [editForm, setEditForm] = useState({ location: "", bio: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Use the exact Firebase UID
  const f_uid = user?.uid || user?.firebase_uid;

  // 🚀 EXPANDED TIER SYSTEM
  const calculateRank = (count: number) => {
    if (count >= 1000) return { rank: "Supreme Oracle", badge: "👑", color: "text-amber-400", next: 1000 };
    if (count >= 500) return { rank: "Vanguard", badge: "👁️‍🗨️", color: "text-purple-500", next: 1000 };
    if (count >= 250) return { rank: "Pillar of Truth", badge: "🏛️", color: "text-blue-500", next: 500 };
    if (count >= 100) return { rank: "Grand Inspector", badge: "🦅", color: "text-red-500", next: 250 };
    if (count >= 50) return { rank: "Master Verifier", badge: "💎", color: "text-cyan-400", next: 100 };
    if (count >= 25) return { rank: "Lead Auditor", badge: "🥇", color: "text-yellow-500", next: 50 };
    if (count >= 10) return { rank: "Active Sentinel", badge: "🥈", color: "text-slate-400", next: 25 };
    if (count >= 5) return { rank: "Civic Watchman", badge: "🥉", color: "text-orange-400", next: 10 };
    if (count >= 1) return { rank: "Observer", badge: "👀", color: "text-emerald-500", next: 5 };
    return { rank: "Newcomer", badge: "🌱", color: "text-green-500", next: 1 };
  };

  useEffect(() => {
    const fetchEverything = async () => {
      if (!f_uid) return;
      try {
        // 1. Fetch User Data
        const uRes = await fetch(`http://localhost:8080/api/users?firebase_uid=${f_uid}`);
        const uData = await uRes.json();
        const dbUser = uData[0] || {};

        // 2. Fetch Engagements/Comments
        const pRes = await fetch("http://localhost:8080/api/projects");
        const projects = await pRes.json();
        const commentsPromises = projects.map((p: any) => fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json()));
        const results = await Promise.all(commentsPromises);
        const filtered = results.flat().filter((c: any) => c.author_name === user?.name);

        setMyComments(filtered);

        // 3. Calculate Trust Score
        const ghostCount = filtered.filter(c => Number(c.is_ghost_alert) === 1).length;
        const avgAiScore = filtered.length > 0
          ? filtered.reduce((acc, curr) => acc + Number(curr.ai_match_score), 0) / filtered.length
          : 100;
        const finalTrust = Math.max(0, Math.min(100, Math.round(avgAiScore - (ghostCount * 15))));

        // 4. Calculate Expanded Rank
        const tier = calculateRank(filtered.length);

        setDetails({
          location: dbUser.location || "Not Set",
          bio: dbUser.bio || "No Bio added yet.",
          trustScore: finalTrust,
          rank: tier.rank,
          badge: tier.badge,
          badgeColor: tier.color,
          nextGoal: tier.next
        });

        setEditForm({ location: dbUser.location || "", bio: dbUser.bio || "" });

      } catch (e) {
        console.error("Fetch Error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEverything();
  }, [f_uid, user?.name]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
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
      alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Progress Bar Math
  const currentCount = myComments.length;
  const progressPercent = currentCount >= 1000 ? 100 : (currentCount / details.nextGoal) * 100;

  return (
    <div className="w-full flex flex-col gap-6 pb-20">
      {/* Dynamic Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 p-10 opacity-5 dark:opacity-10 text-[12rem] pointer-events-none">
          {details.badge}
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-lg">
            {user?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
              <span className={`text-xl ${details.badgeColor}`}>{details.badge}</span>
              <p className={`font-black uppercase tracking-widest text-sm ${details.badgeColor}`}>{details.rank}</p>
            </div>
            <div className="flex gap-4 mt-2 justify-center md:justify-start text-xs font-medium text-slate-500">
              <span>📍 {details.location}</span>
              <span className="opacity-30">|</span>
              <span>💬 {currentCount} Audits Logged</span>
            </div>
          </div>
          <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Edit Profile
          </button>
        </div>
        <p className="mt-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-2xl italic">"{details.bio}"</p>
      </div>

      {/* Gamified Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Trust Score" value={`${details.trustScore}%`} sub="Based on AI Verification" icon="🛡️" color="text-emerald-500" />

        {/* Progress Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 md:col-span-2 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Badge Rank</p>
              <p className={`text-2xl font-black mt-1 ${details.badgeColor}`}>{currentCount} / {details.nextGoal} Audits</p>
            </div>
            <div className="text-4xl animate-pulse">{details.badge}</div>
          </div>
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-current ${details.badgeColor}`}
            />
          </div>
          <p className="text-xs font-bold text-slate-400 mt-3 text-right">
            {currentCount >= 1000 ? "Max Rank Reached!" : `${details.nextGoal - currentCount} more audits to rank up`}
          </p>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl">
              <h2 className="text-2xl font-black mb-6">Update Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">City / Municipality</label>
                  <input className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Obando, Bulacan" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">Your Bio</label>
                  <textarea className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="A short bio about your advocacy..." rows={3} value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 py-4 font-bold text-slate-500 disabled:opacity-50">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 disabled:opacity-50">{isSaving ? "Saving..." : "Save Changes"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable stat card
function StatCard({ label, value, sub, icon, color }: { label: string, value: string, sub: string, icon: string, color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
      <p className="text-xs font-bold text-slate-500 mt-2">{sub}</p>
    </div>
  );
}