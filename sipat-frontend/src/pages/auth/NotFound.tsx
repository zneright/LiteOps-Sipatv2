import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="text-center px-4 z-10 flex flex-col items-center">
        {/* Animated 404 Text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative"
        >
          <h1 className="text-[12rem] md:text-[16rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 select-none drop-shadow-sm">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
              File Missing
            </span>
          </div>
        </motion.div>

        {/* Supportive Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 max-w-md"
        >
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
            Looks like this project document got lost in the bureaucracy. We
            couldn't find the page you're looking for.
          </p>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <Link
            to="/home"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300"
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
                strokeWidth={2.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
