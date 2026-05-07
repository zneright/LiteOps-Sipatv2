import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SipatLogo from "../../components/ui/SipatLogo";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../components/config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from "firebase/auth";

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

      const response = await fetch("http://localhost:8080/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userData),
      });

      if (!response.ok) { await user.delete(); throw new Error("Failed to save to database."); }

      login({ email: user.email || "", role: role, name: role === "agency" ? organization : fullName });
      navigate(`/${role}/dashboard`);

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') setAuthError("This email is already registered. Try logging in.");
      else setAuthError("Failed to create account. Please try again.");
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

        const response = await fetch("http://localhost:8080/api/users", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userData),
        });

        if (!response.ok) { await user.delete(); throw new Error("Failed to save user to database."); }

        login({ email: user.email || "", role: role, name: role === "agency" ? organization : (user.displayName || "Google User") });
        navigate(`/${role}/dashboard`);
      } else {
        setAuthError("This Google account is already registered. Please go to Sign In.");
      }

    } catch (error: any) {
      setAuthError("Failed to sign up with Google.");
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

          {authError && (<div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold text-center border border-red-200">{authError}</div>)}

          <div className="flex p-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button type="button" onClick={() => setRole("citizen")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === "citizen" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>I am a Citizen</button>
            <button type="button" onClick={() => setRole("agency")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === "agency" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>I represent an Agency</button>
          </div>

          <form onSubmit={handleSignup} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50" placeholder="Juan Dela Cruz" />
            </div>

            <AnimatePresence>
              {role === "agency" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 mt-2">Organization / LGU Name</label>
                  <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} required={role === "agency"} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. DPWH Quezon City" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50" placeholder="juan@example.com" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50" placeholder="Create a strong password" />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md flex justify-center items-center">
                {isLoading ? <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (role === "agency" ? "Apply as Agency" : "Create Account")}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4 relative z-10"><div className="h-px bg-slate-200 flex-1"></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">OR</span><div className="h-px bg-slate-200 flex-1"></div></div>

          <div className="mt-6 relative z-10">
            <button onClick={handleGoogleSignup} disabled={isLoading} type="button" className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all duration-300 flex justify-center items-center gap-3 shadow-sm hover:shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Sign Up with Google
            </button>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center mt-8 text-sm text-slate-500 font-medium">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
        </motion.p>
      </div>
    </div>
  );
}