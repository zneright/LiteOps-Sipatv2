import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface Project {
  id: number;
  title: string;
  category: string;
  budget: string;
  description: string;
  created_at: string;
  phases: any;
  likes?: number;
  neutrals?: number;
  unlikes?: number;
  organization_name?: string;
  imageGradient?: string;
  categoryIcon?: string;
  commentsCount?: number;
}

const categoryMetadata = [
  { name: "Infrastructure", icon: "🏗️", gradient: "from-blue-600 to-cyan-500" },
  { name: "Technology", icon: "⚡", gradient: "from-indigo-600 to-violet-500" },
  { name: "Environment", icon: "🌿", gradient: "from-emerald-600 to-teal-500" },
  { name: "Healthcare", icon: "🏥", gradient: "from-rose-600 to-pink-500" },
  { name: "Education", icon: "🎓", gradient: "from-sky-600 to-blue-500" },
  { name: "Transport", icon: "🚌", gradient: "from-amber-600 to-orange-500" },
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
    if (found) return { bg: found.gradient, icon: found.icon };
    return { bg: "from-slate-600 to-slate-400", icon: "📁" };
  };

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const allProjects = await response.json();

      const processedProjectsPromises = allProjects.map(async (p: any) => {
        let commentsCount = 0;
        try {
          const cRes = await fetch(`http://localhost:8080/api/comments/${p.id}`);
          if (cRes.ok) {
            const cData = await cRes.json();
            commentsCount = Array.isArray(cData) ? cData.length : 0;
          }
        } catch (e) { }
        const ui = getExactCategoryUI(p.category);
        return {
          ...p,
          imageGradient: ui.bg,
          categoryIcon: ui.icon,
          commentsCount: commentsCount
        };
      });

      let filteredProjects = await Promise.all(processedProjectsPromises);
      if (selectedCategory) {
        filteredProjects = filteredProjects.filter(
          (p: Project) => p.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
        );
      }
      setProjects(filteredProjects);
    } catch (error) { console.error("Error fetching projects:", error); } finally { setIsLoading(false); }
  }, [selectedCategory]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleReaction = async (e: React.MouseEvent, projectId: number, type: 'likes' | 'neutrals' | 'unlikes') => {
    e.preventDefault(); e.stopPropagation();
    if (!user?.email) return alert("Please log in to react.");
    try {
      await fetch(`http://localhost:8080/api/projects/${projectId}/react`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, user_email: user.email })
      });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, [type]: (p[type] || 0) + 1 } : p));
    } catch (error) { console.error("Failed to react:", error); }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getProgressData = (phasesData: any) => {
    let phases = [];
    try { phases = typeof phasesData === 'string' ? JSON.parse(phasesData) : (phasesData || []); } catch (e) { }
    if (!Array.isArray(phases) || phases.length === 0) return { percentage: 0, latestPhase: "No timeline set" };
    const completedPhases = phases.filter((p: any) => p.status === "completed" || (p.image_url && p.image_url.trim() !== ""));
    const percentage = Math.round((completedPhases.length / phases.length) * 100);
    return { percentage, latestPhase: completedPhases.length > 0 ? `Completed: ${completedPhases[completedPhases.length - 1].title}` : "Pending Start" };
  };

  return (
    <div className="w-full min-h-screen bg-[#FDFDFD] dark:bg-[#070B14] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-full h-[500px] bg-indigo-500/5 dark:bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-full h-[500px] bg-purple-500/5 dark:bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <header className="flex flex-col items-center mb-16 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Link
              to={user?.role === 'admin' ? "/admin/dashboard" : user?.role === 'agency' ? "/agency/dashboard" : "/categories"}
              className="group flex items-center gap-2 px-5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-95 mb-8"
            >
              <svg className="w-4 h-4 text-indigo-500 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                {user?.role === 'admin' || user?.role === 'agency' ? "Dashboard" : "Categories"}
              </span>
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-4"
          >
            <span className="dark:text-white">{selectedCategory || "Global"} </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Initiatives</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-500 dark:text-slate-400 max-w-xl text-base md:text-lg">
            Real-time tracking of public sector projects and infrastructure transparency.
          </motion.p>
        </header>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500">Syncing</p>
            </motion.div>
          ) : projects.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 text-center">
              <span className="text-6xl mb-4 block">📁</span>
              <h3 className="text-xl font-bold dark:text-white">No entries found</h3>
              <p className="text-slate-500 dark:text-slate-400">Try selecting a different category.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {projects.map((project, idx) => {
                const { percentage, latestPhase } = getProgressData(project.phases);
                const isFollowed = followedIds.includes(project.id);
                const orgName = project.organization_name || "DPWH";

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group flex flex-col bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-500"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Link to={`/project/${project.id}`} className={`absolute inset-0 bg-gradient-to-br ${project.imageGradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-700`}>
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                        <span className="text-7xl drop-shadow-2xl transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
                          {project.categoryIcon}
                        </span>
                      </Link>

                      <button
                        onClick={(e) => toggleFollow(project.id, e)}
                        className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10 active:scale-90 transition-all"
                      >
                        <svg className={`w-5 h-5 ${isFollowed ? "text-rose-500 fill-current" : "text-slate-400 dark:text-slate-500"}`} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>

                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 rounded-lg bg-black/20 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                          {project.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 flex flex-col flex-grow">
                      <div className="flex-grow mb-6">
                        <Link to={`/project/${project.id}`}>
                          <h3 className="text-xl md:text-2xl font-black leading-tight mb-2 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            {project.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {formatDate(project.created_at)}
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            <span>Status: {percentage}%</span>
                            <span className={percentage === 100 ? "text-emerald-500" : "text-indigo-500"}>{latestPhase}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={`h-full rounded-full ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="flex items-center justify-between group/agency">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 font-black">
                              {orgName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Department</span>
                              <span className="text-xs font-bold dark:text-slate-200 group-hover/agency:text-indigo-500 transition-colors">{orgName}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Budget</span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₱{project.budget}</span>
                          </div>
                        </Link>

                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          {[
                            { type: 'likes', icon: '👍', color: 'hover:text-emerald-500' },
                            { type: 'neutrals', icon: '😐', color: 'hover:text-slate-400' },
                            { type: 'unlikes', icon: '👎', color: 'hover:text-rose-500' }
                          ].map((reaction, rIdx) => (
                            <React.Fragment key={reaction.type}>
                              <button
                                onClick={(e) => handleReaction(e, project.id, reaction.type as any)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-xs font-black text-slate-500 dark:text-slate-400 transition-all ${reaction.color}`}
                              >
                                {reaction.icon} <span>{project[reaction.type as keyof Project] || 0}</span>
                              </button>
                              {rIdx < 2 && <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}