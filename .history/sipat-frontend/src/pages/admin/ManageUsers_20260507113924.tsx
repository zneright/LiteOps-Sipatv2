import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ManageUsers() {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"agency" | "citizen">("agency");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchUsers = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/users");
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

    // 🚀 Admin Action: Toggle Agency Approval Status
    const toggleApproval = async (firebaseUid: string, currentStatus: number | string | boolean) => {
        const newStatus = Number(currentStatus) === 1 ? 0 : 1;

        // Optimistic UI update
        setUsers(prev => prev.map(u => u.firebase_uid === firebaseUid ? { ...u, is_approved: newStatus } : u));

        try {
            await fetch(`http://localhost:8080/api/users/${firebaseUid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_approved: newStatus })
            });
        } catch (error) {
            console.error("Failed to update status", error);
            fetchUsers(); // Revert on fail
        }
    };

    // Filter users based on Tab and Search
    const filteredUsers = users.filter(u => {
        const matchesTab = u.role === activeTab;
        const searchTarget = (u.organization_name || u.full_name || u.email || "").toLowerCase();
        const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    if (isLoading) {
        return (
            <div className="w-full h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Database...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4 sm:px-6">

            {/* 🚀 Header & Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
                        User <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Management</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Approve official agencies and monitor citizen accounts.</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* 🚀 Tabs */}
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200/60">
                <button
                    onClick={() => setActiveTab("agency")}
                    className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === "agency" ? "bg-white text-purple-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900"}`}
                >
                    🏛️ Agencies
                </button>
                <button
                    onClick={() => setActiveTab("citizen")}
                    className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === "citizen" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900"}`}
                >
                    👤 Citizens
                </button>
            </div>

            {/* 🚀 Data Grid */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {filteredUsers.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <span className="text-5xl mb-4 opacity-50">📭</span>
                            <h3 className="text-lg font-black text-slate-900">No users found.</h3>
                            <p className="text-sm text-slate-500 mt-1">Adjust your search or check a different tab.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Account Details</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact / Email</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Registered</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Admin Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence>
                                    {filteredUsers.map((u) => {
                                        const isApproved = Number(u.is_approved) === 1;
                                        const name = activeTab === 'agency' ? u.organization_name : u.full_name;

                                        return (
                                            <motion.tr key={u.firebase_uid} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm border ${activeTab === 'agency' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                            {name ? name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 leading-tight">{name || "Unnamed Account"}</p>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">UID: {u.firebase_uid.substring(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-6 text-sm font-medium text-slate-600">
                                                    {u.email}
                                                </td>

                                                <td className="py-4 px-6 text-sm font-medium text-slate-500">
                                                    {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>

                                                <td className="py-4 px-6 text-center">
                                                    {activeTab === 'agency' ? (
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                            {isApproved ? "✓ Verified LGU" : "⏳ Pending"}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200">
                                                            ✓ Citizen
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-4 px-6 text-right">
                                                    {activeTab === 'agency' ? (
                                                        <button
                                                            onClick={() => toggleApproval(u.firebase_uid, u.is_approved)}
                                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${isApproved ? 'bg-white text-rose-500 border border-slate-200 hover:border-rose-200 hover:bg-rose-50' : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-500/20'}`}
                                                        >
                                                            {isApproved ? "Revoke Access" : "Approve Agency"}
                                                        </button>
                                                    ) : (
                                                        <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-400 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                                                            View Activity
                                                        </button>
                                                    )}
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
        </div>
    );
}