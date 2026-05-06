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
    rankData: getRankInfo(0) // Initialize with level 0
  });

  const userId = user?.uid || user?.id || user?.firebase_uid;

  // 🚀 EXPANDED RANKING SYSTEM (8 Tiers with escalating animations)
  function getRankInfo(count: number) {
    if (count >= 500) return {
      title: "Supreme Oracle", icon: "👑",
      gradient: "from-amber-300 via-yellow-500 to-orange-600", textClass: "text-amber-500", bgClass: "bg-amber-50 dark:bg-amber-900/20",
      nextGoal: 500, prevGoal: 500,
      animConfig: { y: [0, -15, 0], rotateY: [0, 360], scale: [1, 1.1, 1] }, // Ultimate 3D Spin
      animTrans: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    };
    if (count >= 250) return {
      title: "Grand Inspector", icon: "🦅",
      gradient: "from-rose-400 via-fuchsia-500 to-indigo-500", textClass: "text-rose-500", bgClass: "bg-rose-50 dark:bg-rose-900/20",
      nextGoal: 500, prevGoal: 250,
      animConfig: { y: [0, -12, 0], rotate: [0, 5, -5, 0] },
      animTrans: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
    };
    if (count >= 100) return {
      title: "Master Verifier", icon: "💎",
      gradient: "from-fuchsia-500 to-purple-600", textClass: "text-fuchsia-500", bgClass: "bg-fuchsia-50 dark:bg-fuchsia-900/20",
      nextGoal: 250, prevGoal: 100,
      animConfig: { y: [0, -10, 0], scale: [1, 1.08, 1] }, // Hard pulse & float
      animTrans: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    };
    if (count >= 50) return {
      title: "Lead Verifier", icon: "🥇",
      gradient: "from-indigo-400 to-purple-500", textClass: "text-indigo-500", bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
      nextGoal: 100, prevGoal: 50,
      animConfig: { y: [0, -8, 0], rotate: [0, -3, 3, 0] },
      animTrans: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
    };
    if (count >= 25) return {
      title: "Active Sentinel", icon: "⚔️",
      gradient: "from-blue-400 to-indigo-500", textClass: "text-blue-500", bgClass: "bg-blue-50 dark:bg-blue-900/20",
      nextGoal: 50, prevGoal: 25,
      animConfig: { y: [0, -6, 0] }, // Smooth float
      animTrans: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
    };
    if (count >= 10) return {
      title: "Civic Watchman", icon: "🛡️",
      gradient: "from-cyan-400 to-blue-500", textClass: "text-cyan-500", bgClass: "bg-cyan-50 dark:bg-cyan-900/20",
      nextGoal: 25, prevGoal: 10,
      animConfig: { scale: [1, 1.05, 1] }, // Medium pulse
      animTrans: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    };
    if (count >= 5) return {
      title: "Observer", icon: "👀",
      gradient: "from-teal-400 to-emerald-500", textClass: "text-teal-500", bgClass: "bg-teal-50 dark:bg-teal-900/20",
      nextGoal: 10, prevGoal: 5,
      animConfig: { scale: [0.98, 1.02, 0.98] }, // Gentle pulse
      animTrans: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    };
    return {
      title: "Newcomer", icon: "🌱",
      gradient: "from-emerald-400 to-green-500", textClass: "text-emerald-500", bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
      nextGoal: 5, prevGoal: 0,
      animConfig: { opacity: [0.8, 1, 0.8] }, // Just glowing
      animTrans: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    };
  }

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

        setDetails(prev => ({ ...prev, rankData: getRankInfo(filtered.length) }));

      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, userId, role]);

  const handleSaveProfile = async () => {
    if (!userId) return alert("Cannot save: User ID is missing.");
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: details.location, bio: details.bio })
      });
      if (response.ok) setIsEditing(false);
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

  // 🚀 Animation Variants for Staggered Lists
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex justify-center items-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentCount = myComments.length;
  const isMaxLevel = currentCount >= 500;
  const progressPercent = isMaxLevel ? 100 : ((currentCount - details.rankData.prevGoal) / (details.rankData.nextGoal - details.rankData.prevGoal)) * 100;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8 pb-20 px-4 pt-4 sm:pt-6">

      {/* 🌟 Responsive Premium Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-32 sm:h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <button onClick={() => setIsEditing(true)} className="absolute top-4 sm:top-6 right-4 sm:right-6 px-4 sm:px-5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-bold text-xs sm:text-sm transition-all border border-white/30 shadow-lg hover:scale-105 active:scale-95">
            Edit Profile
          </button>
        </div>

        <div className="px-6 sm:px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-end -mt-16 sm:-mt-20 mb-4 sm:mb-6 items-center sm:items-start text-center sm:text-left">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] bg-white dark:bg-slate-800 p-2 shadow-xl shrink-0 z-10">
              <div className="w-full h-full rounded-[1.5rem] bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-4xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>

            <div className="flex-1 pb-1 sm:pb-2">
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{user?.name || "Citizen"}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest border border-current ${details.rankData.bgClass} ${details.rankData.textClass}`}>
                  {details.rankData.title}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-400 flex items-center gap-1">
                  📍 {details.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🌟 Dynamic Gamification Rank Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6 sm:gap-10 relative overflow-hidden group">
        <div className={`absolute -right-10 -top-10 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-[80px] sm:blur-[100px] opacity-20 bg-gradient-to-br ${details.rankData.gradient} transition-opacity duration-500 group-hover:opacity-40`} />

        <motion.div
          animate={details.rankData.animConfig}
          transition={details.rankData.animTrans as any}
          className={`w-24 h-24 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center rounded-[2rem] shadow-xl ${details.rankData.bgClass} text-5xl sm:text-7xl z-10 border border-white/20`}
        >
          {details.rankData.icon}
        </motion.div>

        <div className="flex-1 w-full text-center md:text-left z-10">
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Current Audit Rank</p>
          <h2 className={`text-3xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r ${details.rankData.gradient}`}>
            {details.rankData.title}
          </h2>

          <div className="mt-4 sm:mt-6 w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white text-lg sm:text-xl">{currentCount}</strong> Engagements
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isMaxLevel ? "Max Level Reached!" : `Next Goal: ${details.rankData.nextGoal}`}
              </span>
            </div>
            <div className="h-3 sm:h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${details.rankData.gradient} relative`}
              >
                <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-1/2 h-full bg-white/30 skew-x-12" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🌟 Two Column Layout for Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* Left Col: Stats & About */}
        <div className="lg:col-span-1 flex flex-col gap-6 sm:gap-8">

          {/* Mobile-Friendly Grid for Small Stats */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="p-3 mb-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-500 text-xl">💬</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Proofs</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{currentCount}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="p-3 mb-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-500 text-xl">🗓️</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</p>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{details.joinDate.split(' ')[2] || "2026"}</p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              About Me
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">"{details.bio}"</p>
          </motion.div>
        </div>

        {/* Right Col: Activity Feed with Stagger Animation */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm h-full">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Recent Field Activity
            </h3>

            {myComments.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-8 sm:p-10 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-500 font-medium mb-2 text-sm sm:text-base">Your audit history is empty.</p>
                <Link to="/explore" className="text-indigo-600 font-bold text-sm sm:text-base hover:text-indigo-700 transition-colors">Start Auditing Projects →</Link>
              </div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-4">
                {myComments.slice().reverse().map((comment) => (
                  <motion.div key={comment.id} variants={itemVariants} className="bg-slate-50 dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-2 sm:gap-3 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Posted on {formatDateTime(comment.created_at)}</span>
                      {Number(comment.is_ghost_alert) === 1 ? (
                        <span className="bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md">🚨 Ghost Flag</span>
                      ) : (
                        <span className="bg-indigo-100 text-indigo-700 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md">AI Score: {comment.ai_match_score}%</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic line-clamp-3">"{comment.text_content}"</p>
                    <Link to={`/project/${comment.project_id}`} className="text-[10px] sm:text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors w-fit mt-1">
                      View full context →
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* 🌟 Mobile-Optimized Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-t-[2rem] sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl h-[85vh] sm:h-auto overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden" />
              <h2 className="text-xl sm:text-2xl font-black mb-6 text-slate-900 dark:text-white uppercase tracking-tight">Edit Profile</h2>
              <div className="flex flex-col gap-4 sm:gap-5">
                <div>
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider ml-2 mb-2 block">Location</label>
                  <input type="text" placeholder="City, Province" value={details.location} onChange={(e) => setDetails({ ...details, location: e.target.value })} className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider ml-2 mb-2 block">Short Bio</label>
                  <textarea placeholder="Tell the community about yourself..." value={details.bio} onChange={(e) => setDetails({ ...details, bio: e.target.value })} className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-900 dark:text-white h-32 sm:h-auto" rows={3} />
                </div>
                <div className="flex gap-3 sm:gap-4 mt-4 pb-10 sm:pb-0">
                  <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 py-3 sm:py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl sm:rounded-2xl font-bold text-sm disabled:opacity-50 transition-colors hover:bg-slate-200">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-transform active:scale-95">
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