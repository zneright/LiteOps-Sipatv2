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
  { name: "Environment", icon: "🌿", gradient: "from-emerald-400 to-teal-500" },
  { name: "Healthcare", icon: "🏥", gradient: "from-rose-400 to-orange-500" },
  { name: "Education", icon: "🎓", gradient: "from-cyan-400 to-blue-500" },
  { name: "Transport", icon: "🚌", gradient: "from-orange-400 to-amber-500" },
];

export default function Explore() {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<number[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  useEffect(() => {
    if (user?.email) {
      fetch(`${API_URL}/api/users/saved?email=${user.email}`)
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
      await fetch(`${API_URL}/api/users/toggle-save`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, project_id: id })
      });
    } catch (error) { console.error("Failed to save project", error); }
  };

  const getExactCategoryUI = (categoryName: string) => {
    const found = categoryMetadata.find(c => c.name.toLowerCase() === (categoryName || "").toLowerCase().trim());
    if (found) return { bg: found.gradient, icon: found.icon };
    return { bg: "from-slate-500 to-slate-700", icon: "📁" };
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
    e.preventDefault();
    e.stopPropagation();

    if (!user?.email) return alert("Please log in to react to projects.");
    try {
      await fetch(`http://localhost:8080/api/projects/${projectId}/react`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, user_email: user.email })
      });
      // Optimistically update local state for immediate feedback
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return { ...p, [type]: (p[type] || 0) + 1 };
        }
        return p;
      }));
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
    <div className="w-full min-h-screen flex flex-col relative overflow-x-hidden font-sans pb-24 bg-[#F8FAFC] dark:bg-[#0B1120]">
      <div className="fixed inset-0 pointer-events-none -z-20">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <motion.div animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute top-[20%] right-[-10%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-purple-500/10 dark:bg-purple-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex flex-col gap-10 md:gap-14 relative z-10">
        <section className="flex flex-col gap-6 items-center text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.4 }}>
            <Link
              to={user?.role === 'admin' ? "/admin/dashboard" : user?.role === 'agency' ? "/agency/dashboard" : "/categories"}
              className="inline-flex items-center gap-2.5 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-slate-700/50 shadow-sm text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 hover:scale-105 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 w-fit"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              {user?.role === 'admin' || user?.role === 'agency' ? "Dashboard" : "Categories"}
            </Link>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, type: "spring", bounce: 0.4 }} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] drop-shadow-sm px-2">
            <span className="text-slate-900 dark:text-white block md:inline">{selectedCategory ? selectedCategory : "All"} </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 block md:inline">Projects</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }} className="text-slate-500 dark:text-slate-400 text-sm md:text-lg max-w-2xl font-medium leading-relaxed px-4">
            Browse government commits organized by sector to find exactly what matters to your neighborhood.
          </motion.p>
        </section>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} className="w-full py-20 md:py-32 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 rounded-full border-t-4 border-indigo-500 opacity-30"></motion.div>
                <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="h-14 w-14 md:h-16 md:w-16 rounded-full border-l-4 border-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]"></motion.div>
              </div>
              <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Loading Nodes...</motion.p>
            </motion.div>
          ) : projects.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full py-20 md:py-32 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] border border-white/60 dark:border-slate-700/50 shadow-xl mx-auto px-4">
              <div className="w-24 h-24 mb-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-5xl shadow-inner border border-slate-200 dark:border-slate-700">📭</div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">No projects found</h3>
              <p className="text-[14px] md:text-[15px] font-medium text-slate-500 dark:text-slate-400">There are currently no active projects in this sector.</p>
            </motion.div>
          ) : (
            <motion.div key="grid" layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <AnimatePresence>
                {projects.map((project, idx) => {
                  const { percentage, latestPhase } = getProgressData(project.phases);
                  const isFollowed = followedIds.includes(project.id);
                  const orgName = project.organization_name || "DPWH";

                  return (
                    <motion.div key={project.id} layout initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05, duration: 0.4, type: "spring", bounce: 0.3 }} className="group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/40 dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:shadow-2xl dark:hover:shadow-[0_20px_40px_rgba(99,102,241,0.1)] transition-all duration-500 flex flex-col transform-gpu hover:-translate-y-2">

                      <button onClick={(e) => toggleFollow(project.id, e)} className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2.5 md:p-3 rounded-full shadow-lg border border-white/50 dark:border-slate-700/50 hover:scale-110 active:scale-95 transition-all duration-300 group/btn">
                        <svg className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-300 ${isFollowed ? "text-rose-500 fill-current drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-slate-400 dark:text-slate-400 group-hover/btn:text-rose-400"}`} viewBox="0 0 24 24" stroke="currentColor" fill={isFollowed ? "currentColor" : "none"} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>

                      <Link to={`/project/${project.id}`} className={`w-full aspect-[4/3] rounded-t-[2rem] rounded-b-[1rem] bg-gradient-to-br ${project.imageGradient} relative overflow-hidden flex flex-col items-center justify-center shadow-inner block group/image z-10`}>
                        <div className="absolute inset-0 opacity-40 group-hover/image:scale-125 group-hover/image:rotate-2 transition-transform duration-1000 ease-out mix-blend-overlay">
                          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white/50"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /><circle cx="80" cy="80" r="40" /></svg>
                        </div>

                        <span className="text-6xl md:text-7xl mb-3 drop-shadow-2xl group-hover/image:scale-110 group-hover/image:-rotate-6 transition-transform duration-500 z-10">{project.categoryIcon}</span>
                        <span className="text-white font-black text-xl md:text-2xl text-center px-6 mix-blend-overlay line-clamp-2 leading-tight drop-shadow-lg group-hover/image:-translate-y-1 transition-transform duration-500 z-10">{project.title}</span>

                        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white font-black tracking-widest uppercase text-[9px] md:text-[10px] shadow-sm border border-white/20 group-hover/image:scale-105 transition-transform duration-300 z-10">{project.category || "General"}</div>

                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm z-10">
                          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-6 py-3 rounded-2xl text-slate-900 dark:text-white font-black tracking-widest uppercase text-[11px] md:text-xs shadow-2xl translate-y-8 group-hover/image:translate-y-0 transition-transform duration-500 ease-out flex items-center gap-2">
                            Explore Details
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </div>
                        </div>
                      </Link>

                      <div className="p-4 md:p-6 flex flex-col flex-grow gap-3 md:gap-4 relative z-20 bg-transparent">
                        <div>
                          <Link to={`/project/${project.id}`}>
                            <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white line-clamp-2 leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{project.title}</h3>
                          </Link>
                          <p className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {formatDate(project.created_at)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 mt-1 md:mt-2 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Progress: {percentage}%</span>
                            <span className={`text-[10px] md:text-[11px] font-black truncate max-w-[60%] text-right tracking-wide ${percentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{percentage === 100 ? "Completed" : latestPhase}</span>
                          </div>
                          <div className="w-full h-1.5 md:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${percentage === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}>
                              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </motion.div>
                          </div>
                        </div>

                        <p className="text-[13px] md:text-[14px] text-slate-500 dark:text-slate-400 line-clamp-2 flex-grow mt-1 font-medium leading-relaxed">{project.description}</p>

                        <div className="mt-2">
                          <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="flex items-center gap-3 w-full bg-slate-50/80 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 group/agency">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center justify-center text-sm md:text-base font-black group-hover/agency:scale-110 group-hover/agency:rotate-3 group-hover/agency:bg-indigo-600 dark:group-hover/agency:bg-indigo-500 group-hover/agency:text-white transition-all duration-300">
                              {orgName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Managed By</span>
                              <span className="text-[11px] md:text-xs font-black text-slate-700 dark:text-slate-300 group-hover/agency:text-indigo-600 dark:group-hover/agency:text-indigo-400 transition-colors leading-none tracking-wide">{orgName}</span>
                            </div>
                          </Link>
                        </div>

                        <div className="flex flex-col gap-4 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Budget</span>
                              <span className="text-sm md:text-base font-black text-emerald-600 dark:text-emerald-400">₱{project.budget}</span>
                            </div>

                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-[1rem] border border-slate-100 dark:border-slate-700/50 shadow-sm relative z-30">
                              <motion.button whileHover={{ scale: 1.15, rotate: -10 }} whileTap={{ scale: 0.9 }} onClick={(e) => handleReaction(e, project.id, 'likes')} className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-[10px] md:text-[11px] font-black text-emerald-600 dark:text-emerald-400 transition-all shadow-sm relative z-30">👍 <span>{project.likes || 0}</span></motion.button>
                              <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={(e) => handleReaction(e, project.id, 'neutrals')} className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-[10px] md:text-[11px] font-black text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm relative z-30">😐 <span>{project.neutrals || 0}</span></motion.button>
                              <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                              <motion.button whileHover={{ scale: 1.15, rotate: 10 }} whileTap={{ scale: 0.9 }} onClick={(e) => handleReaction(e, project.id, 'unlikes')} className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-[10px] md:text-[11px] font-black text-rose-600 dark:text-rose-400 transition-all shadow-sm relative z-30">👎 <span>{project.unlikes || 0}</span></motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}