import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function SystemLogs() {
    const [searchParams] = useSearchParams();
    const targetEmail = searchParams.get("email");

    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRealLogs = async () => {
            try {
                const response = await fetch("http://localhost:8080/api/logs");
                if (!response.ok) throw new Error("Failed to fetch DB logs");
                const allLogs = await response.json();

                let filteredLogs = allLogs;

                // 🚀 If viewing a specific user's activity from the Manage Users page
                if (targetEmail) {
                    filteredLogs = allLogs.filter((log: any) =>
                        log.actor_email?.toLowerCase() === targetEmail.toLowerCase()
                    );
                }

                setLogs(filteredLogs);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRealLogs();
    }, [targetEmail]);

    // 🚀 Map action types to UI styles
    const getLogUI = (type: string, description: string) => {
        const t = (type || "").toUpperCase();
        const desc = description.toLowerCase();

        if (t === "REGISTER") return { icon: "📝", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
        if (t === "LOGIN") return { icon: "🔐", color: "text-blue-600 bg-blue-50 border-blue-200" };
        if (t === "PROJECT") return { icon: "🏗️", color: "text-purple-600 bg-purple-50 border-purple-200" };
        if (t === "COMMENT" && desc.includes("anonymous")) return { icon: "🕵️‍♂️", color: "text-rose-600 bg-rose-50 border-rose-200 shadow-rose-500/20" };
        if (t === "COMMENT") return { icon: "📸", color: "text-amber-600 bg-amber-50 border-amber-200" };

        return { icon: "⚡", color: "text-slate-600 bg-slate-50 border-slate-200" };
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4 sm:px-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back to User Management
                    </Link>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Audit Logs</span>
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {targetEmail ? `Viewing isolated activity for: ${targetEmail}` : "Global chronological database activity."}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 min-h-[500px]">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div></div>
                ) : logs.length === 0 ? (
                    <div className="py-32 flex flex-col items-center text-center">
                        <span className="text-6xl mb-4 block opacity-50">📭</span>
                        <h3 className="text-xl font-black text-slate-900">No activity recorded.</h3>
                        <p className="text-sm text-slate-500">The database log is empty for this query.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-100 ml-4 sm:ml-8 space-y-8 pb-4">
                        {logs.map((log, i) => {
                            const ui = getLogUI(log.action_type, log.description);
                            const isAnonymized = log.description.includes("ANONYMOUS");

                            return (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={log.id} className="relative pl-6 sm:pl-8">

                                    {/* Timeline Node */}
                                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-xs shadow-sm ${ui.color}`}>
                                        {ui.icon}
                                    </div>

                                    {/* Card Content */}
                                    <div className={`transition-colors p-5 rounded-2xl border ${isAnonymized ? 'bg-rose-50/50 border-rose-100 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-900 text-base">{log.actor_name}</span>
                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md">{log.actor_role}</span>
                                                {isAnonymized && <span className="px-2 py-0.5 bg-rose-200 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-md animate-pulse">Unmasked</span>}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(log.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium">
                                            {log.description}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-2 font-mono">ID: {log.actor_email}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}