import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-6 mt-10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span>© {new Date().getFullYear()} Sipat. All rights reserved.</span>

        <div className="flex gap-4">
          <a
            href="#"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Privacy
          </a>
          <a
            href="#"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Terms
          </a>
          <a
            href="#"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Help
          </a>
        </div>
      </div>
    </footer>
  );
}
