import React, { useState, useEffect } from "react";
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

export default function Profile() {
  const { user, role } = useAuth();
  const [myComments, setMyComments] = useState<UserComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [details, setDetails] = useState({
    location: "Not Set",
    bio: "No bio added yet. Tell the community a bit about yourself!",
    role: "Citizen",
    joinDate: "Recently",
    rankData: {
      title: "Newcomer",
      icon: "🌱",
      gradient: "from-emerald-400 to-teal-500",
      textClass: "text-emerald-500",
      bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
      nextGoal: 5,
      prevGoal: 0,
      animationConfig: { y: [0, -3, 0], opacity: [0.8, 1, 0.8] },
      animationTransition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    }
  });

  const userId = user?.uid || user?.id || user?.firebase_uid;

  // 🚀 Dynamic Rank Calculator with Escalating Animations
  const getRankInfo = (count: number) => {
    if (count >= 25) {
      return {
        title: "Master Auditor",
        icon: "👑",
        gradient: "from-amber-400 via-orange-500 to-red-500",
        textClass: "text-amber-500",
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
        nextGoal: 25, // Max level
        prevGoal: 25,
        // Best Animation: Glowing, rotating, floating
        animationConfig: { y: [0, -10, 0], rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] },
        animationTransition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (count >= 10) {
      return {
        title: "Lead Auditor",
        icon: "👁️‍🗨️",
        gradient: "from-purple-500 to-indigo-600",
        textClass: "text-purple-500",
        bgClass: "bg-purple-50 dark:bg-purple-900/20",
        nextGoal: 25,
        prevGoal: 10,
        // Better Animation: Floating and scaling
        animationConfig: { y: [0, -6, 0], scale: [1, 1.05, 1] },
        animationTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (count >= 5) {
      return {
        title: "Active Citizen",
        icon: "🛡️",
        gradient: "from-blue-400 to-cyan-500",
        textClass: "text-blue-500",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        nextGoal: 10,
        prevGoal: 5,
        // Good Animation: Simple float
        animationConfig: { y: [0, -4, 0] },
        animationTransition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    return {
      title: "Newcomer",
      icon: "🌱",
      gradient: "from-emerald-400 to-teal-500",
      textClass: "text-emerald-500",
      bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
      nextGoal: 5,
      prevGoal: 0,
      // Basic Animation: Gentle pulse
      animationConfig: { scale: [0.95, 1.05, 0.95] },
      animationTransition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userId && !user?.name) return;

      try {
        if (userId) {
          const userRes = await fetch(`http://localhost:8080/api/users?firebase_uid=${userId}`);
          const userData = await userRes.json();
          if (userData && userData.length > 0) {
            const dbUser = userData[0];
            setDetails(prev => ({
              ...prev,
              location: dbUser.location || prev.location,
              bio: dbUser.bio || prev.bio,
              role: dbUser.role || role || "Citizen",
              joinDate: dbUser.created_at ? new Date(dbUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently"
            }));
          }
        }

        const projectsRes = await fetch("http://localhost:8080/api/projects");
        const projects = await projectsRes.json();

        const commentsPromises = projects.map((p: any) =>
          fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
        );

        const allCommentsArrays = await Promise.all(commentsPromises);
        const flattened = allCommentsArrays.flat();

        const filtered = flattened.filter((c: any) => c.author_name === user?.name);
        setMyComments(filtered);

        // Apply dynamic rank
        const newRankData = getRankInfo(filtered.length);
        setDetails(prev => ({ ...prev, rankData: newRankData }));

      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, userId, role]);

  const handleSaveProfile = async () => {
    if (!userId) {
      alert("Cannot save: User ID is missing.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: details.location, bio: details.bio })
      });

      if (response.ok) {
        setIsEditing(false);
      } else {
        alert("Failed to save profile. Check the backend console.");
      }
    } catch (error) {
      alert("Network error while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Just now";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="w-full py-20 flex justify-center items-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentCount = myComments.length;
  const isMaxLevel = currentCount >= 25;
  const progressPercent = isMaxLevel ? 100 : ((currentCount - details.rankData.prevGoal) / (details.rankData.nextGoal - details.rankData.prevGoal)) * 100;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20 px-4 pt-6">

      {/* 🚀 Premium Header Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-40 sm:h-52 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <button onClick={() => setIsEditing(true)} className="absolute top-6 right-6 px-5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-bold text-sm transition-colors border border-white/30 shadow-lg">
            Edit Profile
          </button>
        </div>

        <div className="px-8 pb-10 relative">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-16 sm:-mt-20 mb-6">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white dark:bg-slate-800 p-2 shadow-xl shrink-0">
              <div className="w-full h-full rounded-[1.5rem] bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-5xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{user?.name || "Citizen"}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-current ${details.rankData.bgClass} ${details.rankData.textClass}`}>
                  {details.rankData.title}
                </span>
                <span className="text-sm font-bold text-slate-400 flex items-center gap-1">
                  📍 {details.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🚀 Escalating Gamification Rank Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Dynamic Progress / Rank Display */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-1 md:col-span-8 bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          {/* Faint Background Glow based on rank */}
          <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br ${details.rankData.gradient} pointer-events-none`} />

          <motion.div
            animate={details.rankData.animationConfig}
            transition={details.rankData.animationTransition as any}
            className={`w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center rounded-[2rem] shadow-xl ${details.rankData.bgClass} text-5xl sm:text-6xl`}
          >
            {details.rankData.icon}
          </motion.div>

          <div className="flex-1 w-full text-center sm:text-left z-10">
            <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Current Audit Rank</p>
            <h2 className={`text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r ${details.rankData.gradient}`}>
              {details.rankData.title}
            </h2>

            <div className="mt-5 w-full">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-white">{currentCount}</strong> Engagements
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {isMaxLevel ? "Max Level Reached!" : `Goal: ${details.rankData.nextGoal}`}
                </span>
              </div>
              <div className="h-3 sm:h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${details.rankData.gradient} relative`}
                >
                  {/* Subtle shine effect on the progress bar */}
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-1/2 h-full bg-white/30 skew-x-12"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Small Data Cards */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 flex-1">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-500 text-2xl">💬</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Proofs</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{currentCount}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 flex-1">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-500 text-2xl">🗓️</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{details.joinDate.split(' ')[2] || "2026"}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 🚀 Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col: About */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              About Me
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
              "{details.bio}"
            </p>
          </motion.div>
        </div>

        {/* Right Col: Activity Feed */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Recent Activity</h3>

            {myComments.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-500 font-medium mb-2">No feedback history yet.</p>
                <Link to="/explore" className="text-indigo-600 font-bold hover:underline">Start Auditing Projects →</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {myComments.slice().reverse().map((comment, idx) => (
                  <motion.div key={comment.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posted on {formatDateTime(comment.created_at)}</span>
                      {Number(comment.is_ghost_alert) === 1 ? (
                        <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-1 rounded-md">🚨 Ghost Flag</span>
                      ) : (
                        <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-1 rounded-md">AI Score: {comment.ai_match_score}%</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{comment.text_content}"</p>
                    <Link to={`/project/${comment.project_id}`} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors w-fit">
                      View full context →
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* 🚀 Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-black mb-6 text-slate-900 dark:text-white uppercase tracking-tight">Edit Profile</h2>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2 mb-2 block">Location</label>
                  <input type="text" placeholder="City, Province" value={details.location} onChange={(e) => setDetails({ ...details, location: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2 mb-2 block">Short Bio</label>
                  <textarea placeholder="Tell the community about yourself..." value={details.bio} onChange={(e) => setDetails({ ...details, bio: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-900 dark:text-white" rows={3} />
                </div>
                <div className="flex gap-4 mt-4">
                  <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm disabled:opacity-50 transition-colors hover:bg-slate-200">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-transform hover:scale-105">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}