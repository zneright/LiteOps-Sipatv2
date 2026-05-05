import React from "react";
import { motion } from "framer-motion";

export default function Profile() {
  return (
    <div className="w-full flex flex-col gap-8 pb-20">
      {/* Profile Header */}
      <section className="relative rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-8 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10 dark:opacity-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="w-32 h-32 rounded-[2rem] bg-indigo-600 border-4 border-white dark:border-slate-950 flex items-center justify-center text-4xl font-black text-white shadow-xl">
            C
          </div>
          <div className="flex-1 text-center md:text-left pb-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                Guest Citizen
              </h1>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-200 dark:border-emerald-500/30">
                Verified
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Citizen Developer • Malabon City
            </p>
          </div>
          <button className="mb-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:scale-105 transition-transform">
            Edit Profile
          </button>
        </div>
      </section>

      {/* Contribution Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Reports Verified", value: "24", icon: "✅" },
          { label: "Community Commits", value: "142", icon: "🚀" },
          { label: "Trust Score", value: "98%", icon: "💎" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-4"
          >
            <div className="text-2xl">{stat.icon}</div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
