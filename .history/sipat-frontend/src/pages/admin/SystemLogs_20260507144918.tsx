import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SystemLogs() {
    const [searchParams] = useSearchParams();
    const targetEmail = searchParams.get("email");

    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Filters State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // --- Print Modal State ---
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printSettings, setPrintSettings] = useState({
        withLogo: true,
        paperSize: "a4", // a4, letter (short), legal (long)
        orientation: "landscape", // portrait, landscape
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

    // --- Dynamic Filter Logic ---
    const displayedLogs = useMemo(() => {
        return logs.filter(log => {
            // Role Filter
            if (roleFilter !== "ALL" && (log.actor_role || "").toUpperCase() !== roleFilter) return false;

            // Search Filter
            if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase();
                const nameMatch = (log.actor_name || "").toLowerCase().includes(query);
                const roleMatch = (log.actor_role || "").toLowerCase().includes(query);
                const emailMatch = (log.actor_email || "").toLowerCase().includes(query);

                if (!nameMatch && !roleMatch && !emailMatch) return false;
            }

            // Date Filter
            const logDate = new Date(log.created_at).getTime();
            const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
            const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity;

            if (logDate < start || logDate > end) return false;

            return true;
        });
    }, [logs, roleFilter, searchQuery, dateRange]);

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
            hour: '2-digit', minute: '2-digit'
        });
    };

    // --- PURE DATA PDF EXPORT (WITH MODAL SETTINGS) ---
    const handleGeneratePDF = () => {
        setShowPrintModal(false);

        // Initialize jsPDF with the user's selected orientation and paper size
        const doc = new jsPDF({
            orientation: printSettings.orientation as "portrait" | "landscape",
            unit: "pt",
            format: printSettings.paperSize
        });

        let startY = 40;

        // Draw Mock Logo if toggled
        if (printSettings.withLogo) {
            doc.setFillColor(147, 51, 234); // Purple
            doc.roundedRect(40, startY, 30, 30, 5, 5, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("A", 49, startY + 21);

            // Adjust title start position
            startY += 10;
        }

        // Document Title
        const titleX = printSettings.withLogo ? 85 : 40;
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("System Audit Logs", titleX, startY + 12);

        // Document Subtitle / Metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        const subtitle = targetEmail ? `Isolated Activity Report: ${targetEmail}` : "Filtered Database Activity Report";
        doc.text(`${subtitle}  |  Generated: ${new Date().toLocaleString()}`, titleX, startY + 28);

        // Prepare Data Table
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
                fillColor: [147, 51, 234], // Purple-600
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 9, cellPadding: 6 },
            didDrawPage: function (data) {
                // Add Page Numbers if toggled
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

        // Trigger Download
        const filename = targetEmail ? `Audit_Logs_${targetEmail.split('@')[0]}.pdf` : `Filtered_Audit_Logs.pdf`;
        doc.save(filename);
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4 sm:px-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back
                    </Link>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Audit Logs</span>
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {targetEmail ? `Viewing isolated activity for: ${targetEmail}` : "Track platform usage by Citizen or Agency."}
                    </p>
                </div>

                <button
                    onClick={() => setShowPrintModal(true)}
                    disabled={displayedLogs.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export Data (PDF)
                </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 md:flex-[1.5]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Search User / Email</label>
                    <input
                        type="text"
                        placeholder="e.g. John Doe, Agency..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex-1 md:flex-[0.8]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="CITIZEN">Citizen</option>
                        <option value="AGENCY">Agency</option>
                    </select>
                </div>
                <div className="flex-1 md:flex-[0.8]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                    />
                </div>
                <div className="flex-1 md:flex-[0.8]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                    />
                </div>
                {(searchQuery || dateRange.start || dateRange.end || roleFilter !== "ALL") && (
                    <div className="flex items-end">
                        <button
                            onClick={() => { setSearchQuery(""); setRoleFilter("ALL"); setDateRange({ start: "", end: "" }); }}
                            className="px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors h-[42px]"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 min-h-[500px]">
                <div className="mb-8 pb-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                        {displayedLogs.length} Result{displayedLogs.length !== 1 ? 's' : ''} Found
                    </span>
                </div>

                {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div></div>
                ) : displayedLogs.length === 0 ? (
                    <div className="py-32 flex flex-col items-center text-center">
                        <span className="text-6xl mb-4 block opacity-50">📭</span>
                        <h3 className="text-xl font-black text-slate-900">No matching logs found.</h3>
                        <p className="text-sm text-slate-500">Try clearing your search or adjusting the filters.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-100 ml-4 sm:ml-8 space-y-8 pb-4">
                        {displayedLogs.map((log, i) => {
                            const ui = getLogUI(log.action_type, log.description);
                            const isAnonymized = (log.description || "").includes("ANONYMOUS");

                            return (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} key={log.id || i} className="relative pl-6 sm:pl-8">
                                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-xs shadow-sm ${ui.color}`}>
                                        {ui.icon}
                                    </div>

                                    <div className={`transition-colors p-5 rounded-2xl border ${isAnonymized ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-slate-900 text-base">{log.actor_name}</span>
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md ${log.actor_role?.toUpperCase() === 'CITIZEN' ? 'bg-sky-100 text-sky-700' : log.actor_role?.toUpperCase() === 'AGENCY' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    {log.actor_role}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-white bg-opacity-50 ${ui.color.split(' ')[0]}`}>{log.action_type}</span>
                                                {isAnonymized && <span className="px-2 py-0.5 bg-rose-200 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-md">Unmasked</span>}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(log.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium">{log.description}</p>
                                        <p className="text-[10px] text-slate-400 mt-2 font-mono">ID: {log.actor_email}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* PDF*/}
            <AnimatePresence>
                {showPrintModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-xl font-black text-slate-900">PDF Document Settings</h2>
                                <p className="text-sm text-slate-500">Customize how your data table looks.</p>
                            </div>

                            <div className="p-6 space-y-5 bg-slate-50">
                                {/* Toggles */}
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="text-sm font-bold text-slate-700">Include Logo Header</span>
                                        <input type="checkbox" checked={printSettings.withLogo} onChange={(e) => setPrintSettings({ ...printSettings, withLogo: e.target.checked })} className="w-5 h-5 accent-purple-600 cursor-pointer" />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="text-sm font-bold text-slate-700">Include Page Numbers</span>
                                        <input type="checkbox" checked={printSettings.pageNumbers} onChange={(e) => setPrintSettings({ ...printSettings, pageNumbers: e.target.checked })} className="w-5 h-5 accent-purple-600 cursor-pointer" />
                                    </label>
                                </div>

                                {/* Paper Size */}
                                <div>
                                    <span className="block text-sm font-bold text-slate-700 mb-2">Paper Size</span>
                                    <div className="flex gap-2">
                                        {['a4', 'letter', 'legal'].map(size => (
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
                                    <span className="block text-sm font-bold text-slate-700 mb-2">Layout Orientation</span>
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
                                    onClick={handleGeneratePDF}
                                    className="flex-1 py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2"
                                >
                                    Download PDF
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}