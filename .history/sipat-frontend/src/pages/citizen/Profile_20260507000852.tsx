import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [details, setDetails] = useState({
    location: "Not Set",
    bio: "No bio added yet. Tell the community a bit about yourself!",
    role: "Citizen",
    joinDate: "Recently"
  });

  const [editForm, setEditForm] = useState({ location: "", bio: "" });
  const [isEditing, setIsEditing] = useState(false);

  const f_uid = user?.uid || user?.firebase_uid;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!f_uid) return;

      try {
        const res = await fetch(`http://localhost:8080/api/users?firebase_uid=${f_uid}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        const dbUser = data[0] || {};

        setDetails({
          location: dbUser.location || "Not Set",
          bio: dbUser.bio || "No bio added yet. Tell the community a bit about yourself!",
          role: dbUser.role || role || "Citizen",
          joinDate: dbUser.created_at ? new Date(dbUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently"
        });

        setEditForm({ location: dbUser.location || "", bio: dbUser.bio || "" });
      } catch (e) {
        console.error("Profile Fetch Error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [f_uid, role]);

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
      } else {
        throw new Error("Failed to save");
      }
    } catch (e) {
      alert("Update failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        {/* Gradient Banner */}
        <div className="h-40 sm:h-52 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 px-5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-bold text-sm transition-colors border border-white/30 shadow-lg"
          >
            Edit Profile
          </button>
        </div>

        {/* Profile Info (Overlapping Banner) */}
        <div className="px-8 pb-10 relative">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-16 sm:-mt-20 mb-6">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white dark:bg-slate-800 p-2 shadow-xl shrink-0">
              <div className="w-full h-full rounded-[1.5rem] bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-5xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {user?.name || "User"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/30">
                  {details.role}
                </span>
                <span className="text-sm font-bold text-slate-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {details.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🚀 Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* About Me */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 dark:bg-slate-800 rounded-xl text-indigo-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">About Me</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {details.bio}
          </p>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 dark:bg-slate-800 rounded-xl text-emerald-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Account</h2>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{user?.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{details.joinDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 🚀 Sleek Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <h2 className="text-2xl font-black mb-6 text-slate-900 dark:text-white uppercase tracking-tight">Edit Profile</h2>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2 mb-2 block">Location</label>
                  <input
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="City, Province"
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2 mb-2 block">Short Bio</label>
                  <textarea
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about yourself..."
                    rows={4}
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}