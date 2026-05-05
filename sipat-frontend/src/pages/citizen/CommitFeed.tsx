import React, { useState } from "react";
import { motion } from "framer-motion";
// import ActivityGraph from "../../components/charts/ActivityGraph";
// import StatsChart from "../../components/charts/StatsChart";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface StatData {
  id: string;
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

interface ProjectData {
  id: string;
  title: string;
  agency: string;
  description: string;
  imageGradient: string;
  avatarLetter: string;
  timeAgo: string;
  likes: number;
  comments: number;
  tags: string[];
}

// --- Mock Data ---
const statsData: StatData[] = [
  {
    id: "1",
    title: "Total Projects",
    value: "1,248",
    trend: "+12% this month",
    isPositive: true,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    id: "2",
    title: "Active Initiatives",
    value: "342",
    trend: "+5% this week",
    isPositive: true,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    id: "3",
    title: "Completed Updates",
    value: "8,930",
    trend: "+18% all time",
    isPositive: true,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: "4",
    title: "Citizen Engagement",
    value: "45.2k",
    trend: "-2% this week",
    isPositive: false,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
];

const feedData: ProjectData[] = [
  {
    id: "p1",
    title: "Smart Solar Streetlights Expansion",
    agency: "Department of Energy",
    description:
      "Installation of IoT-enabled solar streetlights across major intersections to reduce grid dependency and improve nighttime safety.",
    imageGradient: "from-blue-600 to-indigo-500",
    avatarLetter: "D",
    timeAgo: "2h ago",
    likes: 342,
    comments: 28,
    tags: ["Infrastructure", "Green Tech"],
  },
  {
    id: "p2",
    title: "Public Market Digitization API",
    agency: "LGU Malabon",
    description:
      "A new open API allowing local vendors to sync their daily inventory with the central city application for transparent pricing.",
    imageGradient: "from-emerald-500 to-teal-600",
    avatarLetter: "L",
    timeAgo: "5h ago",
    likes: 124,
    comments: 12,
    tags: ["Commerce", "API"],
  },
  {
    id: "p3",
    title: "Flood Control River Sensors",
    agency: "DPWH District II",
    description:
      "Deployment of ultrasonic water level sensors along the Tullahan river, pushing real-time telemetry to the public dashboard.",
    imageGradient: "from-violet-500 to-fuchsia-500",
    avatarLetter: "D",
    timeAgo: "1d ago",
    likes: 892,
    comments: 156,
    tags: ["Safety", "IoT"],
  },
];

// --- Components ---
// (Notice the hooks are removed from here!)

const StatCard = ({ stat }: { stat: StatData }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    className="group bg-white dark:bg-slate-900/80 p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden flex flex-col gap-4"
  >
    {/* Subtle Background Glow on Hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:to-transparent dark:group-hover:from-indigo-500/5 transition-colors duration-500 pointer-events-none" />

    <div className="relative z-10 flex justify-between items-start">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-all duration-300 shadow-sm">
        {stat.icon}
      </div>
      <span
        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
          stat.isPositive
            ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
            : "bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
        } transition-colors shadow-sm`}
      >
        {stat.trend}
      </span>
    </div>
    <div className="relative z-10">
      <h4 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1 transition-colors">
        {stat.title}
      </h4>
      <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">
        {stat.value}
      </p>
    </div>
  </motion.div>
);

const DribbbleCard = ({ project }: { project: ProjectData }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -8 }}
    className="group bg-white dark:bg-slate-900 rounded-[1.5rem] p-3 border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/15 dark:hover:shadow-none dark:hover:border-indigo-500/40 transition-all duration-300 flex flex-col"
  >
    {/* Premium Image Area */}
    <div
      className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${project.imageGradient} relative overflow-hidden flex items-center justify-center shadow-inner`}
    >
      <div className="absolute inset-0 opacity-30 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-overlay">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full fill-white"
        >
          <polygon points="0,100 100,0 100,100" />
          <circle cx="20" cy="20" r="30" />
        </svg>
      </div>

      {/* Floating Status Badge */}
      <div className="absolute top-3 left-3 bg-white/20 dark:bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white font-bold tracking-wider uppercase text-[10px] shadow-sm">
        Just Committed
      </div>

      <div className="relative z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/50 dark:border-slate-700 text-slate-900 dark:text-white font-bold tracking-widest uppercase text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
        View Project
      </div>
    </div>

    {/* Content Area */}
    <div className="flex flex-col flex-1 px-2 pt-5 pb-2">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-1 mb-2 transition-colors">
        {project.title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-5 flex-1 leading-relaxed transition-colors">
        {project.description}
      </p>

      {/* Tags */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 rounded-lg transition-colors"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 border border-indigo-200 dark:from-indigo-500/20 dark:to-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30 flex items-center justify-center text-[10px] font-bold shadow-sm transition-colors">
            {project.avatarLetter}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
            {project.agency}
          </span>
        </div>

        <div className="flex items-center gap-3.5 text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group/icon">
            <svg
              className="w-4 h-4 group-hover/icon:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="text-xs font-bold">{project.likes}</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group/icon">
            <svg
              className="w-4 h-4 group-hover/icon:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-bold">{project.comments}</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function CommitFeed() {
  // ✅ THE HOOKS GO HERE! Inside the component function, at the very top.
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Trending");

  return (
    <div className="w-full flex flex-col gap-12 pb-20 relative">
      {/* --- WOW FACTOR: Ambient Background Blobs --- */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* 1. Hero Section */}
      <section className="flex flex-col gap-5 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center self-start gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Sipat Platform Live
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            Discover What’s{" "}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Happening
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl transition-colors font-medium leading-relaxed"
        >
          Explore real-time infrastructure commits, track government
          initiatives, and verify local updates directly in your community.
        </motion.p>
      </section>

      {/* 2. Stats Overview Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <StatCard stat={stat} />
          </motion.div>
        ))}
      </section>

      {/* 3. Analytics Dashboard Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="hover:shadow-xl hover:shadow-indigo-500/5 transition-shadow duration-500 rounded-2xl"
        >
          {/* <ActivityGraph /> */}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="hover:shadow-xl hover:shadow-indigo-500/5 transition-shadow duration-500 rounded-2xl"
        >
          {/* <StatsChart /> */}
        </motion.div>
      </section>

      {/* 4. Dribbble-Style Community Feed */}
      <section className="flex flex-col gap-8 mt-8">
        {/* Feed Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
              Latest
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Commits
            </span>
          </h2>

          <div className="flex bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-1.5 shadow-sm transition-colors">
            {["Trending", "Following", "Local"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md transform scale-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transform scale-95 hover:scale-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {feedData.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.6 + index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
            >
              <DribbbleCard project={project} />
            </motion.div>
          ))}
        </div>

        {/* Load More Action */}
        <div className="flex justify-center mt-8">
          <button 
            onClick={() => !isLoggedIn ? navigate('/login') : console.log('Load more API call')}
            className="px-8 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl text-sm font-extrabold text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
          >
            {isLoggedIn ? "Load More Updates" : "Login to Load More Updates"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
}