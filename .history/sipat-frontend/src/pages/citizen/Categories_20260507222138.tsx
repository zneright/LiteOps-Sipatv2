import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  count: number;
  description: string;
  icon: string;
  gradient: string;
}

const categoryMetadata: Omit<Category, "count">[] = [
  { id: "1", name: "Infrastructure", description: "Roads, bridges, and public works updates.", icon: "🏗️", gradient: "from-blue-500 to-indigo-600" },
  { id: "2", name: "Technology", description: "Digital transformation and smart city initiatives.", icon: "⚡", gradient: "from-violet-500 to-purple-600" },
  { id: "3", name: "Environment", description: "Flood control, parks, and green energy.", icon: "🌿", gradient: "from-emerald-500 to-teal-600" },
  { id: "4", name: "Healthcare", description: "Clinic upgrades and public health programs.", icon: "🏥", gradient: "from-rose-500 to-orange-500" },
  { id: "5", name: "Education", description: "School building repairs and digital learning.", icon: "🎓", gradient: "from-cyan-500 to-blue-500" },
  { id: "6", name: "Transport", description: "Traffic management and public transit commits.", icon: "🚌", gradient: "from-orange-500 to-amber-500" },
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  useEffect(() => {
    const fetchAndCountCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");

        const projects = await response.json();

        const categoryCounts: Record<string, number> = {};
        projects.forEach((project: any) => {
          const catName = project.category;
          if (catName) {
            categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
          }
        });

        const mergedCategories = categoryMetadata.map((meta) => ({
          ...meta,
          count: categoryCounts[meta.name] || 0,
        }));

        setCategories(mergedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);

        const fallback = categoryMetadata.map((meta) => ({ ...meta, count: 0 }));
        setCategories(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndCountCategories();
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col gap-10 md:gap-14 pb-24 pt-10 relative overflow-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none -z-20">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 18, ease: "linear" }} className="absolute top-[20%] right-[-10%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-purple-500/10 dark:bg-purple-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="max-w-[90rem] mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col gap-10 md:gap-14">
        <section className="flex flex-col gap-6 items-center text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, type: "spring", bounce: 0.4 }} className="inline-flex items-center gap-2.5 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 shadow-sm text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-300">
            <div className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            </div>
            Project Directory
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, type: "spring", bounce: 0.4 }}
            className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] drop-shadow-sm px-2"
          >
            <span className="text-slate-900 dark:text-white block md:inline">Project </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 block md:inline">Categories</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-slate-500 dark:text-slate-400 text-sm md:text-lg max-w-xl font-medium leading-relaxed px-4"
          >
            Browse government commits organized by sector to find exactly what matters to your neighborhood.
          </motion.p>
        </section>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              className="w-full py-20 md:py-32 flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 rounded-full border-t-4 border-indigo-500 opacity-30"></motion.div>
                <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="h-14 w-14 md:h-16 md:w-16 rounded-full border-l-4 border-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]"></motion.div>
              </div>
              <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Loading Sectors...</motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10"
            >
              {categories.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: idx * 0.08,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/80 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_20px_40px_rgba(99,102,241,0.1)] transition-all duration-500 overflow-hidden flex flex-col transform-gpu hover:-translate-y-2"
                >
                  <div
                    className={`absolute inset - 0 bg - gradient - to - br ${ cat.gradient } opacity - 0 group - hover: opacity - [0.03] dark: group - hover: opacity - [0.05] transition - opacity duration - 500 ease -in -out pointer - events - none`}
                  />
                  <div
                    className={`absolute - top - 24 - right - 24 w - 48 h - 48 bg - gradient - to - br ${ cat.gradient } opacity - [0.05] group - hover: opacity - [0.15] blur - 3xl rounded - full transition - all duration - 700 pointer - events - none`}
                  />

                  <div className="relative z-10 flex-1 flex flex-col">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`w - 14 h - 14 md: w - 16 md: h - 16 rounded - [1.25rem] bg - gradient - to - br ${ cat.gradient } flex items - center justify - center text - 2xl md: text - 3xl shadow - lg shadow - indigo - 500 / 20 mb - 6 md: mb - 8 transform origin - center cursor -default `}
                    >
                      {cat.icon}
                    </motion.div>

                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 md:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 transition-all duration-300">
                      {cat.name}
                    </h3>

                    <p className="text-slate-500 dark:text-slate-400 text-[13px] md:text-[15px] font-medium leading-relaxed mb-6 md:mb-8 flex-1">
                      {cat.description}
                    </p>

                    <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-auto relative">
                      <div className="flex items-center gap-2.5 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="text-[11px] md:text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                          {cat.count} Commits
                        </span>
                      </div>

                      <Link
                        to={`/ explore ? category = ${ cat.name }`}
                        className="p-3 md:p-3.5 rounded-[1rem] bg-white dark:bg-slate-800 text-slate-400 group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-slate-200 dark:border-slate-700 group-hover:border-transparent"
                      >
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5 transform group-hover:translate-x-0.5 transition-transform duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}