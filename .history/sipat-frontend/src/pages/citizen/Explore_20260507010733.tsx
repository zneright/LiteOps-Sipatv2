import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface Project {
  id: number;
  title: string;
  category: string;
  budget: string;
  description: string;
  created_at: string;
  file_url: string;
  phases: any;
  likes?: number;
  neutrals?: number;
  unlikes?: number;
  organization_name?: string;
}

export default function Explore() {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const storageKey = `sipat_saved_${user?.email || 'guest'}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setSavedIds(JSON.parse(stored));
  }, [storageKey]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");

      const allProjects = await response.json();

      let filteredProjects = allProjects;
      if (selectedCategory) {
        filteredProjects = allProjects.filter(
          (p: Project) => p.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
        );
      }
      setProjects(filteredProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleReaction = async (projectId: number, type: 'likes' | 'neutrals' | 'unlikes') => {
    if (!user?.email) return alert("Please log in to react to projects.");
    try {
      await fetch(`http://localhost:8080/api/projects/${projectId}/react`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, user_email: user.email })
      });
      fetchProjects();
    } catch (error) {
      console.error("Failed to react to project:", error);
    }
  };

  const toggleSave = (id: number) => {
    setSavedIds(prev => {
      const isSaved = prev.includes(id);
      const newIds = isSaved ? prev.filter(pid => pid !== id) : [...prev, id];
      localStorage.setItem(storageKey, JSON.stringify(newIds));
      return newIds;
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getProgressData = (phasesData: any) => {
    let phases = [];
    try { phases = typeof phasesData === 'string' ? JSON.parse(phasesData) : (phasesData || []); } catch (e) { }
    if (!Array.isArray(phases) || phases.length === 0) return { percentage: 0, latestPhase: "No timeline set" };

    const completedPhases = phases.filter((p: any) => p.status === "completed" || (p.image_url && p.image_url.trim() !== ""));
    const percentage = Math.round((completedPhases.length / phases.length) * 100);
    const latestPhase = completedPhases.length > 0 ? `Completed: ${completedPhases[completedPhases.length - 1].title}` : "Pending Start";

    return { percentage, latestPhase };
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link to="/categories" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Categories
        </Link>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
          {selectedCategory ? `${selectedCategory} Projects` : "All Projects"}
        </motion.h1>
        <p className="text-slate-500 font-medium">Showing the most recent updates and commits.</p>
      </div>

      {isLoading ? (
        <div className="w-full py-20 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 border-dashed">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No projects found</h3>
          <p className="text-slate-500 text-sm">There are no documented projects in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, idx) => {
            const { percentage, latestPhase } = getProgressData(project.phases);
            const isSaved = savedIds.includes(project.id);
            const orgName = project.organization_name || "DPWH";

            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative hover:-translate-y-1">

                <button onClick={() => toggleSave(project.id)} className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
                  <svg className={`w-5 h-5 transition-colors ${isSaved ? "text-indigo-600 fill-current" : "text-slate-500"}`} viewBox="0 0 24 24" stroke="currentColor" fill={isSaved ? "currentColor" : "none"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>

                <div className="h-44 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  {project.file_url ? (
                    typeof project.file_url === 'string' && project.file_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-400 font-black text-2xl">PDF Document</div>
                    ) : (
                      <img src={project.file_url} alt={project.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">🏗️</div>
                  )}

                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-slate-800 uppercase tracking-wider shadow-sm">
                    {project.category || "General"}
                  </div>

                  {/* 🚀 PREMIUM OVERLAPPING AGENCY BADGE */}
                  <div className="absolute bottom-3 left-4">
                    <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-indigo-700 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors shadow-lg border border-slate-100 dark:border-slate-800">
                      <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                      {orgName}
                    </Link>
                  </div>

                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                <div className="p-6 flex flex-col flex-grow gap-4 relative z-10 bg-white dark:bg-slate-900">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {formatDate(project.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress: {percentage}%</span>
                      <span className={`text-[10px] font-bold truncate max-w-[60%] text-right ${percentage === 100 ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{percentage === 100 ? "Completed" : latestPhase}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full rounded-full transition-all duration-1000 ease-out ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'}`} />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-grow mt-1">{project.description}</p>

                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-slate-400">Budget</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₱{project.budget}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.8 }} onClick={() => handleReaction(project.id, 'likes')} className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">
                        👍 <span>{project.likes || 0}</span>
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.8 }} onClick={() => handleReaction(project.id, 'neutrals')} className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        😐 <span>{project.neutrals || 0}</span>
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.8 }} onClick={() => handleReaction(project.id, 'unlikes')} className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors">
                        👎 <span>{project.unlikes || 0}</span>
                      </motion.button>
                    </div>
                  </div>

                  <Link to={`/project/${project.id}`} className="mt-2 text-center w-full bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-colors">
                    View Project
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}