import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface StatData { id: string; title: string; value: string | number; trend: string; isPositive: boolean; icon: React.ReactNode; }
interface ProjectData { id: number; title: string; agency: string; description: string; imageGradient: string; categoryIcon: string; avatarLetter: string; timeAgo: string; rawDate: string; likes: number; comments: number; tags: string[]; }

const categoryMetadata = [
  { name: "Infrastructure", icon: "🏗️", gradient: "from-blue-500 via-indigo-500 to-purple-600" },
  { name: "Technology", icon: "⚡", gradient: "from-violet-500 via-purple-500 to-fuchsia-600" },
  { name: "Environment", icon: "🌿", gradient: "from-emerald-400 via-teal-500 to-cyan-600" },
  { name: "Healthcare", icon: "🏥", gradient: "from-rose-400 via-red-500 to-orange-500" },
  { name: "Education", icon: "🎓", gradient: "from-cyan-400 via-blue-500 to-indigo-600" },
  { name: "Transport", icon: "🚌", gradient: "from-orange-400 via-amber-500 to-yellow-500" },
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
    return { bg: "from-slate-600 via-slate-700 to-slate-800", icon: "📁" };
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
    <motion.div whileHover={{ y: -8, scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-7 rounded-[2.5rem] border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all overflow-hidden flex flex-col gap-5">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-700" />
      <motion.div animate={{ rotate: [0, 90, 180, 270, 360] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10 flex justify-between items-start">
        <div className="w-14 h-14 rounded-[1.25rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:text-white group-hover:border-transparent transition-all duration-500 shadow-sm group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          {stat.icon}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 group-hover:scale-105 ${stat.isPositive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"}`}>
          {stat.trend}
        </span>
      </div>
      <div className="relative z-10">
        <h4 className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300">{stat.title}</h4>
        <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tighter drop-shadow-sm group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 transition-all duration-500">{stat.value}</p>
      </div>
    </motion.div>
  );

  const DribbbleCard = ({ project }: { project: ProjectData }) => {
    return (
      <motion.div layout initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8, filter: "blur(15px)" }} transition={{ duration: 0.5, type: "spring", bounce: 0.4 }} className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-3 border border-white/80 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgb(99,102,241,0.15)] dark:hover:shadow-[0_20px_40px_rgb(99,102,241,0.1)] transition-all duration-500 flex flex-col h-full transform-gpu hover:-translate-y-2">
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none" />

        <Link to={`/project/${project.id}`} className={`w-full aspect-[4/3] rounded-[2rem] bg-gradient-to-br ${project.imageGradient} relative overflow-hidden flex flex-col items-center justify-center shadow-inner block group/image`}>
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white/50"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /><circle cx="80" cy="80" r="40" /></svg>
          </motion.div>

          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="relative z-10 flex flex-col items-center">
            <span className="text-7xl mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] group-hover/image:scale-110 group-hover/image:rotate-6 transition-transform duration-500 ease-out">{project.categoryIcon}</span>
            <span className="text-white font-black text-2xl text-center px-8 mix-blend-overlay line-clamp-2 leading-tight drop-shadow-xl group-hover/image:-translate-y-2 transition-transform duration-500 ease-out">{project.title}</span>
          </motion.div>

          <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-xl px-4 py-1.5 rounded-full text-white font-black tracking-widest uppercase text-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/30 group-hover/image:scale-105 transition-transform duration-300">{project.timeAgo}</div>

          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-md">
            <div className="bg-white px-7 py-3.5 rounded-2xl text-slate-900 font-black tracking-widest uppercase text-[11px] shadow-[0_10px_30px_rgba(0,0,0,0.3)] translate-y-10 scale-90 group-hover/image:translate-y-0 group-hover/image:scale-100 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex items-center gap-2">
              View Details
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </Link>

        <div className="flex flex-col flex-1 px-4 pt-6 pb-3 relative z-10">
          <Link to={`/project/${project.id}`} className="text-xl font-black text-slate-900 dark:text-white leading-tight line-clamp-1 mb-2 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 transition-all duration-300">{project.title}</Link>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-1 leading-relaxed font-medium">{project.description}</p>

          <div className="flex gap-2 mb-6 flex-wrap">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30 transition-colors duration-300">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
            <Link to={`/agency-profile/${encodeURIComponent(project.agency)}`} className="flex items-center gap-3 group/agency">
              <div className="relative w-10 h-10 rounded-[0.85rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 p-[2px] shadow-lg shadow-indigo-500/20 group-hover/agency:shadow-indigo-500/40 transition-shadow duration-300">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center group-hover/agency:bg-transparent transition-colors duration-300">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 group-hover/agency:text-white text-sm font-black transition-colors duration-300">{project.avatarLetter}</span>
                </div>
              </div>
              <span className="text-[13px] font-black text-slate-700 dark:text-slate-300 group-hover/agency:text-indigo-600 dark:group-hover/agency:text-indigo-400 transition-colors">{project.agency}</span>
            </Link>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm group-hover:border-indigo-100 dark:group-hover:border-indigo-500/30 transition-colors duration-300">
              <div className="flex items-center gap-1.5"><motion.svg whileHover={{ scale: 1.2, rotate: -10 }} className="w-4 h-4 text-emerald-500 drop-shadow-sm cursor-pointer" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></motion.svg><span className="text-[13px] font-black text-slate-600 dark:text-slate-300">{project.likes}</span></div>
              <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex items-center gap-1.5"><motion.svg whileHover={{ scale: 1.2, rotate: 10 }} className="w-4 h-4 text-blue-500 drop-shadow-sm cursor-pointer" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></motion.svg><span className="text-[13px] font-black text-slate-600 dark:text-slate-300">{project.comments}</span></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
      <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute w-96 h-96 bg-indigo-500 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="relative">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 rounded-full border-t-4 border-b-4 border-indigo-600 opacity-20"></motion.div>
        <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-2 rounded-full border-l-4 border-r-4 border-purple-500 opacity-40"></motion.div>
        <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-md shadow-[0_0_40px_rgba(99,102,241,0.3)] border border-white/20 flex items-center justify-center">
          <span className="text-2xl animate-pulse">✨</span>
        </div>
      </div>
      <motion.p animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 drop-shadow-md z-10">Initializing Neural Net...</motion.p>
    </div>
  );

  return (
    <div className="w-full min-h-screen flex flex-col gap-14 pb-32 relative px-4 sm:px-6 lg:px-8 max-w-[95rem] mx-auto selection:bg-indigo-500/30 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
        <motion.div animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute -top-[10%] -left-[10%] w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <motion.div animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute top-[20%] -right-[10%] w-[700px] h-[700px] bg-purple-500/10 dark:bg-purple-600/15 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <motion.div animate={{ x: [0, 30, 0], y: [0, -40, 0] }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute -bottom-[10%] left-[20%] w-[600px] h-[600px] bg-fuchsia-500/10 dark:bg-fuchsia-600/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <section className="flex flex-col gap-8 pt-16 items-center text-center sm:items-start sm:text-left relative z-10">
        <motion.div initial={{ opacity: 0, y: -30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-700/60 shadow-[0_8px_20px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_20px_rgb(0,0,0,0.2)] text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300 cursor-default hover:scale-105 transition-transform duration-300">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]"></span>
          </div>
          System Live Stream
        </motion.div>

        <div className="overflow-hidden">
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, type: "spring", bounce: 0.4 }} className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter drop-shadow-sm leading-[1.1]">
            <span className="text-slate-900 dark:text-white">Discover </span>
            <motion.span animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="text-transparent bg-clip-text bg-[linear-gradient(to_right,#6366f1,#a855f7,#ec4899,#6366f1)] bg-[length:200%_auto]">
              What’s Next
            </motion.span>
          </motion.h1>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {statsData.map((stat, index) => (
          <motion.div key={stat.id} initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 100, damping: 15 }}><StatCard stat={stat} /></motion.div>
        ))}
      </section>

      <section className="flex flex-col gap-10 mt-10 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-4 rounded-[2rem] border border-white/60 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <motion.h2 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, type: "spring" }} className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3 px-4">
            <div className="w-2 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
            <span className="text-slate-900 dark:text-white">Active Feed</span>
          </motion.h2>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, type: "spring" }} className="flex w-full lg:w-auto bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800 p-1.5 shadow-inner overflow-x-auto hide-scrollbar">
            {["Trending", "Recent", "Following"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 lg:flex-none px-8 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative whitespace-nowrap ${activeTab === tab ? "text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                {activeTab === tab && (
                  <motion.div layoutId="activeTabGlow" className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl -z-10 shadow-[0_0_20px_rgba(99,102,241,0.5)]" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </motion.div>
        </div>

        <div className="min-h-[600px] relative">
          <AnimatePresence mode="wait">
            {activeTab === "Following" && !isLoggedIn ? (
              <motion.div key="login-required" initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} transition={{ type: "spring" }} className="w-full py-32 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/60 dark:border-slate-700/50 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgxMDAsMTAwLDEwMCwwLjEpIi8+PC9zdmc+')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
                <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-32 h-32 mb-8 rounded-[2rem] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center text-6xl shadow-inner border border-white/50 dark:border-white/5 relative z-10">
                  🔒
                </motion.div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 relative z-10 tracking-tight">Access Restricted</h3>
                <p className="text-[17px] font-medium text-slate-500 dark:text-slate-400 mb-10 max-w-lg leading-relaxed relative z-10">Authenticate your identity to construct your personalized neural feed of followed entities.</p>
                <Link to="/login" className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black tracking-widest uppercase text-sm rounded-2xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-all duration-300 transform hover:-translate-y-1 relative z-10 flex items-center gap-3">
                  Initialize Login
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </motion.div>
            ) : displayedProjects.length === 0 ? (
              <motion.div key="empty-feed" initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} transition={{ type: "spring" }} className="w-full py-32 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/60 dark:border-slate-700/50 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgxMDAsMTAwLDEwMCwwLjEpIi8+PC9zdmc+')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
                {activeTab === "Following" ? (
                  <>
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="w-32 h-32 mb-8 rounded-[2rem] bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 flex items-center justify-center text-6xl shadow-inner border border-white/50 dark:border-white/5 relative z-10">👀</motion.div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 relative z-10 tracking-tight">Void Detected</h3>
                    <p className="text-[17px] font-medium text-slate-500 dark:text-slate-400 mb-10 max-w-lg leading-relaxed relative z-10">Your tracking matrix is currently empty. Establish connections to populate this sector.</p>
                    <button onClick={() => setActiveTab("Trending")} className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black tracking-widest uppercase text-sm rounded-2xl hover:shadow-[0_10px_30px_rgba(99,102,241,0.4)] transition-all duration-300 transform hover:-translate-y-1 relative z-10">Scan Trending Sector</button>
                  </>
                ) : (
                  <>
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-32 h-32 mb-8 rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-6xl shadow-inner border border-white/50 dark:border-white/5 relative z-10">📭</motion.div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 relative z-10 tracking-tight">No Data Found</h3>
                    <p className="text-[17px] font-medium text-slate-500 dark:text-slate-400 relative z-10">The current query returned zero nodes. Stand by for updates.</p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="grid-feed" layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence>
                  {displayedProjects.map((project, idx) => (
                    <DribbbleCard key={project.id} project={project} />
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