import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface Project {
  id: number; title: string; category: string; budget: string; description: string; created_at: string; phases: any; likes?: number; neutrals?: number; unlikes?: number; organization_name?: string; imageGradient?: string;
  commentsCount?: number; // 🚀 Added to hold real comments count
}

export default function Explore() {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 DB States
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

  const gradients = [
    "from-blue-600 to-indigo-500", "from-emerald-500 to-teal-600",
    "from-violet-500 to-fuchsia-500", "from-amber-500 to-orange-500", "from-rose-500 to-pink-600"
  ];

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const allProjects = await response.json();

      // 🚀 Fetch real Comments and Likes for the Explore page
      const processedProjectsPromises = allProjects.map(async (p: any, i: number) => {
        let commentsCount = 0;
        try {
          const cRes = await fetch(`http://localhost:8080/api/comments/${p.id}`);
          if (cRes.ok) {
            const cData = await cRes.json();
            commentsCount = Array.isArray(cData) ? cData.length : 0;
          }
        } catch (e) { }

        return {
          ...p,
          imageGradient: gradients[i % gradients.length],
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

  const handleReaction = async (projectId: number, type: 'likes' | 'neutrals' | 'unlikes') => {
    if (!user?.email) return alert("Please log in to react to projects.");
    try {
      await fetch(`http://localhost:8080/api/projects/${projectId}/react`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, user_email: user.email })
      });
      fetchProjects();
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
    <div className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link to="/categories" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back to Categories
        </Link>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
          {selectedCategory ? `${selectedCategory} Projects` : "All Projects"}
        </motion.h1>
      </div>

      {isLoading ? (
        <div className="w-full py-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
      ) : projects.length === 0 ? (
        <div className="w-full bg-slate-50 rounded-3xl p-12 text-center border border-slate-200 border-dashed">
          <span className="text-4xl mb-4 block">📭</span><h3 className="text-lg font-bold">No projects found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, idx) => {
            const { percentage, latestPhase } = getProgressData(project.phases);
            const isFollowed = followedIds.includes(project.id);
            const orgName = project.organization_name || "DPWH";

            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="group bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative hover:-translate-y-1">

                <button onClick={(e) => toggleFollow(project.id, e)} className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
                  <svg className={`w-5 h-5 transition-colors ${isFollowed ? "text-rose-500 fill-current" : "text-slate-400"}`} viewBox="0 0 24 24" stroke="currentColor" fill={isFollowed ? "currentColor" : "none"}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>

                {/* 🚀 PURE UI - NO IMAGES */}
                <Link to={`/project/${project.id}`} className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${project.imageGradient} relative overflow-hidden flex flex-col items-center justify-center shadow-inner block`}>
                  <div className="absolute inset-0 opacity-30 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-overlay">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /></svg>
                  </div>
                  <span className="text-5xl mb-3 drop-shadow-lg group-hover:scale-110 transition-transform duration-500">🏗️</span>
                  <span className="text-white/90 font-black text-xl text-center px-6 mix-blend-overlay line-clamp-2 leading-tight drop-shadow-md group-hover:-translate-y-1 transition-transform duration-500">{project.title}</span>

                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-slate-900 font-black tracking-wider uppercase text-[9px] shadow-sm">{project.category || "General"}</div>
                  <div className="absolute bottom-3 left-4">
                    <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                      <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg> {orgName}
                    </Link>
                  </div>
                </Link>

                <div className="p-6 flex flex-col flex-grow gap-4 relative z-10 bg-white">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{formatDate(project.created_at)}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress: {percentage}%</span>
                      <span className={`text-[10px] font-bold truncate max-w-[60%] text-right ${percentage === 100 ? 'text-emerald-500' : 'text-indigo-600'}`}>{percentage === 100 ? "Completed" : latestPhase}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full rounded-full transition-all duration-1000 ease-out ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-2 flex-grow mt-1">{project.description}</p>

                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2.5 group/agency">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-black shadow-sm group-hover/agency:scale-110 transition-transform">{orgName.charAt(0).toUpperCase()}</div>
                      <span className="text-xs font-bold text-slate-700 group-hover/agency:text-indigo-600 transition-colors">{orgName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="flex items-center gap-1"><svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg><span className="text-xs font-bold">{project.likes || 0}</span></div>

                      {/* 🚀 REAL COMMENTS COUNT */}
                      <div className="flex items-center gap-1"><svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg><span className="text-xs font-bold">{project.commentsCount || 0}</span></div>
                    </div>
                  </div>

                  <Link to={`/project/${project.id}`} className="mt-2 text-center w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-colors">View Project</Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}