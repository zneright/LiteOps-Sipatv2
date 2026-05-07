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
  { name: "Infrastructure", icon: "🏗️", gradient: "from-blue-600 to-indigo-800" },
  { name: "Technology", icon: "⚡", gradient: "from-violet-600 to-purple-800" },
  { name: "Environment", icon: "🌿", gradient: "from-emerald-500 to-teal-700" },
  { name: "Healthcare", icon: "🏥", gradient: "from-rose-500 to-orange-700" },
  { name: "Education", icon: "🎓", gradient: "from-cyan-500 to-blue-700" },
  { name: "Transport", icon: "🚌", gradient: "from-orange-500 to-amber-700" },
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
    return { bg: "from-gray-600 to-gray-800", icon: "📁" };
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
    <div className="w-full min-h-screen flex flex-col relative overflow-x-hidden font-sans pb-24 bg-gray-50 dark:bg-[#0A0A0B] selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div animate={{ x: [0, 50, 0], y: [0, -40, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }} className="absolute -top-[10%] -left-[5%] w-[400px] h-[400px] md:w-[700px] md:h-[700px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] md:blur-[160px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <motion.div animate={{ x: [0, -50, 0], y: [0, 40, 0] }} transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }} className="absolute top-[20%] -right-[10%] w-[350px] h-[350px] md:w-[600px] md:h-[600px] bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] md:blur-[160px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <motion.div animate={{ x: [0, 30, 0], y: [0, 60, 0] }} transition={{ repeat: Infinity, duration: 30, ease: "easeInOut" }} className="absolute -bottom-[10%] left-[20%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] md:blur-[160px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col gap-12 md:gap-20 relative z-10">
        <section className="flex flex-col gap-8 items-center text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.4 }}>
            <Link
              to={user?.role === 'admin' ? "/admin/dashboard" : user?.role === 'agency' ? "/agency/dashboard" : "/categories"}
              className="group inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-sm text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 transition-all duration-300"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              {user?.role === 'admin' || user?.role === 'agency' ? "Dashboard" : "Categories"}
            </Link>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, type: "spring", bounce: 0.4 }} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05]">
            <span className="text-gray-900 dark:text-white block md:inline">{selectedCategory ? selectedCategory : "All"} </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 block md:inline drop-shadow-sm">Projects</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }} className="text-gray-500 dark:text-gray-400 text-base md:text-xl max-w-3xl font-medium leading-relaxed px-4">
            Browse government commitments organized by sector to find exactly what matters to your neighborhood and community development.
          </motion.p>
        </section>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full py-24 md:py-32 flex flex-col items-center justify-center gap-8">
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 rounded-full border-t-4 border-indigo-500/30 dark:border-indigo-400/30"></motion.div>
                <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="h-16 w-16 md:h-20 md:w-20 rounded-full border-l-4 border-purple-500 dark:border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></motion.div>
              </div>
              <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Loading Infrastructure...</motion.p>
            </motion.div>
          ) : projects.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full py-24 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl rounded-3xl md:rounded-[3rem] border border-gray-200/50 dark:border-white/[0.05] shadow-2xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] mx-auto px-6 max-w-3xl">
              <div className="w-28 h-28 mb-8 rounded-[2.5rem] bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center text-6xl shadow-inner border border-gray-200/50 dark:border-white/[0.05]">📭</div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">No projects found</h3>
              <p className="text-base md:text-lg font-medium text-gray-500 dark:text-gray-400">There are currently no active projects recorded in this sector.</p>
            </motion.div>
          ) : (
            <motion.div key="grid" layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
              <AnimatePresence>
                {projects.map((project, idx) => {
                  const { percentage, latestPhase } = getProgressData(project.phases);
                  const isFollowed = followedIds.includes(project.id);
                  const orgName = project.organization_name || "DPWH";

                  return (
                    <motion.div key={project.id} layout initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05, duration: 0.5, type: "spring", bounce: 0.3 }} className="group relative bg-white/70 dark:bg-[#111113]/80 backdrop-blur-2xl rounded-[2.5rem] border border-gray-200/60 dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)] transition-all duration-500 flex flex-col transform-gpu hover:-translate-y-2 overflow-hidden">

                      <button onClick={(e) => toggleFollow(project.id, e)} className="absolute top-5 right-5 z-20 bg-white/20 dark:bg-black/20 backdrop-blur-xl p-3 rounded-2xl shadow-lg border border-white/40 dark:border-white/10 hover:scale-110 active:scale-95 transition-all duration-300 group/btn">
                        <svg className={`w-5 h-5 transition-colors duration-300 ${isFollowed ? "text-rose-500 fill-current drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]" : "text-white group-hover/btn:text-rose-300"}`} viewBox="0 0 24 24" stroke="currentColor" fill={isFollowed ? "currentColor" : "none"} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>

                      <Link to={`/project/${project.id}`} className={`w-full aspect-[4/3] bg-gradient-to-br ${project.imageGradient} relative overflow-hidden flex flex-col items-center justify-center block group/image`}>
                        <div className="absolute inset-0 opacity-30 group-hover/image:scale-110 group-hover/image:rotate-1 transition-transform duration-1000 ease-out mix-blend-overlay">
                          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white/50"><polygon points="0,100 100,0 100,100" /><circle cx="15" cy="25" r="35" /><circle cx="85" cy="75" r="45" /></svg>
                        </div>

                        <span className="text-7xl md:text-8xl mb-4 drop-shadow-2xl group-hover/image:scale-110 group-hover/image:-rotate-6 transition-transform duration-500 z-10">{project.categoryIcon}</span>
                        <span className="text-white font-black text-2xl md:text-3xl text-center px-8 mix-blend-overlay line-clamp-2 leading-tight drop-shadow-xl group-hover/image:-translate-y-2 transition-transform duration-500 z-10">{project.title}</span>

                        <div className="absolute top-5 left-5 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold tracking-widest uppercase text-xs shadow-sm border border-white/10 group-hover/image:scale-105 transition-transform duration-300 z-20">{project.category || "General"}</div>

                        <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm z-20">
                          <div className="bg-white dark:bg-gray-900 px-6 py-3.5 rounded-2xl text-gray-900 dark:text-white font-black tracking-widest uppercase text-xs shadow-2xl translate-y-8 group-hover/image:translate-y-0 transition-transform duration-500 ease-out flex items-center gap-2">
                            Explore Details
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </div>
                        </div>
                      </Link>

                      <div className="p-6 md:p-8 flex flex-col flex-grow gap-5 relative z-10 bg-transparent">
                        <div>
                          <Link to={`/project/${project.id}`}>
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white line-clamp-2 leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{project.title}</h3>
                          </Link>
                          <p className="text-xs md:text-sm font-bold text-gray-400 dark:text-gray-500 mt-2.5 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {formatDate(project.created_at)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2.5 mt-2 bg-gray-50/50 dark:bg-white/[0.03] p-4 rounded-2xl border border-gray-100 dark:border-white/[0.05]">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] md:text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Progress: {percentage}%</span>
                            <span className={`text-xs md:text-sm font-black truncate max-w-[60%] text-right tracking-wide ${percentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{percentage === 100 ? "Completed" : latestPhase}</span>
                          </div>
                          <div className="w-full h-2 md:h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${percentage === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}>
                              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </motion.div>
                          </div>
                        </div>

                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 line-clamp-3 flex-grow font-medium leading-relaxed">{project.description}</p>

                        <div className="mt-2">
                          <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="flex items-center gap-4 w-full bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.05] p-3.5 rounded-2xl border border-gray-100 dark:border-white/[0.05] hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 group/agency">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center text-base md:text-lg font-black group-hover/agency:scale-110 group-hover/agency:-rotate-3 group-hover/agency:bg-indigo-600 dark:group-hover/agency:bg-indigo-500 group-hover/agency:text-white transition-all duration-300">
                              {orgName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1.5">Managed By</span>
                              <span className="text-sm md:text-base font-black text-gray-800 dark:text-gray-200 group-hover/agency:text-indigo-600 dark:group-hover/agency:text-indigo-400 transition-colors leading-none tracking-wide">{orgName}</span>
                            </div>
                          </Link>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 pt-6 border-t border-gray-100 dark:border-white/[0.08]">
                          <div className="flex flex-col">
                            <span className="text-[10px] md:text-xs uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">Budget</span>
                            <span className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">₱{project.budget}</span>
                          </div>

                          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/[0.03] p-1.5 rounded-2xl border border-gray-200/60 dark:border-white/[0.05] w-full sm:w-auto justify-between sm:justify-start">
                            <motion.button whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }} onClick={(e) => handleReaction(e, project.id, 'likes')} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-white/10 text-xs font-black text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-sm transition-all">
                              <span className="text-lg">👍</span> <span>{project.likes || 0}</span>
                            </motion.button>
                            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700"></div>
                            <motion.button whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }} onClick={(e) => handleReaction(e, project.id, 'neutrals')} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-white/10 text-xs font-black text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:shadow-sm transition-all">
                              <span className="text-lg">😐</span> <span>{project.neutrals || 0}</span>
                            </motion.button>
                            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700"></div>
                            <motion.button whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }} onClick={(e) => handleReaction(e, project.id, 'unlikes')} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-white/10 text-xs font-black text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:shadow-sm transition-all">
                              <span className="text-lg">👎</span> <span>{project.unlikes || 0}</span>
                            </motion.button>
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