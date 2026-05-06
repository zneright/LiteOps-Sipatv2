import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [myComments, setMyComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [details, setDetails] = useState({
    location: "",
    bio: "",
    trustScore: 0,
    ghostCount: 0,
    rank: "Newcomer",
    badge: "🌱",
    badgeColor: "text-emerald-400",
    nextGoal: 1,
    prevGoal: 0
  });

  const [editForm, setEditForm] = useState({ location: "", bio: "" });
  const [isEditing, setIsEditing] = useState(false);

  const f_uid = user?.uid || user?.firebase_uid;

  const calculateRank = (count: number) => {
    if (count >= 1000) return { rank: "Supreme Oracle", badge: "👑", color: "text-amber-400", next: 1000, prev: 1000 };
    if (count >= 500) return { rank: "Vanguard", badge: "👁️‍🗨️", color: "text-purple-500", next: 1000, prev: 500 };
    if (count >= 250) return { rank: "Pillar of Truth", badge: "🏛️", color: "text-blue-500", next: 500, prev: 250 };
    if (count >= 100) return { rank: "Grand Inspector", badge: "🦅", color: "text-red-500", next: 250, prev: 100 };
    if (count >= 50) return { rank: "Master Verifier", badge: "💎", color: "text-cyan-400", next: 100, prev: 50 };
    if (count >= 25) return { rank: "Lead Verifier", badge: "🥇", color: "text-yellow-500", next: 50, prev: 25 };
    if (count >= 10) return { rank: "Active Sentinel", badge: "🥈", color: "text-slate-400", next: 25, prev: 10 };
    if (count >= 5) return { rank: "Civic Watchman", badge: "🥉", color: "text-orange-400", next: 10, prev: 5 };
    if (count >= 1) return { rank: "Observer", badge: "👀", color: "text-emerald-500", next: 5, prev: 1 };
    return { rank: "Newcomer", badge: "🌱", color: "text-green-500", next: 1, prev: 0 };
  };

  const getBadgeAnimation = (count: number) => {
    if (count >= 250) return { animate: { rotateY: [0, 360], scale: [1, 1.2, 1] }, transition: { duration: 2, repeat: Infinity, ease: "linear" } };
    if (count >= 50) return { animate: { y: [0, -15, 0], rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }, transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } };
    if (count >= 10) return { animate: { y: [0, -15, 0] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } };
    if (count >= 1) return { animate: { y: [0, -5, 0] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } };
    return { animate: { opacity: [0.7, 1, 0.7] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } };
  };

  useEffect(() => {
    const fetchEverything = async () => {
      if (!f_uid) return;
      try {
        const uRes = await fetch(`http://localhost:8080/api/users?firebase_uid=${f_uid}`);
        const uData = await uRes.json();
        const dbUser = uData[0] || {};

        const pRes = await fetch("http://localhost:8080/api/projects");
        const projects = await pRes.json();
        const commentsPromises = projects.map((p: any) => fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json()));
        const results = await Promise.all(commentsPromises);

        const filtered = results.flat().filter((c: any) => c.user_email === user?.email);
        setMyComments(filtered);

        // 🚀 Improved Trust Logic
        const ghostCount = filtered.filter(c => Number(c.is_ghost_alert) === 1).length;
        const avgAiScore = filtered.length > 0
          ? filtered.reduce((acc, curr) => acc + Number(curr.ai_match_score), 0) / filtered.length
          : 100;

        // Starts at 100, drops heavily for ghost alerts, slightly for low AI match scores
        const finalTrust = Math.max(0, Math.min(100, Math.round(avgAiScore - (ghostCount * 15))));

        const tier = calculateRank(filtered.length);

        setDetails({
          location: dbUser.location || "Not Set",
          bio: dbUser.bio || "No Bio added yet.",
          trustScore: finalTrust,
          ghostCount: ghostCount,
          rank: tier.rank,
          badge: tier.badge,
          badgeColor: tier.color,
          nextGoal: tier.next,
          prevGoal: tier.prev
        });

        setEditForm({ location: dbUser.location || "", bio: dbUser.bio || "" });

      } catch (e) {
        console.error("Fetch Error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEverything();
  }, [f_uid, user?.email]);

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

  const currentCount = myComments.length;
  const progressPercent = currentCount >= 1000 ? 100 : ((currentCount - details.prevGoal) / (details.nextGoal - details.prevGoal)) * 100;
  const badgeAnim = getBadgeAnimation(currentCount);

  return (
    <div className="w-full flex flex-col gap-8 pb-20">

      {/* Dynamic Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <motion.div className="absolute -top-10 -right-10 p-10 opacity-5 dark:opacity-10 text-[12rem] pointer-events-none" animate={badgeAnim.animate} transition={badgeAnim.transition}>
          {details.badge}
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-lg">
            {user?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
              <motion.span className={`text-xl inline-block origin-center ${details.badgeColor}`} animate={badgeAnim.animate} transition={badgeAnim.transition}>
                {details.badge}
              </motion.span>
              <p className={`font-black uppercase tracking-widest text-sm ${details.badgeColor}`}>{details.rank}</p>
            </div>
            <div className="flex gap-4 mt-2 justify-center md:justify-start text-xs font-medium text-slate-500">
              <span>📍 {details.location}</span>
              <span className="opacity-30">|</span>
              <span>💬 {currentCount} Civic Engagements</span>
            </div>
          </div>
          <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Edit Profile
          </button>
        </div>
        <p className="mt-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-2xl italic">"{details.bio}"</p>
      </div>

      {/* Gamified Stats & Trust Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Progress Card (Spans 8 columns) */}
        <div className="col-span-1 md:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center overflow-hidden relative">
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Badge Rank</p>
              <p className={`text-2xl font-black mt-1 ${details.badgeColor}`}>{currentCount} / {details.nextGoal} Engagements</p>
            </div>
            <motion.div className="text-4xl origin-center" animate={badgeAnim.animate} transition={badgeAnim.transition}>
              {details.badge}
            </motion.div>
          </div>
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative z-10">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className={`h-full bg-current ${details.badgeColor} relative`}>
              {currentCount >= 25 && (
                <motion.div className="absolute top-0 left-0 w-full h-full bg-white/30" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
              )}
            </motion.div>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-3 text-right relative z-10">
            {currentCount >= 1000 ? "Max Rank Reached!" : `${details.nextGoal - currentCount} more verifications to rank up`}
          </p>
        </div>

        {/* Deep Dive AI Trust Card (Spans 4 columns) */}
        <div className="col-span-1 md:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div className="text-4xl mb-4">🛡️</div>
              <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-md ${details.trustScore >= 80 ? 'bg-emerald-100 text-emerald-700' : details.trustScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {details.trustScore >= 80 ? 'Excellent' : details.trustScore >= 50 ? 'Warning' : 'Critical'}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global AI Trust Score</p>
            <p className={`text-3xl font-black mt-1 ${details.trustScore >= 80 ? 'text-emerald-500' : details.trustScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{details.trustScore}%</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 mb-2">How to improve:</p>
            <ul className="text-[10px] text-slate-400 space-y-1">
              <li>✅ Post accurate, highly-relevant evidence.</li>
              <li>{details.ghostCount > 0 ? `⚠️ You have ${details.ghostCount} Ghost Alerts. Avoid spam.` : `✅ Zero Ghost Alerts on record.`}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY FEED */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Recent Field Engagements</h3>
        {isLoading ? (
          <p className="text-sm text-slate-400 text-center py-4">Loading your impact...</p>
        ) : myComments.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-sm font-bold text-slate-500 mb-2">No active audits yet.</p>
            <p className="text-xs text-slate-400 mb-4">Start verifying projects to build your Trust Score.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myComments.slice(0, 5).map((comment, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{comment.target_phase || "Overall Review"}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{comment.text_content}"</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold text-indigo-500 border border-slate-200 dark:border-slate-700 shadow-sm">AI Match: {comment.ai_match_score}%</span>
                  {Number(comment.is_ghost_alert) === 1 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold shadow-sm">Ghost Flag</span>
                  )}
                </div>
              </div>
            ))}
            {myComments.length > 5 && (
              <p className="text-center text-xs font-bold text-slate-400 pt-4">+ {myComments.length - 5} older engagements</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
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