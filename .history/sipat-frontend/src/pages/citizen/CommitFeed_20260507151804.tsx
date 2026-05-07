import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface StatData { id: string; title: string; value: string | number; trend: string; isPositive: boolean; icon: React.ReactNode; }
interface ProjectData { id: number; title: string; agency: string; description: string; imageGradient: string; categoryIcon: string; avatarLetter: string; timeAgo: string; rawDate: string; likes: number; comments: number; tags: string[]; }

const categoryMetadata = [
  { name: "Infrastructure", icon: "🏗️", gradient: "from-blue-500 to-indigo-600" },
  { name: "Technology", icon: "⚡", gradient: "from-violet-500 to-purple-600" },
  { name: "Environment", icon: "🌿", gradient: "from-emerald-500 to-teal-600" },
  { name: "Healthcare", icon: "🏥", gradient: "from-rose-500 to-orange-500" },
  { name: "Education", icon: "🎓", gradient: "from-cyan-500 to-blue-500" },
  { name: "Transport", icon: "🚌", gradient: "from-orange-500 to-amber-500" },
];

export default function CommitFeed() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Trending");
  const [feedData, setFeedData] = useState<ProjectData[]>([]);
  const [statsData, setStatsData] = useState<StatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    } else {
      setFollowedIds([]);
      setFollowedAgencies([]);
    }
  }, [user]);

  const timeSince = (dateString: string) => {
    if (!dateString) return "Just now";
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60; if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  const getExactCategoryUI = (categoryName: string) => {
    const found = categoryMetadata.find(c => c.name.toLowerCase() === (categoryName || "").toLowerCase().trim());
    if (found) return { bg: found.gradient, icon: found.icon };
    return { bg: "from-slate-500 to-slate-700", icon: "📁" };
  };

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");
        const allProjects = await response.json();

        let totalPhases = 0; let completedPhases = 0; let totalEngagement = 0;

        const processedFeedPromises = allProjects.map(async (p: any) => {
          let phases = [];
          try { phases = typeof p.phases === 'string' ? JSON.parse(p.phases) : (p.phases || []); } catch (e) { }
          if (Array.isArray(phases)) {
            totalPhases += phases.length;
            completedPhases += phases.filter(ph => ph.status === 'completed' || ph.image_url).length;
          }

          const likesCount = Number(p.likes || 0);

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

          const ui = getExactCategoryUI(p.category);

          return {
            id: p.id, title: p.title || "Untitled Project", agency: orgName, description: p.description || "No description provided.",
            imageGradient: ui.bg, categoryIcon: ui.icon, avatarLetter: orgName.charAt(0).toUpperCase(),
            timeAgo: timeSince(p.created_at), rawDate: p.created_at || new Date().toISOString(),
            likes: likesCount, comments: commentsCount, tags: p.category ? [p.category] : ["General"]
          };
        });

        const processedFeed = await Promise.all(processedFeedPromises);

        setStatsData([
          { id: "1", title: "Total Projects", value: allProjects.length, trend: "+ Live Updates", isPositive: true, icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
          { id: "2", title: "Active Initiatives", value: totalPhases - completedPhases, trend: "Ongoing", isPositive: true, icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
          { id: "3", title: "Completed Phases", value: completedPhases, trend: "Verified", isPositive: true, icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { id: "4", title: "Total Engagement", value: totalEngagement, trend: "Community actions", isPositive: true, icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        ]);
        setFeedData(processedFeed);
      } catch (error) { console.error("Error loading feed data:", error); } finally { setIsLoading(false); }
    };
    fetchRealData();
  }, []);

  const displayedProjects = useMemo(() => {
    let sortedArray = [...feedData];
    if (activeTab === "Trending") {
      sortedArray.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));
    } else if (activeTab === "Recent") {
      sortedArray.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
    } else if (activeTab === "Following") {
      if (!isLoggedIn) return [];

      sortedArray = sortedArray.filter(p =>
        followedIds.includes(p.id) ||
        followedAgencies.some(agency => agency.toLowerCase().trim() === p.agency.toLowerCase().trim())
      );
    }
    return sortedArray;
  }, [feedData, activeTab, followedIds, followedAgencies, isLoggedIn]);

  const StatCard = ({ stat }: { stat: StatData }) => (
    <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all relative overflow-hidden flex flex-col gap-5">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-colors duration-500 pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex justify-between items-start">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-500/25">
          {stat.icon}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-sm ${stat.isPositive ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-rose-50/80 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"}`}>{stat.trend}</span>
      </div>
      <div className="relative z-10">
        <h4 className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1.5">{stat.title}</h4>
        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
      </div>
    </motion.div>
  );

  const DribbbleCard = ({ project }: { project: ProjectData }) => {
    return (
      <motion.div layout initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} transition={{ duration: 0.4, type: "spring", bounce: 0.3 }} className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-3.5 border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-indigo-500/15 dark:hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col h-full relative">
        <Link to={`/project/${project.id}`} className={`w-full aspect-[4/3] rounded-[2rem] bg-gradient-to-br ${project.imageGradient} relative overflow-hidden flex flex-col items-center justify-center shadow-inner block group/image`}>
          <div className="absolute inset-0 opacity-40 group-hover/image:scale-125 transition-transform duration-1000 ease-out mix-blend-overlay">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white/50"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /><circle cx="80" cy="80" r="40" /></svg>
          </div>
          <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="text-6xl mb-4 drop-shadow-2xl group-hover/image:scale-110 transition-transform duration-500">{project.categoryIcon}</motion.span>
          <span className="text-white font-black text-2xl text-center px-8 mix-blend-overlay line-clamp-2 leading-tight drop-shadow-lg group-hover/image:-translate-y-1 transition-transform duration-500">{project.title}</span>

          <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-black tracking-widest uppercase text-[10px] shadow-sm border border-white/20">{project.timeAgo}</div>
          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl text-slate-900 font-black tracking-widest uppercase text-xs shadow-2xl translate-y-6 group-hover/image:translate-y-0 transition-transform duration-500 ease-out">View Details</div>
          </div>
        </Link>

        <div className="flex flex-col flex-1 px-3 pt-6 pb-3">
          <Link to={`/project/${project.id}`} className="text-xl font-black text-slate-900 dark:text-white leading-tight line-clamp-1 mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{project.title}</Link>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-1 leading-relaxed font-medium">{project.description}</p>
          <div className="flex gap-2 mb-6 flex-wrap">
            {project.tags.map((tag) => (<span key={tag} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">{tag}</span>))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
            <Link to={`/agency-profile/${encodeURIComponent(project.agency)}`} className="flex items-center gap-3 group/agency">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-indigo-500/20 group-hover/agency:scale-110 group-hover:rotate-3 transition-all duration-300">{project.avatarLetter}</div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover/agency:text-indigo-600 dark:group-hover/agency:text-indigo-400 transition-colors">{project.agency}</span>
            </Link>

            <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-1.5"><svg className="w-4 h-4 text-emerald-500 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg><span className="text-sm font-bold text-slate-600 dark:text-slate-300">{project.likes}</span></div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex items-center gap-1.5"><svg className="w-4 h-4 text-blue-500 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg><span className="text-sm font-bold text-slate-600 dark:text-slate-300">{project.comments}</span></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="h-16 w-16 border-4 border-indigo-100 dark:border-indigo-900/50 border-t-indigo-600 dark:border-t-indigo-400 rounded-full shadow-lg shadow-indigo-500/20"></motion.div>
      <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Loading Network Data...</motion.p>
    </div>
  );

  return (
    <div className="w-full min-h-screen flex flex-col gap-12 pb-24 relative px-4 sm:px-6 lg:px-8 max-w-[90rem] mx-auto selection:bg-indigo-500/30">
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-screen" />
      <div className="fixed top-40 right-1/4 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-screen" />

      <section className="flex flex-col gap-6 pt-12 items-center text-center sm:items-start sm:text-left">
        <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 shadow-sm shadow-indigo-500/5 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
          <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span></span>
          Sipat Platform Live
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight drop-shadow-sm">
          <span className="text-slate-900 dark:text-white">Discover What’s </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">Happening</span>
        </motion.h1>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {statsData.map((stat, index) => (
          <motion.div key={stat.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 100 }}><StatCard stat={stat} /></motion.div>
        ))}
      </section>

      <section className="flex flex-col gap-10 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-black tracking-tight flex items-center gap-3"><span className="text-slate-900 dark:text-white">Active</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Feed</span></motion.h2>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-800/50 p-1.5 shadow-lg shadow-slate-200/20 dark:shadow-none">
            {["Trending", "Recent", "Following"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative ${activeTab === tab ? "text-white shadow-md shadow-indigo-500/25 transform scale-100" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transform scale-[0.98] hover:scale-100"}`}>
                {activeTab === tab && (
                  <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </motion.div>
        </div>

        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === "Following" && !isLoggedIn ? (
              <motion.div key="login-required" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full py-24 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl rounded-[3rem] border-2 border-slate-200/50 dark:border-slate-800/50 border-dashed shadow-sm">
                <div className="w-24 h-24 mb-6 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-5xl shadow-inner border border-indigo-100 dark:border-indigo-500/20">🔒</div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Authentication Required</h3>
                <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-md leading-relaxed">Create an account or sign in to build your personalized feed of followed agencies and projects.</p>
                <Link to="/login" className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0">Sign In to Continue</Link>
              </motion.div>
            ) : displayedProjects.length === 0 ? (
              <motion.div key="empty-feed" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full py-24 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl rounded-[3rem] border-2 border-slate-200/50 dark:border-slate-800/50 border-dashed shadow-sm">
                {activeTab === "Following" ? (
                  <>
                    <div className="w-24 h-24 mb-6 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-5xl shadow-inner border border-rose-100 dark:border-rose-500/20">👀</div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Your feed is empty</h3>
                    <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-md leading-relaxed">You aren't following any active agencies or projects yet. Start exploring to build your feed.</p>
                    <button onClick={() => setActiveTab("Trending")} className="px-8 py-3.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0">Explore Trending</button>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 mb-6 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-5xl shadow-inner border border-slate-200 dark:border-slate-700">📭</div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No projects found</h3>
                    <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Check back later for new updates.</p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="grid-feed" layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence>
                  {displayedProjects.map((project, idx) => (
                    <motion.div key={project.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}>
                      <DribbbleCard project={project} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}