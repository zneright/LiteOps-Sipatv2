import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [myComments, setMyComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 🚀 REAL DATA STATE
  const [details, setDetails] = useState({
    location: "Not Set",
    bio: "No Bio added yet.",
    trustScore: 0,
    rank: "Newcomer",
    badge: "🌱",
    badgeColor: "text-emerald-500",
    nextGoal: 5,
    prevGoal: 0
  });

  const [editForm, setEditForm] = useState({ location: "", bio: "" });
  const [isEditing, setIsEditing] = useState(false);

  const f_uid = user?.uid || user?.firebase_uid;

  const calculateRank = (count: number) => {
    if (count >= 50) return { rank: "Master Verifier", badge: "💎", color: "text-cyan-400", next: 100, prev: 50 };
    if (count >= 25) return { rank: "Lead Verifier", badge: "🥇", color: "text-yellow-500", next: 50, prev: 25 };
    if (count >= 10) return { rank: "Active Sentinel", badge: "🥈", color: "text-slate-400", next: 25, prev: 10 };
    if (count >= 5) return { rank: "Civic Watchman", badge: "🥉", color: "text-orange-400", next: 10, prev: 5 };
    if (count >= 1) return { rank: "Observer", badge: "👀", color: "text-emerald-500", next: 5, prev: 1 };
    return { rank: "Newcomer", badge: "🌱", color: "text-green-500", next: 1, prev: 0 };
  };

  useEffect(() => {
    const fetchEverything = async () => {
      if (!f_uid) return; // Removed strict user?.email check here just in case

      try {
        // 1. Fetch User Profile from DB
        const uRes = await fetch(`http://localhost:8080/api/users?firebase_uid=${f_uid}`);
        const uData = await uRes.json();
        const dbUser = uData[0] || {};

        // 2. Fetch All Projects then All Comments
        const pRes = await fetch("http://localhost:8080/api/projects");
        const projects = await pRes.json();

        // Safe check in case projects is empty or errors out
        if (!Array.isArray(projects)) return;

        const commentsPromises = projects.map((p: any) =>
          fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
        );
        const results = await Promise.all(commentsPromises);

        // 🚀 THE TRAP: Let's see exactly what the data looks like
        const allComments = results.flat();
        const realEmail = user?.email || dbUser.email; // Fallback to DB email

        console.log("🕵️‍♂️ 1. Target Email:", realEmail);
        console.log("🕵️‍♂️ 2. All Comments in DB:", allComments);

        // 3. Filter comments
        const filtered = allComments.filter((c: any) => c.user_email === realEmail);

        console.log("🕵️‍♂️ 3. Your Filtered Comments:", filtered);
        setMyComments(filtered);

        // 4. Calculate Stats
        const totalEngagements = filtered.length;
        const avgAiScore = totalEngagements > 0
          ? filtered.reduce((acc, curr) => acc + Number(curr.ai_match_score || 0), 0) / totalEngagements
          : 0;

        const tier = calculateRank(totalEngagements);

        setDetails({
          location: dbUser.location || "Not Set",
          bio: dbUser.bio || "No Bio added yet.",
          trustScore: Math.round(avgAiScore),
          rank: tier.rank,
          badge: tier.badge,
          badgeColor: tier.color,
          nextGoal: tier.next,
          prevGoal: tier.prev
        });

        setEditForm({ location: dbUser.location || "", bio: dbUser.bio || "" });

      } catch (e) {
        console.error("Profile Fetch Error:", e);
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
      alert("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const currentCount = myComments.length;
  const progressPercent = ((currentCount - details.prevGoal) / (details.nextGoal - details.prevGoal)) * 100;

  return (
    <div className="w-full flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-3xl font-black text-white">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase">{user?.name}</h1>
            <p className={`font-black uppercase tracking-widest text-sm ${details.badgeColor}`}>{details.badge} {details.rank}</p>
            <div className="flex gap-4 mt-2 justify-center md:justify-start text-xs font-medium text-slate-500">
              <span>📍 {details.location}</span>
              <span>💬 {currentCount} Engagements</span>
            </div>
          </div>
          <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm">
            Edit Profile
          </button>
        </div>
        <p className="mt-6 text-slate-600 dark:text-slate-400 text-sm italic">"{details.bio}"</p>
      </div>

      {/* Trust & Rank Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Rank Progress</p>
          <div className="flex justify-between items-end mb-2">
            <p className={`text-2xl font-black ${details.badgeColor}`}>{currentCount} / {details.nextGoal}</p>
            <p className="text-xs font-bold text-slate-400">Target: {details.rank}</p>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className={`h-full ${details.badgeColor} bg-current`} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Trust Score</p>
            <p className={`text-4xl font-black mt-1 ${details.trustScore >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{details.trustScore}%</p>
          </div>
          <div className="text-4xl">🛡️</div>
        </div>
      </div>

      {/* Engagement List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase">My Activity</h3>
        <div className="space-y-4">
          {myComments.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No real engagements found in the database.</p>
          ) : (
            myComments.map((comment, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <p className="text-sm text-slate-700 dark:text-slate-300">"{comment.text_content}"</p>
                <span className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold text-indigo-500">AI: {comment.ai_match_score}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl">
              <h2 className="text-2xl font-black mb-6">Update Profile</h2>
              <input className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 mb-4" placeholder="City" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
              <textarea className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800" placeholder="Bio" rows={3} value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
              <div className="flex gap-4 mt-8">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-4 font-bold text-slate-500">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">{isSaving ? "Saving..." : "Save"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}