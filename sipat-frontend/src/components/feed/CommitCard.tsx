import React, { useState } from "react";
import { motion } from "framer-motion";
import ProgressBar from "./ProgressBar";

export interface CommitCardProps {
  id?: string | number;
  agency: string;
  project: string;
  summary: string;
  progress: number;
  tags: string[];
  timeAgo: string;
  initialUpvotes?: number;
}

export default function CommitCard({
  agency,
  project,
  summary,
  progress,
  tags,
  timeAgo,
  initialUpvotes = 0,
}: CommitCardProps) {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [upvotes, setUpvotes] = useState(initialUpvotes);

  const handleAcknowledge = () => {
    setIsAcknowledged(!isAcknowledged);
    setUpvotes((prev) => (isAcknowledged ? prev - 1 : prev + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      className="group w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:hover:shadow-none transition-all duration-300 relative overflow-hidden"
    >
      {/* Subtle Glassmorphism Gradient Background on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/40 group-hover:to-transparent dark:group-hover:from-indigo-900/10 transition-colors duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Header: Avatar, Agency, and Time */}
        <div className="flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shadow-inner border border-indigo-100/50 dark:border-indigo-500/20">
              {agency.charAt(0)}
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {agency}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {timeAgo}
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            Commit
          </span>
        </div>

        {/* Main Content: Title and Summary */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {project}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {summary}
          </p>
        </div>

        {/* AI Tags */}
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-indigo-100 dark:border-indigo-500/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Progress Component Integration */}
        <div className="pt-2">
          <ProgressBar progress={progress} label="Completion Status" />
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAcknowledge}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              isAcknowledged
                ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                : "bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={isAcknowledged ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            Acknowledge ({upvotes})
          </motion.button>

          {/* Verification Avatars (Community Feel) */}
          <div className="flex -space-x-2.5 items-center">
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 shadow-sm" />
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-600 shadow-sm" />
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm z-10">
              +{upvotes > 2 ? upvotes - 2 : 0}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
