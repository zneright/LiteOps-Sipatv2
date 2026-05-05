import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SipatLogo from "../../components/ui/SipatLogo";

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/home");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center relative overflow-hidden transition-colors duration-300 z-0 py-12">
      {/* Ambient Background Blobs */}
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-md w-full mx-auto px-4 sm:px-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link
            to="/home"
            className="inline-flex items-center justify-center gap-2 mb-6 group"
          >
            <SipatLogo className="w-10 h-10 transform group-hover:scale-105 transition-transform" />
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              SIPAT
            </span>
          </Link>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
              Join the{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              community
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Start verifying local infrastructure updates today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/50 dark:shadow-none"
        >
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 font-medium"
                placeholder="Juan Dela Cruz"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 font-medium"
                placeholder="juan@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 font-medium"
                placeholder="Create a strong password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 flex justify-center items-center"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
              By signing up, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </form>
        </motion.div>

        <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400 font-medium">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
