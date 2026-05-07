import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function SystemLogs() {
    const [searchParams] = useSearchParams();
    const targetEmail = searchParams.get("email");

    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Filters State ---
    const [filterType, setFilterType] = useState<string>("ALL");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // --- Print Modal State ---
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printSettings, setPrintSettings] = useState({
        withLogo: true,
        paperSize: "A4", // A4, letter (short), legal (long)
        orientation: "portrait", // portrait, landscape
        pageNumbers: true
    });

    useEffect(() => {
        const fetchRealLogs = async () => {
            try {
                // Replace with your actual API call
                const response = await fetch("http://localhost:8080/api/logs");
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

    // --- Filter Logic ---
    const displayedLogs = useMemo(() => {
        return logs.filter(log => {
            // Type Filter
            if (filterType !== "ALL" && (log.action_type || "").toUpperCase() !== filterType) return false;

            // Date Filter
            const logDate = new Date(log.created_at).getTime();
            const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
            const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity; // Add 1 day to include end date fully

            if (logDate < start || logDate > end) return false;

            return true;
        });
    }, [logs, filterType, dateRange]);

    // --- UI Helpers ---
    const getLogUI = (type: string, description: string) => {
        const t = (type || "").toUpperCase();
        const desc = (description || "").toLowerCase();

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

    // --- Print Logic ---
    const handlePrint = () => {
        setShowPrintModal(false);
        setTimeout(() => {
            window.print();
        }, 150); // slight delay to allow modal to close before printing
    };

    // Dynamic Print CSS Generator
    const printStyles = `
        @media print {
            @page {
                size: ${printSettings.paperSize} ${printSettings.orientation};
                margin: 20mm;
            }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            ${printSettings.pageNumbers ? `
            @page {
                @bottom-right { content: "Page " counter(page) " of " counter(pages); font-family: sans-serif; font-size: 10px; color: #64748b; }
            }
            ` : ''}
        }
    `;

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4 sm:px-6 print:p-0 print:m-0 print:max-w-none">

            {/* Inject dynamic print styles */}
            <style>{printStyles}</style>

            {/* Print Header (Only visible on paper) */}
            <div className="hidden print:flex flex-col items-center justify-center border-b pb-6 mb-6 border-slate-200">
                {printSettings.withLogo && (
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-black text-xl mb-4">
                        A
                    </div>
                )}
                <h1 className="text-3xl font-black text-slate-900">System Audit Logs</h1>
                <p className="text-sm text-slate-500">
                    {targetEmail ? `Isolated Activity Report: ${targetEmail}` : "Global Database Activity Report"}
                </p>
                <p className="text-xs text-slate-400 mt-1">Generated on: {new Date().toLocaleString()}</p>
            </div>

            {/* Web Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 print:hidden">
                <div>
                    <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back
                    </Link>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Audit Logs</span>
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {targetEmail ? `Viewing isolated activity for: ${targetEmail}` : "Global chronological database activity."}
                    </p>
                </div>

                <button
                    onClick={() => setShowPrintModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Export / Print
                </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 print:hidden">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Action Type</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="ALL">All Actions</option>
                        <option value="LOGIN">Logins</option>
                        <option value="REGISTER">Registrations</option>
                        <option value="PROJECT">Projects</option>
                        <option value="COMMENT">Comments</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                </div>
                {(dateRange.start || dateRange.end || filterType !== "ALL") && (
                    <div className="flex items-end">
                        <button
                            onClick={() => { setFilterType("ALL"); setDateRange({ start: "", end: "" }); }}
                            className="px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors h-[42px]"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Log Container */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 min-h-[500px] print:border-none print:shadow-none print:p-0">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div></div>
                ) : displayedLogs.length === 0 ? (
                    <div className="py-32 flex flex-col items-center text-center">
                        <span className="text-6xl mb-4 block opacity-50">📭</span>
                        <h3 className="text-xl font-black text-slate-900">No activity found.</h3>
                        <p className="text-sm text-slate-500">Adjust your filters or try a different query.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-100 ml-4 sm:ml-8 space-y-8 pb-4 print:border-slate-300">
                        {displayedLogs.map((log, i) => {
                            const ui = getLogUI(log.action_type, log.description);
                            const isAnonymized = (log.description || "").includes("ANONYMOUS");

                            return (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    key={log.id || i}
                                    className="relative pl-6 sm:pl-8 print:break-inside-avoid"
                                >
                                    {/* Timeline Node */}
                                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-xs shadow-sm ${ui.color} print:border-slate-100 print:shadow-none`}>
                                        {ui.icon}
                                    </div>

                                    {/* Card Content */}
                                    <div className={`transition-colors p-5 rounded-2xl border ${isAnonymized ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'} print:bg-transparent print:border-b print:border-x-0 print:border-t-0 print:rounded-none print:p-4 print:pl-0`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-slate-900 text-base">{log.actor_name}</span>
                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md print:border print:border-slate-300 print:bg-white">{log.actor_role}</span>
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black uppercase tracking-widest rounded-md print:border print:border-slate-300 print:bg-white">{log.action_type}</span>
                                                {isAnonymized && <span className="px-2 py-0.5 bg-rose-200 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-md print:border print:border-slate-300 print:bg-white">Unmasked</span>}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-slate-600">{formatDate(log.created_at)}</span>
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

            {/* --- Print Configuration Modal --- */}
            <AnimatePresence>
                {showPrintModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-xl font-black text-slate-900">Print Configuration</h2>
                                <p className="text-sm text-slate-500">Customize how your logs look on paper.</p>
                            </div>

                            <div className="p-6 space-y-5 bg-slate-50">
                                {/* Logo Toggle */}
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-bold text-slate-700">Include Header/Logo</span>
                                    <input
                                        type="checkbox"
                                        checked={printSettings.withLogo}
                                        onChange={(e) => setPrintSettings({ ...printSettings, withLogo: e.target.checked })}
                                        className="w-5 h-5 accent-purple-600 cursor-pointer"
                                    />
                                </label>

                                {/* Page Numbers Toggle */}
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-bold text-slate-700">Force Page Numbers</span>
                                    <input
                                        type="checkbox"
                                        checked={printSettings.pageNumbers}
                                        onChange={(e) => setPrintSettings({ ...printSettings, pageNumbers: e.target.checked })}
                                        className="w-5 h-5 accent-purple-600 cursor-pointer"
                                    />
                                </label>

                                {/* Paper Size */}
                                <div>
                                    <span className="block text-sm font-bold text-slate-700 mb-2">Paper Size</span>
                                    <div className="flex gap-2">
                                        {['A4', 'letter', 'legal'].map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setPrintSettings({ ...printSettings, paperSize: size })}
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${printSettings.paperSize === size ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                            >
                                                {size === 'letter' ? 'Short' : size === 'legal' ? 'Long' : 'A4'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Orientation */}
                                <div>
                                    <span className="block text-sm font-bold text-slate-700 mb-2">Orientation</span>
                                    <div className="flex gap-2">
                                        {['portrait', 'landscape'].map(layout => (
                                            <button
                                                key={layout}
                                                onClick={() => setPrintSettings({ ...printSettings, orientation: layout })}
                                                className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg border transition-colors ${printSettings.orientation === layout ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                            >
                                                {layout}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white flex gap-3">
                                <button
                                    onClick={() => setShowPrintModal(false)}
                                    className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Print Document
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}