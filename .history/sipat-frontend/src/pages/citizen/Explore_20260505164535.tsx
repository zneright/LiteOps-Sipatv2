import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface StatData {
  id: string;
  title: string;
  value: string;
  icon: React.ReactNode;
}

interface ProjectData {
  id: string;
  title: string;
  agency: string;
  description: string;
  imageGradient: string;
  avatarLetter: string;
  likes: number;
  comments: number;
  category: string;
  isFeatured?: boolean;
}

// --- Mock Data ---
const exploreStats: StatData[] = [
  {
    id: "1",
    title: "Total Discoveries",
    value: "12.4k",
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
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    id: "2",
    title: "Active Updates",
    value: "892",
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
    title: "Community Engagements",
    value: "145k",
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
          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
        />
      </svg>
    ),
  },
  {
    id: "4",
    title: "Verified Contributors",
    value: "3,420",
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
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
];

const exploreData: ProjectData[] = [
  {
    id: "e1",
    title: "Metro Manila Subway Extension Beta",
    agency: "DOTr",
    description:
      "Exclusive preview of the proposed alignment for the Phase 2 subway extension connecting Northern and Southern business districts.",
    imageGradient: "from-blue-600 via-indigo-600 to-purple-600",
    avatarLetter: "D",
    likes: 1240,
    comments: 342,
    category: "Transit",
    isFeatured: true,
  },
  {
    id: "e2",
    title: "Pasig River Esplanade Masterplan",
    agency: "Urban Dev Auth",
    description:
      "Community feedback phase for the new 5km continuous pedestrian and bike lane along the riverbanks.",
    imageGradient: "from-emerald-500 to-teal-600",
    avatarLetter: "U",
    likes: 892,
    comments: 156,
    category: "Urban Planning",
    isFeatured: true,
  },
  {
    id: "e3",
    title: "Smart Traffic Light Algorithms",
    agency: "MMDA",
    description:
      "Implementation of AI-driven traffic management in major intersections to reduce idle times by 20%.",
    imageGradient: "from-amber-400 to-orange-500",
    avatarLetter: "M",
    likes: 432,
    comments: 89,
    category: "Technology",
  },
  {
    id: "e4",
    title: "Public School Solar Roofing",
    agency: "DepEd Local",
    description:
      "Installing 50kW solar panels on 12 local public high schools to ensure uninterrupted power during classes.",
    imageGradient: "from-sky-400 to-blue-500",
    avatarLetter: "D",
    likes: 671,
    comments: 45,
    category: "Education",
  },
  {
    id: "e5",
    title: "Barangay Health Center Upgrades",
    agency: "DOH Regional",
    description:
      "Standardizing digital patient records and upgrading emergency triage equipment across 50 barangays.",
    imageGradient: "from-rose-400 to-red-500",
    avatarLetter: "D",
    likes: 530,
    comments: 67,
    category: "Healthcare",
  },
  {
    id: "e6",
    title: "Community Pocket Parks",
    agency: "LGU Environment",
    description:
      "Converting 15 unused vacant lots into fully maintained pocket parks with native flora and seating.",
    imageGradient: "from-lime-400 to-green-500",
    avatarLetter: "L",
    likes: 890,
    comments: 112,
    category: "Environment",
  },
];



const filterChips = [
  "Trending",
  "Latest",
  "Nearby",
  "Recommended",
  "Infrastructure",
  "Technology",
];

// --- Sub-Components ---

const StatCard = ({ stat }: { stat: StatData }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-none dark:hover:border-indigo-500/30 transition-all duration-300 flex items-center gap-4"
  >
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800 dark:to-slate-800/50 border border-indigo-100/50 dark:border-slate-700/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
      {stat.icon}
    </div>
    <div>
      <h4 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">
        {stat.title}
      </h4>
      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
        {stat.value}
      </p>
    </div>
  </motion.div>
);

