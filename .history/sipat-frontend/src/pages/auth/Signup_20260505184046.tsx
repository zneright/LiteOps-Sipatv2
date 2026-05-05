import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SipatLogo from "../../components/ui/SipatLogo";
import { useAuth } from "../../context/AuthContext";
// --- FIREBASE IMPORTS ---
import { auth } from "../../components/config/firebase"; // Adjust path if needed
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form State
  const [role, setRole] = useState<"citizen" | "agency">("citizen");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      // 1. Create the user securely in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Prepare the data for your CodeIgniter 4 PHP Backend
      const userData = {
        firebase_uid: user.uid,
        email: user.email,
        full_name: fullName,
        role: role,
        organization_name: role === "agency" ? organization : null,
        is_approved: role === "citizen" ? 1 : 0 // Citizens auto-approve, Agencies wait for Super Admin
      };

      // 3. Send data to CodeIgniter (We will build this PHP endpoint next)
      const response = await fetch("http://localhost:8080/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Failed to save to database.");
      }

      // 4. Log them in via Context
      login(user.email || "", role);

      // 5. Route based on role
      if (role === "agency") {
        // They need approval, but for the hackathon MVP, we can route them to a pending page or dashboard
        navigate("/agency/dashboard");
      } else {
        navigate("/home");
      }

    } catch (error: any) {
      console.error("Signup Failed:", error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("This email is already registered.");
      } else {
        setAuthError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center relative overflow-hidden transition-colors duration-300 z-0 py-12">
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-md w-full mx-auto px-4 sm:px-6 z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link to="/home" className="inline-flex items-center justify-center gap-2 mb-6 group">
            <SipatLogo className="w-10 h-10 transform group-hover:scale-105 transition-transform" />
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">SIPAT</span>
          </Link>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">Join the </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">community</span>
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/50 dark:shadow-none">

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center">
              {authError}
            </div>
          )}

          {/* ROLE SELECTOR TOGGLE */}
          <div className="flex p-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setRole("citizen")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === "citizen" ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              I am a Citizen
            </button>
            <button
              type="button"
              onClick={() => setRole("agency")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === "agency" ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              I represent an Agency
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 font-medium" placeholder="Juan Dela Cruz" />
            </div>

            {/* CONDITIONAL AGENCY INPUT */}
            <AnimatePresence>
              {role === "agency" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 mt-2">Organization / LGU Name</label>
                  <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} required={role === "agency"} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 font-medium" placeholder="e.g. DPWH Quezon City" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 font-medium" placeholder="juan@example.com" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 font-medium" placeholder="Create a strong password" />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md flex justify-center items-center">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  role === "agency" ? "Apply as Agency" : "Create Account"
                )}
              </button>
            </div>

            {role === "agency" && (
              <p className="text-[10px] text-amber-600 dark:text-amber-500 text-center font-bold">
                *Agency accounts require Super Admin approval before posting projects.
              </p>
            )}
          </form>
        </motion.div>

        <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400 font-medium">
          Already have an account?   <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}