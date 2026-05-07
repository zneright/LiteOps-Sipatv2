import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface StatData { id: string; title: string; value: string | number; trend: string; isPositive: boolean; icon: React.ReactNode; }
interface ProjectData { id: number; title: string; agency: string; description: string; imageGradient: string; avatarLetter: string; timeAgo: string; rawDate: string; likes: number; comments: number; tags: string[]; }

export default function CommitFeed() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Trending");
  const [feedData, setFeedData] = useState<ProjectData[]>([]);
  const [statsData, setStatsData] = useState<StatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 DB States
  const [followedIds, setFollowedIds] = useState<number[]>([]);
  const [followedAgencies, setFollowedAgencies] = useState<string[]>([]);

  useEffect(() => {
    if (user?.email) {
      fetch(`http://localhost:8080/api/users/saved?email=${user.email}`)
        .then(res => res.json())
        .then(data => { if (data.saved_projects) setFollowedIds(data.saved_projects); })
        .catch(console.error);

      fetch(`http://localhost:8080/api/users/followed-agencies?email=${user.email}`)
        .then(res => res.json())
        .then(data => { if (data.followed_agencies) setFollowedAgencies(data.followed_agencies); })
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

  const timeSince = (dateString: string) => {
    if (!dateString) return "Just now";
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60; if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  const gradients = [
    "from-blue-600 to-indigo-500", "from-emerald-500 to-teal-600",
    "from-violet-500 to-fuchsia-500", "from-amber-500 to-orange-500", "from-rose-500 to-pink-600"
  ];

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");
        const allProjects = await response.json();

        let totalPhases = 0; let completedPhases = 0; let totalEngagement = 0;

        // 🚀 Fetch real Comments and Likes
        const processedFeedPromises = allProjects.map(async (p: any, index: number) => {
          let phases = [];
          try { phases = typeof p.phases === 'string' ? JSON.parse(p.phases) : (p.phases || []); } catch (e) { }
          if (Array.isArray(phases)) {
            totalPhases += phases.length;
            completedPhases += phases.filter(ph => ph.status === 'completed' || ph.image_url).length;
          }

          const likesCount = Number(p.likes || 0);

          // 🚀 Fetch Comments Count for this specific project
          let commentsCount = 0;
          try {
            const cRes = await fetch(`http://localhost:8080/api/comments/${p.id}`);
            if (cRes.ok) {
              const cData = await cRes.json();
              commentsCount = Array.isArray(cData) ? cData.length : 0;
            }
          } catch (e) { }

          const projectEngagement = likesCount + Number(p.neutrals || 0) + Number(p.unlikes || 0) + commentsCount;
          totalEngagement += projectEngagement;

          const orgName = p.organization_name || "DPWH";

          return {
            id: p.id, title: p.title || "Untitled Project", agency: orgName, description: p.description || "No description provided.",
            imageGradient: gradients[index % gradients.length], avatarLetter: orgName.charAt(0).toUpperCase(),
            timeAgo: timeSince(p.created_at), rawDate: p.created_at || new Date().toISOString(),
            likes: likesCount, comments: commentsCount, tags: p.category ? [p.category] : ["General"]
          };
        });

        // Wait for all the comment fetch promises to resolve
        const processedFeed = await Promise.all(processedFeedPromises);

        setStatsData([
          { id: "1", title: "Total Projects", value: allProjects.length, trend: "+ Live Updates", isPositive: true, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
          { id: "2", title: "Active Initiatives", value: totalPhases - completedPhases, trend: "Ongoing", isPositive: true, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
          { id: "3", title: "Completed Phases", value: completedPhases, trend: "Verified", isPositive: true, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { id: "4", title: "Total Engagement", value: totalEngagement, trend: "Community actions", isPositive: true, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        ]);
        setFeedData(processedFeed);
      } catch (error) { console.error("Error loading feed data:", error); } finally { setIsLoading(false); }
    };
    fetchRealData();
  }, []);

  const displayedProjects = useMemo(() => {
    let sortedArray = [...feedData];
    if (activeTab === "Trending") sortedArray.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));
    else if (activeTab === "Recent") sortedArray.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
    else if (activeTab === "Following") {
      sortedArray = sortedArray.filter(p => followedIds.includes(p.id) || followedAgencies.includes(p.agency));
    }
    return sortedArray;
  }, [feedData, activeTab, followedIds, followedAgencies]);

  const StatCard = ({ stat }: { stat: StatData }) => (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} className="group bg-white dark:bg-slate-900/80 p-6 rounded-[1.5rem] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all relative overflow-hidden flex flex-col gap-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:to-transparent transition-colors duration-500 pointer-events-none" />
      <div className="relative z-10 flex justify-between items-start">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">{stat.icon}</div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${stat.isPositive ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-rose-50 text-rose-700 border-rose-200/50"}`}>{stat.trend}</span>
      </div>
      <div className="relative z-10">
        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.title}</h4>
        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
      </div>
    </motion.div>
  );

  const DribbbleCard = ({ project }: { project: ProjectData }) => {
    return (
      <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} className="group bg-white dark:bg-slate-900 rounded-[1.5rem] p-3 border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all flex flex-col h-full relative">

        {/* 🚀 PURE UI ONLY - NO IMAGES & NO HEART ICON */}
        <Link to={`/project/${project.id}`} className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${project.imageGradient} relative overflow-hidden flex flex-col items-center justify-center shadow-inner block`}>
          <div className="absolute inset-0 opacity-30 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-overlay">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /></svg>
          </div>
          <span className="text-5xl mb-3 drop-shadow-lg group-hover:scale-110 transition-transform duration-500">🏗️</span>
          <span className="text-white/90 font-black text-xl text-center px-6 mix-blend-overlay line-clamp-2 leading-tight drop-shadow-md group-hover:-translate-y-1 transition-transform duration-500">{project.title}</span>

          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-slate-900 font-black tracking-wider uppercase text-[9px] shadow-sm">{project.timeAgo}</div>
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-white px-5 py-2.5 rounded-xl text-slate-900 font-black tracking-widest uppercase text-xs shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">View Project</div>
          </div>
        </Link>

        <div className="flex flex-col flex-1 px-2 pt-5 pb-2">
          <Link to={`/project/${project.id}`} className="text-lg font-black text-slate-900 dark:text-white leading-tight line-clamp-1 mb-2 hover:text-indigo-600 transition-colors">{project.title}</Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-5 flex-1 leading-relaxed">{project.description}</p>
          <div className="flex gap-2 mb-5 flex-wrap">
            {project.tags.map((tag) => (<span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">{tag}</span>))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Link to={`/agency-profile/${encodeURIComponent(project.agency)}`} className="flex items-center gap-2.5 group/agency">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-black shadow-sm group-hover/agency:scale-110 transition-transform">{project.avatarLetter}</div>
              <span className="text-xs font-bold text-slate-700 group-hover/agency:text-indigo-600 transition-colors">{project.agency}</span>
            </Link>

            {/* 🚀 REAL LIKES AND COMMENTS */}
            <div className="flex items-center gap-3 text-slate-400">
              <div className="flex items-center gap-1"><svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg><span className="text-xs font-bold">{project.likes}</span></div>
              <div className="flex items-center gap-1"><svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg><span className="text-xs font-bold">{project.comments}</span></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) return (<div className="w-full py-32 flex flex-col items-center justify-center gap-4"><div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Network Data...</p></div>);

  return (
    <div className="w-full flex flex-col gap-12 pb-20 relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-400/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <section className="flex flex-col gap-5 pt-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center self-start gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 shadow-sm text-xs font-bold text-slate-600">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
          Sipat Platform Live
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">Discover What’s </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Happening</span>
        </motion.h1>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <motion.div key={stat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.05 }}><StatCard stat={stat} /></motion.div>
        ))}
      </section>

      <section className="flex flex-col gap-8 mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2"><span className="text-slate-900 dark:text-white">Active</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Feed</span></h2>
          <div className="flex bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200/80 p-1.5 shadow-sm">
            {["Trending", "Recent", "Following"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === tab ? "bg-slate-900 text-white shadow-md transform scale-100" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 transform scale-95 hover:scale-100"}`}>{tab}</button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {displayedProjects.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full py-16 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 border-dashed">
              {activeTab === "Following" ? (
                <>
                  <span className="text-4xl mb-4">💔</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">You aren't following any agencies</h3>
                  <p className="text-sm font-medium text-slate-500 mb-6">Visit an Official Agency Profile and click "Follow" to see their updates here.</p>
                  <button onClick={() => setActiveTab("Trending")} className="px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">See Trending Projects</button>
                </>
              ) : (
                <>
                  <span className="text-4xl mb-4">📭</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No projects found</h3>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {displayedProjects.map((project) => (<DribbbleCard key={project.id} project={project} />))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}