import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ManageUsers() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"agency" | "citizen">("citizen");
    const [searchQuery, setSearchQuery] = useState("");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/users");
            if (!response.ok) throw new Error("Failed to fetch users");
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleDeactivation = async (firebaseUid: string, currentStatus: number | string | boolean) => {
        const isCurrentlyActive = currentStatus === undefined || Number(currentStatus) === 1;
        const newStatus = isCurrentlyActive ? 0 : 1;

        setUsers(prev => prev.map(u => u.firebase_uid === firebaseUid ? { ...u, is_active: newStatus } : u));

        try {
            await fetch(`http://localhost:8080/api/users/toggle-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firebase_uid: firebaseUid, is_active: newStatus })
            });
        } catch (error) {
            console.error("Failed to update status", error);
            fetchUsers();
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesTab = u.role === activeTab;
        const searchTarget = (u.organization_name || u.full_name || u.email || "").toLowerCase();
        const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const totalCitizens = users.filter(u => u.role === 'citizen').length;
    const totalAgencies = users.filter(u => u.role === 'agency').length;
    const deactivatedCount = users.filter(u => Number(u.is_active) === 0).length;

    if (isLoading) {
        return (
            <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-6 bg-transparent">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-12 w-12 border-4 border-purple-600/20 border-t-purple-600 dark:border-purple-400/20 dark:border-t-purple-400 rounded-full"
                />
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                    className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                >
                    Loading Database...
                </motion.p>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 pb-24 pt-6 px-4 sm:px-6 lg:px-8"
        >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <motion.div variants={itemVariants} className="space-y-2">
                    <Link to="/admin/dashboard" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4">
                        <motion.svg whileHover={{ x: -3 }} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></motion.svg>
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">
                        User <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400">Management</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-base sm:text-lg">Monitor activity, assign trust badges, and moderate accounts.</p>
                </motion.div>

                <motion.div variants={itemVariants} className="relative w-full lg:w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all shadow-sm hover:shadow-md dark:shadow-none"
                    />
                </motion.div>
            </div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <motion.div whileHover={{ y: -4 }} className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[2rem] p-6 flex items-center justify-between transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div>
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1.5">Total Users</p>
                        <p className="text-3xl sm:text-4xl font-black text-indigo-700 dark:text-indigo-300">{users.length}</p>
                    </div>
                    <div className="text-4xl sm:text-5xl opacity-50 drop-shadow-sm">🌍</div>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[2rem] p-6 flex items-center justify-between transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div>
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-1.5">Registered Citizens</p>
                        <p className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-300">{totalCitizens}</p>
                    </div>
                    <div className="text-4xl sm:text-5xl opacity-50 drop-shadow-sm">👤</div>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[2rem] p-6 flex items-center justify-between transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div>
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1.5">Official Agencies</p>
                        <p className="text-3xl sm:text-4xl font-black text-blue-700 dark:text-blue-300">{totalAgencies}</p>
                    </div>
                    <div className="text-4xl sm:text-5xl opacity-50 drop-shadow-sm">🏛️</div>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-[2rem] p-6 flex items-center justify-between transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div>
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 mb-1.5">Deactivated Accounts</p>
                        <p className="text-3xl sm:text-4xl font-black text-rose-700 dark:text-rose-300">{deactivatedCount}</p>
                    </div>
                    <div className="text-4xl sm:text-5xl opacity-50 drop-shadow-sm">🚨</div>
                </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto custom-scrollbar shadow-inner">
                <button
                    onClick={() => setActiveTab("citizen")}
                    className={`flex-1 sm:flex-none px-6 sm:px-10 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "citizen" ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/30 dark:hover:bg-slate-700/30"}`}
                >
                    👤 Citizens
                </button>
                <button
                    onClick={() => setActiveTab("agency")}
                    className={`flex-1 sm:flex-none px-6 sm:px-10 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "agency" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/30 dark:hover:bg-slate-700/30"}`}
                >
                    🏛️ Agencies
                </button>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    {filteredUsers.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-24 flex flex-col items-center justify-center text-center"
                        >
                            <span className="text-6xl mb-6 opacity-40 drop-shadow-sm">📭</span>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">No users found.</h3>
                            <p className="text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">Adjust your search or check a different tab.</p>
                        </motion.div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Account Details</th>
                                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Contact</th>
                                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">Platform Trust</th>
                                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">Status</th>
                                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Admin Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                <AnimatePresence>
                                    {filteredUsers.map((u) => {
                                        const isActive = u.is_active === undefined || Number(u.is_active) === 1;
                                        const name = activeTab === 'agency' ? u.organization_name : u.full_name;

                                        return (
                                            <motion.tr
                                                key={u.firebase_uid}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-300 group"
                                            >
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-sm border transition-transform duration-300 group-hover:scale-105 ${activeTab === 'agency' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'}`}>
                                                            {name ? name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white leading-tight text-base">{name || "Unnamed Account"}</p>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">UID: {u.firebase_uid.substring(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-5 px-6 text-sm font-medium text-slate-600 dark:text-slate-300">
                                                    {u.email}
                                                </td>

                                                <td className="py-5 px-6 text-center">
                                                    {activeTab === 'agency' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-sm dark:shadow-none">
                                                            🏛️ Verified LGU
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 shadow-sm dark:shadow-none">
                                                            🛡️ Trusted Citizen
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-5 px-6 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm dark:shadow-none ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'}`}>
                                                        {isActive ? (
                                                            <>
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                                </span>
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                                                Deactivated
                                                            </>
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="py-5 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => navigate(`/admin/logs?email=${encodeURIComponent(u.email || name)}`)}
                                                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors border border-transparent hover:border-purple-200 dark:hover:border-purple-500/30"
                                                        >
                                                            View Activity
                                                        </motion.button>

                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => toggleDeactivation(u.firebase_uid, u.is_active)}
                                                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isActive ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200/60 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/50 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white border border-transparent'}`}
                                                        >
                                                            {isActive ? "Deactivate" : "Reactivate"}
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}