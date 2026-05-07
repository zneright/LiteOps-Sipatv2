import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function SystemLogs() {
    const [searchParams] = useSearchParams();
    const targetEmail = searchParams.get("email");

    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllActivity = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    fetch("http://localhost:8080/api/projects"),
                    fetch("http://localhost:8080/api/comments/all") // Note: Assuming you have a route to get all comments, or we can just fetch projects for now if you don't. For this demo, let's fetch projects and users to generate logs.
                ]);

                const allProjects = await pRes.json();

                // 🚀 Compile a Master Timeline Log
                let masterLogs: any[] = [];

                // Add Project Publishing Logs
                allProjects.forEach((p: any) => {
                    masterLogs.push({
                        id: `proj_${p.id}`,
                        type: 'project',
                        action: 'Published a new infrastructure project',
                        target: p.title,
                        actor_email: p.organization_name, // Agencies use org name as identifier mostly
                        actor_name: p.organization_name || 'DPWH',
                        date: new Date(p.created_at),
                        icon: '🏗️',
                        color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
                    });
                });

                // 🚀 Sort by newest first
                masterLogs.sort((a, b) => b.date.getTime() - a.date.getTime());

                // 🚀 Filter if an email/name was passed from the Manage Users page
                if (targetEmail) {
                    masterLogs = masterLogs.filter(log =>
                        log.actor_email?.toLowerCase() === targetEmail.toLowerCase() ||
                        log.actor_name?.toLowerCase() === targetEmail.toLowerCase()
                    );
                }

                setLogs(masterLogs);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllActivity();
    }, [targetEmail]);

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back to User Management
                    </Link>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Audit Logs</span>
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {targetEmail ? `Viewing isolated activity for: ${targetEmail}` : "Global chronological platform activity."}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div></div>
                ) : logs.length === 0 ? (
                    <div className="py-20 text-center">
                        <span className="text-5xl mb-4 block opacity-50">📭</span>
                        <h3 className="text-lg font-black text-slate-900">No activity recorded.</h3>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-100 ml-4 sm:ml-8 space-y-8 pb-4">
                        {logs.map((log, i) => (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={log.id} className="relative pl-6 sm:pl-8">
                                {/* Timeline Node */}
                                <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-xs shadow-sm ${log.color}`}>
                                    {log.icon}
                                </div>
                                <div className="bg-slate-50 hover:bg-slate-100 transition-colors p-5 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <span className="font-black text-slate-900">{log.actor_name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.date.toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        {log.action} <strong className="text-purple-600">{log.target}</strong>
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}