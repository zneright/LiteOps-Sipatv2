import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SystemLogs() {
    const [searchParams] = useSearchParams();
    const targetEmail = searchParams.get("email");

    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Filters State ---
    const [filterType, setFilterType] = useState<string>("ALL");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

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
            if (filterType !== "ALL" && (log.action_type || "").toUpperCase() !== filterType) return false;

            const logDate = new Date(log.created_at).getTime();
            const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
            const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity;

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

    // --- PURE DATA PDF EXPORT ---
    const exportDataToPDF = () => {
        // Create a new PDF document (Landscape, A4 size)
        const doc = new jsPDF("landscape", "pt", "A4");

        // Document Title
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42); // text-slate-900
        doc.text("System Audit Logs", 40, 40);

        // Document Subtitle / Metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // text-slate-500
        const subtitle = targetEmail ? `Isolated Activity Report: ${targetEmail}` : "Global Database Activity Report";
        doc.text(`${subtitle}  |  Generated: ${new Date().toLocaleString()}`, 40, 55);

        // Prepare the Data Table
        const tableColumns = ["Date & Time", "User Name", "Email Address", "Role", "Action Type", "Description"];

        // Map the raw JSON data into an array of arrays for the table
        const tableRows = displayedLogs.map(log => [
            formatDate(log.created_at),
            log.actor_name,
            log.actor_email,
            log.actor_role,
            log.action_type,
            log.description
        ]);

        // Generate the AutoTable
        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 70, // Start below the title
            theme: 'striped',
            headStyles: {
                fillColor: [147, 51, 234], // Purple-600 to match your UI brand
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 9,
                cellPadding: 6
            },
            columnStyles: {
                0: { cellWidth: 110 }, // Date
                1: { cellWidth: 100 }, // Name
                2: { cellWidth: 130 }, // Email
                3: { cellWidth: 60 },  // Role
                4: { cellWidth: 70 },  // Action
                5: { cellWidth: 'auto' } // Description takes remaining space
            },
            didDrawPage: function (data) {
                // Add Page numbers at the bottom
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(`Page ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        // Trigger Download
        const filename = targetEmail ? `Audit_Logs_${targetEmail.split('@')[0]}.pdf` : `Audit_Logs_Global.pdf`;
        doc.save(filename);
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4 sm:px-6">

            {/* Web Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
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

                {/* Clean Export Button */}
                <button
                    onClick={exportDataToPDF}
                    disabled={displayedLogs.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Data (PDF)
                </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">
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

            {/* Visual Web UI Container (Not used in PDF) */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 min-h-[500px]">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div></div>
                ) : displayedLogs.length === 0 ? (
                    <div className="py-32 flex flex-col items-center text-center">
                        <span className="text-6xl mb-4 block opacity-50">📭</span>
                        <h3 className="text-xl font-black text-slate-900">No activity found.</h3>
                        <p className="text-sm text-slate-500">Adjust your filters or try a different query.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-100 ml-4 sm:ml-8 space-y-8 pb-4">
                        {displayedLogs.map((log, i) => {
                            const ui = getLogUI(log.action_type, log.description);
                            const isAnonymized = (log.description || "").includes("ANONYMOUS");

                            return (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    key={log.id || i}
                                    className="relative pl-6 sm:pl-8"
                                >
                                    {/* Timeline Node */}
                                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-xs shadow-sm ${ui.color}`}>
                                        {ui.icon}
                                    </div>

                                    {/* Card Content */}
                                    <div className={`transition-colors p-5 rounded-2xl border ${isAnonymized ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-slate-900 text-base">{log.actor_name}</span>
                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md">{log.actor_role}</span>
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-white bg-opacity-50 ${ui.color.split(' ')[0]}`}>{log.action_type}</span>
                                                {isAnonymized && <span className="px-2 py-0.5 bg-rose-200 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-md">Unmasked</span>}
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