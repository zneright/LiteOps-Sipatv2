import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SipatLogo from "../../components/ui/SipatLogo";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../components/config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo
} from "firebase/auth";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState<"citizen" | "agency">("citizen");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        firebase_uid: user.uid,
        email: user.email,
        full_name: fullName,
        role: role,
        organization_name: role === "agency" ? organization : null,
        is_approved: role === "citizen" ? 1 : 0
      };

      const response = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        await user.delete();
        throw new Error("Failed to save to database.");
      }

      login({
        email: user.email || "",
        role: role,
        name: role === "agency" ? organization : fullName
      });

      navigate(`/${role}/dashboard`);

    } catch (error: any) {
      console.error("Signup Failed:", error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("This email is already registered. Try logging in.");
      } else {
        setAuthError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (role === "agency" && !organization.trim()) {
      setAuthError("Please enter your Organization / LGU Name above before signing up with Google.");
      return;
    }

    setIsLoading(true);
    setAuthError("");

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const additionalInfo = getAdditionalUserInfo(userCredential);

      if (additionalInfo?.isNewUser) {
        const userData = {
          firebase_uid: user.uid,
          email: user.email,
          full_name: user.displayName || "Google User",
          role: role,
          organization_name: role === "agency" ? organization : null,
          is_approved: role === "citizen" ? 1 : 0
        };

        const response = await fetch(`${API_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          await user.delete();
          throw new Error("Failed to save user to database.");
        }

        login({
          email: user.email || "",
          role: role,
          name: role === "agency" ? organization : (user.displayName || "Google User")
        });

        navigate(`/${role}/dashboard`);

      } else {
        setAuthError("This Google account is already registered. Please go to Sign In.");
      }

    } catch (error: any) {
      console.error("Google Signup Failed:", error);
      setAuthError("Failed to sign up with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col justify-center relative overflow-hidden transition-colors duration-500 py-12 selection:bg-indigo-500/30">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-screen" />

      <div className="max-w-md w-full mx-auto px-4 sm:px-6 z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="text-center mb-10">
          <Link to="/home" className="inline-flex items-center justify-center gap-3 mb-6 group">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
              <SipatLogo className="w-8 h-8" />
            </div>
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">SIPAT</span>
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight mb-3">
            <span className="text-slate-900 dark:text-white">Join the </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">community</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Create your account to get started.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800/50 shadow-2xl shadow-indigo-500/5 dark:shadow-none">

          {authError && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold text-center flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {authError}
            </motion.div>
          )}

          <div className="flex p-1.5 mb-8 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setRole("citizen")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${role === "citizen" ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => setRole("agency")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${role === "agency" ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              Agency
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-600" placeholder="Juan Dela Cruz" />
            </div>

            <AnimatePresence>
              {role === "agency" && (
                <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: "1.25rem" }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="overflow-hidden">
                  <div className="space-y-1.5 pb-1">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Organization / LGU</label>
                    <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} required={role === "agency"} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-600" placeholder="e.g. DPWH Quezon City" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-600" placeholder="juan@example.com" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-600" placeholder="••••••••" />
            </div>

            <div className="pt-4">
              <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  role === "agency" ? "Apply as Agency" : "Create Account"
                )}
              </button>
            </div>

            {role === "agency" && (
              <p className="text-xs text-amber-600 dark:text-amber-500/90 text-center font-medium bg-amber-50 dark:bg-amber-500/10 py-2.5 px-4 rounded-xl">
                Agency accounts require Super Admin approval before posting projects.
              </p>
            )}
          </form>

          <div className="mt-8 flex items-center justify-center gap-4 relative z-10">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Or continue with</span>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          </div>

          <div className="mt-8 relative z-10">
            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              type="button"
              className="w-full py-4 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-semibold text-[15px] transition-all duration-300 flex justify-center items-center gap-3 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </div>

        </motion.div>

        <p className="text-center mt-8 text-[15px] text-slate-500 dark:text-slate-400 font-medium">
          Already have an account? &nbsp;
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}