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
    rank: "Newcomer",
    role: "Citizen",
    joinDate: "Recently"
  });

  const userId = user?.uid || user?.id || user?.firebase_uid;

  useEffect(() => {
    const fetchData = async () => {
      if (!userId && !user?.name) return;

      try {
        // 1. Fetch User Profile
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

        // 2. Fetch User Activity (USING YOUR WORKING LOGIC!)
        const projectsRes = await fetch("http://localhost:8080/api/projects");
        const projects = await projectsRes.json();

        const commentsPromises = projects.map((p: any) =>
          fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
        );

        const allCommentsArrays = await Promise.all(commentsPromises);
        const flattened = allCommentsArrays.flat();

        // Match by Name!
        const filtered = flattened.filter((c: any) => c.author_name === user?.name);
        setMyComments(filtered);

        // 3. Dynamically Calculate Rank
        let calculatedRank = "Newcomer";
        if (filtered.length >= 25) calculatedRank = "Master Auditor";
        else if (filtered.length >= 10) calculatedRank = "Lead Auditor";
        else if (filtered.length >= 5) calculatedRank = "Active Citizen";

        setDetails(prev => ({ ...prev, rank: calculatedRank }));

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
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/30">
                  {details.role}
                </span>
                <span className="text-sm font-bold text-slate-400 flex items-center gap-1">
                  📍 {details.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🚀 Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "My Contributions", value: myComments.length, icon: "💬" },
          { label: "Current Rank", value: details.rank, icon: "🎖️" },
          { label: "Member Since", value: details.joinDate.split(' ')[2] || "2026", icon: "🗓️" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-4 shadow-sm">
            <div className="text-3xl">{stat.icon}</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white truncate">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🚀 Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col: About & Details */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">About Me</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
              "{details.bio}"
            </p>
          </motion.div>
        </div>

        {/* Right Col: Activity Feed */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
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
                  <input type="text" placeholder="City, Province" value={details.location} onChange={(e) => setDetails({ ...details, location: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2 mb-2 block">Short Bio</label>
                  <textarea placeholder="Tell the community about yourself..." value={details.bio} onChange={(e) => setDetails({ ...details, bio: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" rows={3} />
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