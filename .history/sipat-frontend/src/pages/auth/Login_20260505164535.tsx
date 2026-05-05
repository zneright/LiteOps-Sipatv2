import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SipatLogo from "../../components/ui/SipatLogo";
import { useAuth } from "../../context/AuthContext"; // 1. IMPORT THE CONTEXT

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // 2. GRAB THE LOGIN FUNCTION
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // DETERMINE ROLE
    let assignedRole: "citizen" | "agency" | "admin" = "citizen";
    if (email === "admin@dpwh.gov.ph") assignedRole = "agency";
    else if (email === "superadmin@sipat.ph") assignedRole = "admin";

    // Simulate API call and Route based on Role
    setTimeout(() => {
      login(email, assignedRole);
      setIsLoading(false);
      
      // Dynamic Routing Magic!
      if (assignedRole === "admin") {
        navigate("/admin/dashboard");
      } else if (assignedRole === "agency") {
        navigate("/agency/dashboard");
      } else {
        navigate("/home");
      }
    }, 1500);
  };
  const handleDemoLogin = (role: "citizen" | "agency" | "admin") => {
    if (role === "citizen") {
      setEmail("juan.delacruz@gmail.com");
      setPassword("citizen_demo_2026");
    } else if (role === "agency") {
      setEmail("admin@dpwh.gov.ph");
      setPassword("agency_secure_pass_2026");
    } else {
      setEmail("superadmin@sipat.ph");
      setPassword("master_override_2026");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center relative overflow-hidden transition-colors duration-300 z-0">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-md w-full mx-auto px-4 sm:px-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
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

          {/* READABLE GRADIENT HEADER */}
          <h2 className="text-3xl font-black tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
              Welcome{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              back
            </span>
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm font-medium">
            Enter your details to access your dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/50 dark:shadow-none"
        >
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                placeholder="citizen@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
                >
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex justify-center items-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                "Sign In"
              )}
            </button>
          </form>

          {/* DEMO ACCESS SECTION */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mb-4">
              Demo Access
            </p>
            <div className="flex flex-col gap-3">
              {/* Primary Citizen Demo */}
              <button
                onClick={() => handleDemoLogin("citizen")}
                type="button"
                className="w-full px-4 py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/20"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Continue as Juan (Citizen)
              </button>

<div className="grid grid-cols-2 gap-3">
                {/* Agency Demo Button */}
                <button
                  onClick={() => handleDemoLogin("agency")}
                  type="button"
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-500/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Agency LGU
                </button>

                {/* Super Admin Demo Button */}
                <button
                  onClick={() => handleDemoLogin("admin")}
                  type="button"
                  className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-purple-200 dark:border-purple-500/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Super Admin
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <p className="text-center mt-8 text-sm text-slate-600 dark:text-slate-400 font-medium">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}