import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
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
}

export default function Saved() {
  const { user } = useAuth();
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 Manage Local Storage Keys
  const storageKey = `sipat_saved_${user?.email || 'guest'}`;
  const [savedIds, setSavedIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchSavedProjects = async () => {
      try {
        // 1. Get IDs from storage
        const stored = localStorage.getItem(storageKey);
        const ids: number[] = stored ? JSON.parse(stored) : [];
        setSavedIds(ids);

        if (ids.length === 0) {
          setSavedProjects([]);
          setIsLoading(false);
          return;
        }

        // 2. Fetch all projects
        const response = await fetch("http://localhost:8080/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");
        const allProjects: Project[] = await response.json();

        // 3. Filter only the saved ones
        const filtered = allProjects.filter((p) => ids.includes(p.id));
        setSavedProjects(filtered);
      } catch (error) {
        console.error("Error fetching saved projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedProjects();
  }, [storageKey]);

  // 🚀 Unsave directly from this page
  const removeSave = (id: number) => {
    const newIds = savedIds.filter(pid => pid !== id);
    setSavedIds(newIds);
    localStorage.setItem(storageKey, JSON.stringify(newIds));
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const safeParsePhases = (phasesData: any) => {
    if (!phasesData) return [];
    if (Array.isArray(phasesData)) return phasesData;
    try {
      const parsed = JSON.parse(phasesData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const getProgressData = (phasesData: any) => {
    const phases = safeParsePhases(phasesData);
    if (phases.length === 0) return { percentage: 0, latestPhase: "No timeline set" };

    const completedPhases = phases.filter((p: any) => p.status === "completed" || (p.image_url && p.image_url.trim() !== ""));
    const percentage = Math.round((completedPhases.length / phases.length) * 100);
    const latestPhase = completedPhases.length > 0 ? `Completed: ${completedPhases[completedPhases.length - 1].title}` : "Pending Start";
    return { percentage, latestPhase };
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8 pb-20">
      <section className="flex flex-col gap-3">
        <motion.h1
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          Saved Projects
        </motion.h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
          Quickly access the initiatives and updates you are currently tracking.
        </p>
      </section>

      {isLoading ? (
        <div className="w-full py-20 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      ) : savedProjects.length === 0 ? (
        <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
            🔖
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Your collection is empty
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
            You haven't bookmarked any projects yet. Start saving projects from the Explore page to track their progress.
          </p>
          <Link to="/explore" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {savedProjects.map((project, idx) => {
              const { percentage, latestPhase } = getProgressData(project.phases);

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm flex flex-col relative group"
                >

                  {/* Remove Save Button */}
                  <button
                    onClick={() => removeSave(project.id)}
                    className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2.5 rounded-full shadow-md hover:scale-110 transition-transform"
                    title="Remove from saved"
                  >
                    <svg className="w-5 h-5 text-indigo-600 fill-current" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {project.file_url ? (
                      typeof project.file_url === 'string' && project.file_url.toLowerCase().endsWith('.pdf') ? (
                        <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-400 font-black text-2xl">PDF Document</div>
                      ) : (
                        <img src={project.file_url} alt={project.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-slate-800 uppercase tracking-wider shadow-sm">
                      {project.category}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{project.title}</h3>
                      <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Published: {formatDate(project.created_at)}</p>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress: {percentage}%</span>
                        <span className={`text-[10px] font-bold truncate max-w-[60%] text-right ${percentage === 100 ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{percentage === 100 ? "Fully Completed" : latestPhase}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full rounded-full transition-all duration-1000 ease-out ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'}`} />
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-grow mt-2">{project.description}</p>

                    <Link to={`/project/${project.id}`} className="mt-2 text-center w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold py-2.5 rounded-xl transition-colors">
                      View Full Details
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}