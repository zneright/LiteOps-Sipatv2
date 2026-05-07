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
  phases: any;
  likes?: number;
  neutrals?: number;
  unlikes?: number;
  organization_name?: string;
  imageGradient?: string;
  categoryIcon?: string;
}

// 🚀 EXACT MATCH METADATA (Synced with Explore & Categories)
const categoryMetadata = [
  { name: "Infrastructure", icon: "🏗️", gradient: "from-blue-500 to-indigo-600" },
  { name: "Technology", icon: "⚡", gradient: "from-violet-500 to-purple-600" },
  { name: "Environment", icon: "🌿", gradient: "from-emerald-500 to-teal-600" },
  { name: "Healthcare", icon: "🏥", gradient: "from-rose-500 to-orange-500" },
  { name: "Education", icon: "🎓", gradient: "from-cyan-500 to-blue-500" },
  { name: "Transport", icon: "🚌", gradient: "from-orange-500 to-amber-500" },
];

export default function Saved() {
  const { user } = useAuth();
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 Manage Local Storage Keys
  const storageKey = `sipat_saved_${user?.email || 'guest'}`;
  const [savedIds, setSavedIds] = useState<number[]>([]);

  // 🚀 STRICT LOOKUP: Matches the exact visual identity!
  const getExactCategoryUI = (categoryName: string) => {
    const found = categoryMetadata.find(c => c.name.toLowerCase() === (categoryName || "").toLowerCase().trim());
    if (found) return { bg: found.gradient, icon: found.icon };
    return { bg: "from-slate-500 to-slate-700", icon: "📁" }; // Fallback
  };

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
        const allProjects: any[] = await response.json();

        // 3. Filter ONLY saved ones, then map visual UI to them
        const filteredAndProcessed = allProjects
          .filter((p) => ids.includes(p.id))
          .map((p) => {
            const ui = getExactCategoryUI(p.category);
            return {
              ...p,
              imageGradient: ui.bg,
              categoryIcon: ui.icon
            };
          });

        setSavedProjects(filteredAndProcessed);
      } catch (error) {
        console.error("Error fetching saved projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedProjects();
  }, [storageKey]);

  // 🚀 Unsave directly from this page (Hits DB and LocalStorage)
  const removeSave = async (id: number) => {
    // Optimistic UI Update for instant animation
    const newIds = savedIds.filter(pid => pid !== id);
    setSavedIds(newIds);
    localStorage.setItem(storageKey, JSON.stringify(newIds));
    setSavedProjects(prev => prev.filter(p => p.id !== id));

    // Sync with DB
    if (user?.email) {
      try {
        await fetch("http://localhost:8080/api/users/toggle-save", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, project_id: id })
        });
      } catch (error) {
        console.error("Failed to sync unsave to DB", error);
      }
    }
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
    const latestPhase = completedPhases.length > 0 ? `Completed: ${completedPhases[completedPhases.length - 1].title}` : "Pending Start";
    return { percentage, latestPhase };
  };

  // 🚀 Animation Variants
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8 pb-20">

      {/* HEADER */}
      <section className="flex flex-col gap-3">
        <motion.h1
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="text-4xl sm:text-5xl font-black tracking-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">Saved </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Projects</span>
        </motion.h1>
        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg font-medium max-w-2xl">
          Quickly access the public infrastructure updates and government initiatives you are actively tracking.
        </p>
      </section>

      {isLoading ? (
        <div className="w-full py-32 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Bookmarks...</p>
        </div>
      ) : savedProjects.length === 0 ? (

        /* EMPTY STATE */
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-5xl mb-6 shadow-sm">
            🔖
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Your collection is empty
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">
            You haven't bookmarked any projects yet. Start exploring active public works and save them here for quick access.
          </p>
          <Link to="/explore" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
            Browse Live Projects
          </Link>
        </motion.div>

      ) : (

        /* GRID LAYOUT */
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence>
            {savedProjects.map((project) => {
              const { percentage, latestPhase } = getProgressData(project.phases);
              const orgName = project.organization_name || "DPWH";

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative"
                >

                  {/* REMOVE BOOKMARK BUTTON */}
                  <button
                    onClick={() => removeSave(project.id)}
                    className="absolute top-4 right-4 z-10 bg-rose-100/90 dark:bg-rose-900/90 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all border border-rose-200 dark:border-rose-700"
                    title="Remove from saved"
                  >
                    <svg className="w-5 h-5 text-rose-600 dark:text-rose-400 fill-current" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  {/* 🚀 DYNAMIC UI HEADER */}
                  <Link to={`/project/${project.id}`} className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${project.imageGradient} relative overflow-hidden flex flex-col items-center justify-center shadow-inner block`}>
                    <div className="absolute inset-0 opacity-30 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-overlay">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /></svg>
                    </div>

                    <span className="text-6xl mb-3 drop-shadow-xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">{project.categoryIcon}</span>
                    <span className="text-white/95 font-black text-xl text-center px-6 mix-blend-overlay line-clamp-2 leading-tight drop-shadow-md group-hover:-translate-y-1 transition-transform duration-500">{project.title}</span>

                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-slate-900 font-black tracking-wider uppercase text-[9px] shadow-sm">{project.category || "General"}</div>

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <div className="bg-white px-5 py-2.5 rounded-xl text-slate-900 font-black tracking-widest uppercase text-xs shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Open Project</div>
                    </div>
                  </Link>

                  {/* CARD BODY */}
                  <div className="p-6 flex flex-col flex-grow gap-3 relative z-10 bg-white dark:bg-slate-900">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Saved: {formatDate(project.created_at)}
                      </p>
                    </div>

                    {/* Progress Bar */}
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

                    {/* Agency Link */}
                    <div className="mt-2">
                      <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="flex items-center gap-3 w-full bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all group/agency">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-xs font-black group-hover/agency:scale-110 group-hover/agency:bg-indigo-600 group-hover/agency:text-white transition-all">
                          {orgName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Managed By</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover/agency:text-indigo-700 dark:group-hover/agency:text-indigo-400 transition-colors leading-none">{orgName}</span>
                        </div>
                      </Link>
                    </div>

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between mt-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Budget</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₱{project.budget}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-emerald-600">👍 <span>{project.likes || 0}</span></div>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-slate-500">😐 <span>{project.neutrals || 0}</span></div>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-red-600">👎 <span>{project.unlikes || 0}</span></div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}