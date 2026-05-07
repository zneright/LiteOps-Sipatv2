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

    // --- New Filters State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
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

    // --- Dynamic Filter Logic ---
    const displayedLogs = useMemo(() => {
        return logs.filter(log => {
            // 1. Role Filter (Citizen vs Agency)
            if (roleFilter !== "ALL" && (log.actor_role || "").toUpperCase() !== roleFilter) return false;

            // 2. Search Filter (Matches Name, Role, or Email)
            if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase();
                const nameMatch = (log.actor_name || "").toLowerCase().includes(query);
                const roleMatch = (log.actor_role || "").toLowerCase().includes(query);
                const emailMatch = (log.actor_email || "").toLowerCase().includes(query);

                if (!nameMatch && !roleMatch && !emailMatch) return false;
            }

            // 3. Date Filter
            const logDate = new Date(log.created_at).getTime();
            const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
            const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity; // Adds 24h to include end day

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
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    // --- PURE DATA PDF EXPORT (Follows Filters) ---
    const exportDataToPDF = () => {
        const doc = new jsPDF("landscape", "pt", "A4");

        // Document Title
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text("System Audit Logs", 40, 40);

        // Document Subtitle / Metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        const subtitle = targetEmail ? `Isolated Activity Report: ${targetEmail}` : "Filtered Database Activity Report";
        doc.text(`${subtitle}  |  Generated: ${new Date().toLocaleString()}`, 40, 55);

        // Prepare Data Table (Based strictly on displayedLogs)
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
            startY: 70,
            theme: 'striped',
            headStyles: {
                fillColor: [147, 51, 234], // Purple-600
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 9, cellPadding: 6 },
            columnStyles: {
                0: { cellWidth: 110 },
                1: { cellWidth: 100 },
                2: { cellWidth: 130 },
                3: { cellWidth: 60 },
                4: { cellWidth: 70 },
                5: { cellWidth: 'auto' }
            },
            didDrawPage: function (data) {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(`Page ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

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
                    onClick={exportDataToPDF}
                    disabled={displayedLogs.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Filtered PDF
                </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">

                {/* Search Input */}
                <div className="flex-1 md:flex-[1.5]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Search Name / Email</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="e.g. John Doe, Agency X..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Role Filter */}
                <div className="flex-1 md:flex-[0.8]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role Type</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="CITIZEN">Citizen Only</option>
                        <option value="AGENCY">Agency Only</option>
                    </select>
                </div>

                {/* Date Filters */}
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

                {/* Clear Filter Button */}
                {(searchQuery || dateRange.start || dateRange.end || roleFilter !== "ALL") && (
                    <div className="flex items-end">
                        <button
                            onClick={() => { setSearchQuery(""); setRoleFilter("ALL"); setDateRange({ start: "", end: "" }); }}
                            className="px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 hover:text-rose-700 transition-colors h-[42px] flex items-center justify-center whitespace-nowrap"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>

            {/* Visual Web UI Container */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 min-h-[500px]">
                {/* Stats Summary */}
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
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    key={log.id || i}
                                    className="relative pl-6 sm:pl-8"
                                >
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