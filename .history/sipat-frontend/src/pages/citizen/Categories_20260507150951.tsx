import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
};

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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl md:text-6xl font-black tracking-tight"
        >
          <span className="text-slate-900 dark:text-white">
            Project{" "}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
            Categories
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed"
        >
          Browse government commits organized by sector to find exactly what
          matters to your neighborhood.
        </motion.p>
      </section>

      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full py-32 flex justify-center items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-14 w-14 border-4 border-indigo-100 dark:border-indigo-900/50 border-t-indigo-600 dark:border-t-indigo-400 rounded-full"
          />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-8"
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-slate-200/20 dark:shadow-none hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.05] transition-opacity duration-500`}
              />

              <div className="relative z-10 flex-1 flex flex-col">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/20 mb-8`}
                >
                  {cat.icon}
                </motion.div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  {cat.name}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium leading-relaxed mb-8 flex-1">
                  {cat.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                      {cat.count} Commits
                    </span>
                  </div>

                  <Link
                    to={`/explore?category=${cat.name}`}
                    className="p-3 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300"
                  >
                    <svg
                      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
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
    </div>
  );
}