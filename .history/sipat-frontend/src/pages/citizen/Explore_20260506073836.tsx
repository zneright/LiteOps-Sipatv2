import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Project {
  id: number;
  title: string;
  category: string;
  budget: string;
  description: string;
  created_at: string;
  file_url: string;
}

export default function Explore() {
  // 1. Grab the ?category=X from the URL
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");

        const allProjects = await response.json();

        // 2. Filter the projects if a category is selected in the URL
        let filteredProjects = allProjects;
        if (selectedCategory) {
          filteredProjects = allProjects.filter(
            (p: Project) => p.category === selectedCategory
          );
        }

        // Note: CodeIgniter already sorted them by 'created_at' DESC, 
        // so the most recent is already at the top!
        setProjects(filteredProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [selectedCategory]); // Re-run if the URL parameter changes

  // Helper to format the date nicely
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8">

      {/* Header & Back Button */}
      <div className="flex flex-col gap-4">
        <Link
          to="/agency/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Categories
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white"
        >
          {selectedCategory ? `${selectedCategory} Projects` : "All Projects"}
        </motion.h1>
        <p className="text-slate-500 font-medium">
          Showing the most recent updates and commits.
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="w-full py-20 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      ) : projects.length === 0 ? (

        /* Empty State */
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No projects found</h3>
          <p className="text-slate-500 text-sm">There are no documented projects in this category yet.</p>
        </div>

      ) : (

        /* Project Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Document/Image Preview Header */}
              <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                {project.file_url ? (
                  project.file_url.endsWith('.pdf') ? (
                    <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-400 font-black text-2xl">PDF Document</div>
                  ) : (
                    <img src={project.file_url} alt={project.title} className="w-full h-full object-cover opacity-90" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                )}

                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-slate-800 uppercase tracking-wider shadow-sm">
                  {project.category}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-grow gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                    {project.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
                    Published: {formatDate(project.created_at)}
                  </p>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-grow">
                  {project.description}
                </p>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Budget</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₱{project.budget}</span>
                  </div>

                  {/* You can point this to a detailed project view later */}
                  <button className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 text-xs font-bold rounded-xl transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}