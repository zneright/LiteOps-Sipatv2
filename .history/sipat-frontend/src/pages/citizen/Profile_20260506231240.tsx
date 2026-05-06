import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext"; // 🚀 Connect to your real user data
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
  const { user } = useAuth(); // 🚀 Pulling Renz Jericho R. Buday or logged in user
  const [myComments, setMyComments] = useState<UserComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyActivity = async () => {
      try {
        // Fetch all comments (In production, you'd have a specific backend endpoint for user activity)
        const response = await fetch("http://localhost:8080/api/projects");
        const projects = await response.json();

        const commentsPromises = projects.map((p: any) =>
          fetch(`http://localhost:8080/api/comments/${p.id}`).then(res => res.json())
        );

        const allCommentsArrays = await Promise.all(commentsPromises);
        const flattened = allCommentsArrays.flat();

        // 🚀 Filter comments by the current user's name
        const filtered = flattened.filter((c: any) => c.author_name === user?.name);
        setMyComments(filtered);
      } catch (error) {
        console.error("Error loading activity:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.name) fetchMyActivity();
  }, [user]);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Just now";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-20">
      {/* Profile Header */}
      <section className="relative rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-8 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10 dark:opacity-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="w-32 h-32 rounded-[2rem] bg-indigo-600 border-4 border-white dark:border-slate-950 flex items-center justify-center text-4xl font-black text-white shadow-xl">
            {user?.name?.charAt(0) || "C"}
          </div>
          <div className="flex-1 text-center md:text-left pb-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                {user?.name || "Citizen Developer"}
              </h1>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-200 dark:border-emerald-500/30">
                Verified
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              BS Information Technology • Malabon City
            </p>
          </div>
          <button className="mb-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:scale-105 transition-transform">
            Edit Profile
          </button>
        </div>
      </section>

      {/* Contribution Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "My Contributions", value: myComments.length, icon: "✅" },
          { label: "AI Trust Score", value: "98%", icon: "💎" },
          { label: "Rank", value: "Lead Auditor", icon: "🎖️" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-4"
          >
            <div className="text-2xl">{stat.icon}</div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-black text-slate-900 dark:text-white px-2">Your Recent Activity</h3>

        {isLoading ? (
          <div className="p-10 text-center animate-pulse text-slate-400">Loading activity...</div>
        ) : myComments.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            <p className="text-slate-500 font-medium">You haven't posted any feedback yet.</p>
            <Link to="/explore" className="text-indigo-600 font-bold mt-2 inline-block">Explore Projects</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {myComments.map((comment, idx) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    Posted on {formatDateTime(comment.created_at)}
                  </span>
                  {Number(comment.is_ghost_alert) === 1 ? (
                    <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-md">Ghost Flag</span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md">AI Score: {comment.ai_match_score}%</span>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{comment.text_content}"</p>
                <Link to={`/project/${comment.project_id}`} className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors w-fit">
                  View Project →
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}