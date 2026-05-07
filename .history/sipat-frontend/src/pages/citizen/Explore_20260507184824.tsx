import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface Project {
  id: number; title: string; category: string; budget: string; description: string; created_at: string; phases: any; likes?: number; neutrals?: number; unlikes?: number; organization_name?: string; imageGradient?: string; categoryIcon?: string; commentsCount?: number;
}

const categoryMetadata = [
  { name: "Infrastructure", icon: "🏗️", gradient: "from-blue-500 to-indigo-600" },
  { name: "Technology", icon: "⚡", gradient: "from-violet-500 to-purple-600" },
  { name: "Environment", icon: "🌿", gradient: "from-emerald-500 to-teal-600" },
  { name: "Healthcare", icon: "🏥", gradient: "from-rose-500 to-orange-500" },
  { name: "Education", icon: "🎓", gradient: "from-cyan-500 to-blue-500" },
  { name: "Transport", icon: "🚌", gradient: "from-orange-500 to-amber-500" },
];

export default function Explore() {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<number[]>([]);

  useEffect(() => {
    if (user?.email) {
      fetch(`http://localhost:8080/api/users/saved?email=${user.email}`)
        .then(res => res.json())
        .then(data => { if (data.saved_projects) setFollowedIds(data.saved_projects); })
        .catch(console.error);
    }
  }, [user]);

  const toggleFollow = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user?.email) return alert("Please log in to follow projects.");
    setFollowedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    try {
      await fetch("http://localhost:8080/api/users/toggle-save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, project_id: id })
      });
    } catch (error) { console.error("Failed to save project", error); }
  };

  const getExactCategoryUI = (categoryName: string) => {
    const found = categoryMetadata.find(c => c.name.toLowerCase() === (categoryName || "").toLowerCase().trim());
    return found ? { bg: found.gradient, icon: found.icon } : { bg: "from-slate-500 to-slate-700", icon: "📁" };
  };

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/api/projects");
      const allProjects = await response.json();
      const processed = await Promise.all(allProjects.map(async (p: any) => {
        const ui = getExactCategoryUI(p.category);
        return { ...p, imageGradient: ui.bg, categoryIcon: ui.icon };
      }));
      let filtered = processed;
      if (selectedCategory) {
        filtered = filtered.filter(p => p.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
      }
      setProjects(filtered);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  }, [selectedCategory]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleReaction = async (projectId: number, type: 'likes' | 'neutrals' | 'unlikes') => {
    if (!user?.email) return alert("Please log in to react.");
    try {
      await fetch(`http://localhost:8080/api/projects/${projectId}/react`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, user_email: user.email })
      });
      fetchProjects();
    } catch (error) { console.error(error); }
  };

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "TBD";
  };

  const getProgressData = (phasesData: any) => {
    let phases = [];
    try { phases = typeof phasesData === 'string' ? JSON.parse(phasesData) : (phasesData || []); } catch (e) { }
    if (!Array.isArray(phases) || phases.length === 0) return { percentage: 0, latestPhase: "No timeline set" };
    const completed = phases.filter((p: any) => p.status === "completed" || (p.image_url && p.image_url.trim() !== ""));
    return {
      percentage: Math.round((completed.length / phases.length) * 100),
      latestPhase: completed.length > 0 ? `Completed: ${completed[completed.length - 1].title}` : "Pending Start"
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-8">

        {/* Header Section */}
        <header className="flex flex-col gap-4">
          <Link
            to={user?.role === 'admin' ? "/admin/dashboard" : user?.role === 'agency' ? "/agency/dashboard" : "/categories"}
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-fit"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {user?.role === 'admin' || user?.role === 'agency' ? "Back to Dashboard" : "Back to Categories"}
          </Link>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            {selectedCategory ? `${selectedCategory} Projects` : "Explore Projects"}
          </motion.h1>
        </header>

        {/* Content Section */}
        {isLoading ? (
          <div className="w-full py-32 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 h-12 w-12 border-4 border-transparent border-b-indigo-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-slate-500 font-bold animate-pulse text-sm">Fetching latest updates...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-16 text-center border-2 border-slate-200 dark:border-slate-800 border-dashed">
            <span className="text-6xl mb-6 block">🔭</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200">No projects found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Try checking a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence>
              {projects.map((project, idx) => {
                const { percentage, latestPhase } = getProgressData(project.phases);
                const isFollowed = followedIds.includes(project.id);
                const orgName = project.organization_name || "Government Agency";

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden"
                  >
                    {/* Follow Button */}
                    <button
                      onClick={(e) => toggleFollow(project.id, e)}
                      className="absolute top-4 right-4 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all border border-white/20"
                    >
                      <svg className={`w-5 h-5 transition-colors ${isFollowed ? "text-rose-500 fill-current" : "text-slate-400"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    {/* Card Header (Image/Gradient) */}
                    <Link to={`/project/${project.id}`} className="relative h-56 w-full overflow-hidden group-hover:brightness-110 transition-all">
                      <div className={`absolute inset-0 bg-gradient-to-br ${project.imageGradient} opacity-90 dark:opacity-80`} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                        <span className="text-6xl mb-2 drop-shadow-2xl group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-500">{project.categoryIcon}</span>
                        <div className="absolute top-4 left-4 bg-white/20 dark:bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black tracking-widest uppercase border border-white/30">
                          {project.category}
                        </div>
                      </div>
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <span className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-tighter">View Details</span>
                      </div>
                    </Link>

                    {/* Card Body */}
                    <div className="p-6 flex flex-col gap-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {project.title}
                        </h3>
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {formatDate(project.created_at)}
                        </p>
                      </div>

                      {/* Progress Section */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Progress</span>
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={`h-full rounded-full ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 truncate">{latestPhase}</p>
                      </div>

                      {/* Agency Info */}
                      <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group/agency">
                        <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
                          {orgName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Managed By</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover/agency:text-indigo-600 transition-colors">{orgName}</span>
                        </div>
                      </Link>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Budget</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₱{project.budget}</span>
                        </div>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                          {[
                            { icon: "👍", key: 'likes' as const },
                            { icon: "😐", key: 'neutrals' as const },
                            { icon: "👎", key: 'unlikes' as const }
                          ].map((react) => (
                            <motion.button
                              key={react.key}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleReaction(project.id, react.key)}
                              className="px-2.5 py-1 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all flex items-center gap-1 text-slate-600 dark:text-slate-300"
                            >
                              <span>{react.icon}</span>
                              <span>{project[react.key] || 0}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}