const ExploreCard = ({ project }: { project: ProjectData }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -8 }}
    className="group bg-white dark:bg-slate-900 rounded-[1.5rem] p-3 border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/15 dark:hover:shadow-none dark:hover:border-indigo-500/40 transition-all duration-300 flex flex-col h-full"
  >
    {/* Image / Preview Area */}
    <div
      className={`w-full ${project.isFeatured ? "aspect-video" : "aspect-[4/3]"} rounded-2xl bg-gradient-to-br ${project.imageGradient} relative overflow-hidden flex items-center justify-center shadow-inner`}
    >
      <div className="absolute inset-0 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-700 ease-out mix-blend-overlay">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full fill-white"
        >
          <polygon points="0,100 100,0 100,100" />
          <circle cx="20" cy="20" r="30" />
        </svg>
      </div>

      {/* Category Badge */}
      <div className="absolute top-3 left-3 bg-white/20 dark:bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white font-bold tracking-wider uppercase text-[10px] shadow-sm">
        {project.category}
      </div>
    </div>

    {/* Content Area */}
    <div className="flex flex-col flex-1 px-2 pt-5 pb-2">
      <h3
        className={`font-bold text-slate-900 dark:text-white leading-tight mb-2 transition-colors ${project.isFeatured ? "text-xl" : "text-lg line-clamp-1"}`}
      >
        {project.title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-5 flex-1 leading-relaxed transition-colors">
        {project.description}
      </p>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 transition-colors mt-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold transition-colors">
            {project.avatarLetter}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
            {project.agency}
          </span>
        </div>

        <div className="flex items-center gap-3.5 text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="text-xs font-bold">{project.likes}</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

// --- Main Page Component ---

export default function Explore() {
  const [activeChip, setActiveChip] = useState("Trending");
  const featuredProjects = exploreData.filter((p) => p.isFeatured);
  const standardProjects = exploreData.filter((p) => !p.isFeatured);
  const { isLoggedIn } = useAuth();
const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col gap-12 pb-20 relative z-0">
      {/* Ambient Background Blobs */}
      <div className="absolute top-[-5%] right-1/4 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-emerald-400/10 dark:bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* 1. Hero & Search Section */}
      <section className="flex flex-col items-center text-center gap-6 pt-8 pb-4 max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            Explore Your
          </span>{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Community
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-2xl"
        >
          Discover breaking local projects, public infrastructure updates, and
          community-driven initiatives happening near you.
        </motion.p>

        {/* Premium Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full mt-4 relative group"
        >
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <svg
              className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-14 pr-16 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-2 border-slate-200/60 dark:border-slate-800/60 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-all duration-300 text-lg font-medium shadow-sm hover:shadow-md"
            placeholder="Search for projects, locations, or agencies..."
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className="text-xs font-bold text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 bg-slate-50 dark:bg-slate-800">
              ⌘K
            </span>
          </div>
        </motion.div>

        {/* Filter Chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2.5 mt-2"
        >
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${
                activeChip === chip
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-md transform scale-105"
                  : "bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white backdrop-blur-sm"
              }`}
            >
              {chip}
            </button>
          ))}
        </motion.div>
      </section>

      {/* 2. Quick Insights */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {exploreStats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
          >
            <StatCard stat={stat} />
          </motion.div>
        ))}
      </section>

      {/* 3. Featured Discovery Section */}
      <section className="flex flex-col gap-6 mt-4">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <svg
            className="w-6 h-6 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          Featured Discoveries
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {featuredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.5 + index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
            >
              <ExploreCard project={project} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Main Explore Grid */}
      <section className="flex flex-col gap-6 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            More to Explore
          </h2>
          <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            View All Categories →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {standardProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <ExploreCard project={project} />
            </motion.div>
          ))}
        </div>

        {/* Load More Action */}
       <div className="flex justify-center mt-10">
  <button 
    onClick={() => !isLoggedIn ? navigate('/login') : console.log('Load more API call')}
    className="px-8 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl text-sm font-extrabold text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
  >
    {isLoggedIn ? "Load More Results" : "Login to Load More Results"}
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
</div>
      </section>
    </div>
  );
}
