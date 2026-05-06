import React from "react";
import { motion } from "framer-motion";

export default function Saved() {
  return (
    <div className="w-full flex flex-col gap-10 pb-20">
      <section className="flex flex-col gap-3">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          Saved Projects
        </motion.h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
          Quickly access the initiatives and updates you are currently tracking.
        </p>
      </section>

      {/* Empty State or Grid logic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* We can map through saved items here. 
            For now, showing a "Wow" empty state if no items are found. */}
        <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4">
            🔖
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Your collection is empty
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Start saving projects from the Explore page.
          </p>
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
            Browse Projects
          </button>
        </div>
      </div>
    </div>
  );
}
