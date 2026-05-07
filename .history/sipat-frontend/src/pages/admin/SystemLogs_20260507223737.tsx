import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function SystemLogs() {
    const [searchParams] = useSearchParams();
    const targetEmail = searchParams.get("email");

    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printSettings, setPrintSettings] = useState({
        withLogo: true,
        paperSize: "a4",
        orientation: "landscape",
        pageNumbers: true
    });
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    useEffect(() => {
        const fetchRealLogs = async () => {
            try {
                const response = await fetch(`${API_URL}/api/logs`);
                if (!response.ok) throw new Error("Failed to fetch DB logs");
                const allLogs = await response.json();

                let filteredLogs = allLogs;
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

    const displayedLogs = useMemo(() => {
        return logs.filter(log => {
            if (roleFilter !== "ALL" && (log.actor_role || "").toUpperCase() !== roleFilter) return false;

            if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase();
                const nameMatch = (log.actor_name || "").toLowerCase().includes(query);
                const roleMatch = (log.actor_role || "").toLowerCase().includes(query);
                const emailMatch = (log.actor_email || "").toLowerCase().includes(query);

                if (!nameMatch && !roleMatch && !emailMatch) return false;
            }

            const logDate = new Date(log.created_at).getTime();
            const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
            const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity;

            if (logDate < start || logDate > end) return false;

            return true;
        });
    }, [logs, roleFilter, searchQuery, dateRange]);

    const getLogUI = (type: string, description: string) => {
        const t = (type || "").toUpperCase();
        const desc = (description || "").toLowerCase();

        if (t === "REGISTER") return { icon: "📝", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" };
        if (t === "LOGIN") return { icon: "🔐", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" };
        if (t === "PROJECT") return { icon: "🏗️", color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400" };
        if (t === "COMMENT" && desc.includes("anonymous")) return { icon: "🕵️‍♂️", color: "text-rose-600 bg-rose-50 border-rose-200 shadow-rose-500/20 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:shadow-none" };
        if (t === "COMMENT") return { icon: "📸", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400" };

        return { icon: "⚡", color: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" };
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const handleGeneratePDF = () => {
        setShowPrintModal(false);

        const doc = new jsPDF({
            orientation: printSettings.orientation as "portrait" | "landscape",
            unit: "pt",
            format: printSettings.paperSize
        });

        let startY = 40;

        if (printSettings.withLogo) {
            doc.setFillColor(147, 51, 234);
            doc.roundedRect(40, startY, 30, 30, 5, 5, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("A", 49, startY + 21);

            startY += 10;
        }

        const titleX = printSettings.withLogo ? 85 : 40;
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("System Audit Logs", titleX, startY + 12);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        const subtitle = targetEmail ? `Isolated Activity Report: ${targetEmail}` : "Filtered Database Activity Report";
        doc.text(`${subtitle} | Generated: ${new Date().toLocaleString()}`, titleX, startY + 28);

        const tableColumns = ["Date & Time", "User Name", "Email Address", "Role", "Action Type", "Description"];
        const tableRows = displayedLogs.map(log => [
            formatDate(log.created_at),
            log.actor_name,
            log.actor_email,
            log.actor_role,
            log.action_type,
            log.description
        ]);

        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: printSettings.withLogo ? 95 : 80,
            theme: 'striped',
            headStyles: {
                fillColor: [147, 51, 234],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 9, cellPadding: 6 },
            didDrawPage: function (data) {
                if (printSettings.pageNumbers) {
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(100, 116, 139);
                    doc.text(
                        `Page ${pageCount}`,
                        data.settings.margin.left,
                        doc.internal.pageSize.height - 15
                    );
                }
            }
        });

        const filename = targetEmail ? `Audit_Logs_${targetEmail.split('@')[0]}.pdf` : `Filtered_Audit_Logs.pdf`;
        doc.save(filename);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 pb-24 pt-6 px-4 sm:px-6 lg:px-8"
        >

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <Link to="/admin/users" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4">
                        <motion.svg whileHover={{ x: -3 }} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></motion.svg>
                        Back
                    </Link>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400">Audit Logs</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-base sm:text-lg">
                        {targetEmail ? `Viewing isolated activity for: ${targetEmail} ` : "Track platform usage by Citizen or Agency."}
                    </p>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPrintModal(true)}
                    disabled={displayedLogs.length === 0}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export Data (PDF)
                </motion.button>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 p-5 sm:p-6 shadow-sm dark:shadow-none flex flex-col lg:flex-row gap-4 sm:gap-5">
                <div className="flex-1 lg:flex-[1.5]">
                    <label className="block text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Search User / Email</label>
                    <input
                        type="text"
                        placeholder="e.g. John Doe, Agency..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-medium"
                    />
                </div>
                <div className="flex-1 lg:flex-[0.8]">
                    <label className="block text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Role</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm font-medium cursor-pointer"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="CITIZEN">Citizen</option>
                        <option value="AGENCY">Agency</option>
                    </select>
                </div>
                <div className="flex-1 lg:flex-[0.8]">
                    <label className="block text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm font-medium cursor-pointer min-h-[46px]"
                    />
                </div>
                <div className="flex-1 lg:flex-[0.8]">
                    <label className="block text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm font-medium cursor-pointer min-h-[46px]"
                    />
                </div>
                {(searchQuery || dateRange.start || dateRange.end || roleFilter !== "ALL") && (
                    <div className="flex items-end w-full lg:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setSearchQuery(""); setRoleFilter("ALL"); setDateRange({ start: "", end: "" }); }}
                            className="w-full lg:w-auto px-6 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors h-[46px] flex items-center justify-center"
                        >
                            Reset Filters
                        </motion.button>
                    </div>
                )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/20 dark:shadow-none p-6 sm:p-10 min-h-[500px]">
                <div className="mb-8 pb-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg">
                        {displayedLogs.length} Result{displayedLogs.length !== 1 ? 's' : ''} Found
                    </span>
                </div>

                {isLoading ? (
                    <div className="py-32 flex flex-col justify-center items-center gap-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="h-12 w-12 border-4 border-purple-600/20 border-t-purple-600 dark:border-purple-400/20 dark:border-t-purple-400 rounded-full"
                        />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 animate-pulse">Syncing Logs...</span>
                    </div>
                ) : displayedLogs.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-24 flex flex-col items-center text-center">
                        <span className="text-6xl mb-6 block opacity-40 drop-shadow-sm">📭</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">No matching logs found.</h3>
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-2">Try clearing your search or adjusting the filters.</p>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative border-l-2 border-slate-100 dark:border-slate-800/80 ml-4 sm:ml-8 space-y-8 pb-4">
                        {displayedLogs.map((log, i) => {
                            const ui = getLogUI(log.action_type, log.description);
                            const isAnonymized = (log.description || "").includes("ANONYMOUS");

                            return (
                                <motion.div variants={itemVariants} key={log.id || i} className="relative pl-6 sm:pl-10 group">
                                    <div className={`absolute - left - [17px] top - 1 w - 8 h - 8 rounded - full border - 4 border - white dark: border - slate - 900 flex items - center justify - center text - sm shadow - sm transition - transform duration - 300 group - hover: scale - 110 ${ui.color} `}>
                                        {ui.icon}
                                    </div>

                                    <div className={`transition - all duration - 300 p - 5 sm: p - 6 rounded - 2xl border ${isAnonymized ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20 hover:shadow-md' : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-100 dark:border-slate-700/50 hover:shadow-md'} `}>
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">{log.actor_name}</span>
                                                <span className={`px - 2.5 py - 1 text - [9px] font - black uppercase tracking - widest rounded - md ${log.actor_role?.toUpperCase() === 'CITIZEN' ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300' : log.actor_role?.toUpperCase() === 'AGENCY' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'} `}>
                                                    {log.actor_role}
                                                </span>
                                                <span className={`px - 2.5 py - 1 text - [9px] font - black uppercase tracking - widest rounded - md border ${ui.color.split(' ').map(c => c.includes('text') || c.includes('bg') || c.includes('border') ? c : '').join(' ')} `}>
                                                    {log.action_type}
                                                </span>
                                                {isAnonymized && <span className="px-2.5 py-1 bg-rose-200 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-md flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Unmasked
                                                </span>}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-800">{formatDate(log.created_at)}</span>
                                        </div>
                                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{log.description}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 font-mono bg-slate-200/50 dark:bg-slate-900/50 inline-block px-2 py-1 rounded">ID: {log.actor_email}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </motion.div>

            <AnimatePresence>
                {showPrintModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Export PDF Settings</h2>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Customize your document layout.</p>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="space-y-4">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Include Logo Header</span>
                                        <input type="checkbox" checked={printSettings.withLogo} onChange={(e) => setPrintSettings({ ...printSettings, withLogo: e.target.checked })} className="w-5 h-5 accent-purple-600 cursor-pointer rounded" />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Include Page Numbers</span>
                                        <input type="checkbox" checked={printSettings.pageNumbers} onChange={(e) => setPrintSettings({ ...printSettings, pageNumbers: e.target.checked })} className="w-5 h-5 accent-purple-600 cursor-pointer rounded" />
                                    </label>
                                </div>

                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Paper Size</span>
                                    <div className="flex gap-2">
                                        {['a4', 'letter', 'legal'].map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setPrintSettings({ ...printSettings, paperSize: size })}
                                                className={`flex - 1 py - 2.5 text - sm font - bold rounded - xl border transition - all ${printSettings.paperSize === size ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} `}
                                            >
                                                {size === 'letter' ? 'Short' : size === 'legal' ? 'Long' : 'A4'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Layout Orientation</span>
                                    <div className="flex gap-2">
                                        {['portrait', 'landscape'].map(layout => (
                                            <button
                                                key={layout}
                                                onClick={() => setPrintSettings({ ...printSettings, orientation: layout })}
                                                className={`flex - 1 py - 2.5 text - sm font - bold capitalize rounded - xl border transition - all ${printSettings.orientation === layout ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} `}
                                            >
                                                {layout}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-900">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowPrintModal(false)}
                                    className="flex-1 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleGeneratePDF}
                                    className="flex-[1.5] py-3.5 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download PDF
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}