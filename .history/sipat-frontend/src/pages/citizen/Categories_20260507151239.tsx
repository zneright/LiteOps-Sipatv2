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

  useEffect(() => {
    const fetchAndCountCategories = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/projects");
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
    <div className="w-full flex flex-col gap-12 pb-24 pt-8">
      <section className="flex flex-col gap-6 items-center text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-6xl font-black tracking-tight"
        >
          <span className="text-slate-900 dark:text-white">
            Project{" "}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 drop-shadow-sm">
            Categories
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed"
        >
          Browse government commits organized by sector to find exactly what
          matters to your neighborhood.
        </motion.p>
      </section>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full py-32 flex justify-center items-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="h-16 w-16 border-4 border-indigo-100 dark:border-indigo-900/50 border-t-indigo-600 dark:border-t-indigo-500 rounded-full shadow-lg shadow-indigo-500/20"
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-8"
          >
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-slate-200/30 dark:shadow-none hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.05] transition-all duration-500 ease-in-out`}
                />
                <div
                  className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${cat.gradient} opacity-[0.05] group-hover:opacity-[0.15] blur-3xl rounded-full transition-all duration-500`}
                />

                <div className="relative z-10 flex-1 flex flex-col">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/20 mb-8 transform origin-center`}
                  >
                    {cat.icon}
                  </motion.div>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                    {cat.name}
                  </h3>

                  <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium leading-relaxed mb-8 flex-1">
                    {cat.description}
                  </p>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-auto relative">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                      </span>
                      <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                        {cat.count} Commits
                      </span>
                    </div>

                    <Link
                      to={`/explore?category=${cat.name}`}
                      className="p-3.5 rounded-full bg-slate-50 dark:bg-slate-800/80 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all duration-300 shadow-sm group-hover:shadow-indigo-500/30"
                    >
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform duration-300"
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
  );
}