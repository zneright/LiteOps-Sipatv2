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
    <div className="w-full flex flex-col gap-10 pb-20">
      <section className="flex flex-col gap-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black tracking-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
            Project{" "}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Categories
          </span>
        </motion.h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
          Browse government commits organized by sector to find exactly what
          matters to your neighborhood.
        </p>
      </section>

      {isLoading ? (
        <div className="w-full py-20 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden"
            >
              {/* Background Accent */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cat.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}
              />

              <div className="relative z-10">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl shadow-lg mb-6 shadow-indigo-500/20`}
                >
                  {cat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {cat.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">
                  {cat.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {cat.count} Commits
                  </span>
                  <Link
                    to={`/explore?category=${cat.name}`}
                    className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
