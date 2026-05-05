import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// 🚀 UPDATED: Added phase dates
interface Phase {
    title: string;
    description: string;
    image_url: string;
    status?: "pending" | "completed";
    start_date?: string;
    completion_date?: string;
}

// 🚀 UPDATED: Added overall project dates and keywords
interface Project {
    id: number;
    title: string;
    budget: string;
    phases: string;
    category: string;
    file_url?: string;
    keywords?: string;
    start_date?: string;
    completion_date?: string;
}

export default function ManageProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingPhaseIdx, setUploadingPhaseIdx] = useState<number | null>(null);
    const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

    const CLOUD_NAME = "dupjdmjha";
    const UPLOAD_PRESET = "sipat_uploads";

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/projects");
            const data = await res.json();
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    const uploadProofToCloudinary = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, true);
            xhr.onload = () => {
                if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
                else reject("Failed to upload");
            };
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);
            xhr.send(formData);
        });
    };

    const handleUploadProof = async (projectId: number, phaseIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhaseIdx(phaseIndex);

        try {
            const projectToUpdate = projects.find(p => p.id === projectId);
            if (!projectToUpdate) return;
            const parsedPhases: Phase[] = JSON.parse(projectToUpdate.phases || "[]");

            const proofUrl = await uploadProofToCloudinary(file);
            parsedPhases[phaseIndex].image_url = proofUrl;
            parsedPhases[phaseIndex].status = "completed";

            await updateDatabase(projectId, parsedPhases);
        } catch (error) {
            alert("Failed to upload proof.");
        } finally {
            setUploadingPhaseIdx(null);
        }
    };

    const handleManualVerify = async (projectId: number, phaseIndex: number) => {
        try {
            const projectToUpdate = projects.find(p => p.id === projectId);
            if (!projectToUpdate) return;
            const parsedPhases: Phase[] = JSON.parse(projectToUpdate.phases || "[]");

            const isCurrentlyCompleted = parsedPhases[phaseIndex].status === "completed";
            parsedPhases[phaseIndex].status = isCurrentlyCompleted ? "pending" : "completed";
            if (isCurrentlyCompleted) parsedPhases[phaseIndex].image_url = "";

            await updateDatabase(projectId, parsedPhases);
        } catch (error) {
            alert("Failed to update status.");
        }
    };

    const updateDatabase = async (projectId: number, parsedPhases: Phase[]) => {
        const updatedPhasesString = JSON.stringify(parsedPhases);
        await fetch(`http://localhost:8080/api/projects/${projectId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phases: updatedPhasesString })
        });
        setProjects(projects.map(p => p.id === projectId ? { ...p, phases: updatedPhasesString } : p));
    };

    const getProgressPercentage = (phasesString: string) => {
        try {
            const phases: Phase[] = JSON.parse(phasesString || "[]");
            if (phases.length === 0) return 0;
            const completedCount = phases.filter(p => p.status === "completed" || p.image_url !== "").length;
            return Math.round((completedCount / phases.length) * 100);
        } catch {
            return 0;
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedProjectId(expandedProjectId === id ? null : id);
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4 text-slate-900 dark:text-white">
            <div>
                <Link to="/agency/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-black tracking-tight">Project Tracker</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Click a project to expand and update its timeline.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="animate-pulse font-bold text-slate-500">Loading projects...</span></div>
            ) : projects.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl text-center border border-slate-200 dark:border-slate-800"><p className="font-bold text-slate-500">No projects published yet.</p></div>
            ) : (
                <div className="flex flex-col gap-6">
                    {projects.map((project) => {
                        const parsedPhases: Phase[] = JSON.parse(project.phases || "[]");
                        const percentage = getProgressPercentage(project.phases);
                        const isExpanded = expandedProjectId === project.id;

                        return (
                            <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] shadow-sm overflow-hidden">

                                {/* CLICKABLE HEADER */}
                                <div
                                    onClick={() => toggleExpand(project.id)}
                                    className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-lg mb-2 inline-block">
                                            {project.category}
                                        </span>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{project.title}</h2>

                                        {/* 🚀 NEW UI: Budget & Overall Project Dates */}
                                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm">
                                            <p className="text-slate-500 dark:text-slate-400 font-bold">Budget: ₱{project.budget}</p>
                                            {(project.start_date || project.completion_date) && (
                                                <p className="text-slate-500 dark:text-slate-400 font-bold">
                                                    🗓 Timeline: {project.start_date || "TBD"} to {project.completion_date || "TBD"}
                                                </p>
                                            )}
                                        </div>

                                        {/* 🚀 NEW UI: Keywords Display */}
                                        {project.keywords && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {project.keywords.split(',').map((kw, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold rounded">
                                                        #{kw.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-indigo-600 rounded-full" />
                                            </div>
                                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 w-12 text-right">{percentage}%</span>
                                        </div>
                                        <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* EXPANDABLE TIMELINE BODY */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
                                        >
                                            <div className="p-6 bg-slate-50/50 dark:bg-slate-950/30">

                                                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Timeline & Verification</h3>
                                                    {project.file_url && (
                                                        <a href={project.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition-colors border border-blue-200 dark:border-blue-500/30 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                            View Original Document
                                                        </a>
                                                    )}
                                                </div>

                                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                                                    {parsedPhases.map((phase, index) => {
                                                        const isCompleted = phase.status === "completed";
                                                        const hasImage = phase.image_url !== "";

                                                        return (
                                                            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 font-bold text-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                                                    {isCompleted ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : index + 1}
                                                                </div>

                                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md text-slate-900 dark:text-slate-100">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div>
                                                                            <h4 className={`font-black text-base ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{phase.title}</h4>

                                                                            {/* 🚀 NEW UI: Phase Dates */}
                                                                            {(phase.start_date || phase.completion_date) && (
                                                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                                                                                    {phase.start_date || "TBD"} — {phase.completion_date || "TBD"}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        <button onClick={() => handleManualVerify(project.id, index)} className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`} title="Mark as complete if verified by citizens in comments">
                                                                            {isCompleted ? "✔ VERIFIED" : "MARK COMPLETE"}
                                                                        </button>
                                                                    </div>

                                                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 mt-2">{phase.description}</p>

                                                                    {hasImage ? (
                                                                        <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                                                            <img src={phase.image_url} alt="Proof" className="w-full h-full object-cover" />
                                                                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded shadow-sm">PHOTO PROOF</div>
                                                                        </div>
                                                                    ) : (
                                                                        <label className={`flex items-center justify-center w-full py-2.5 rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs cursor-pointer transition-colors ${uploadingPhaseIdx === index ? 'opacity-50' : 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}>
                                                                            {uploadingPhaseIdx === index ? "Uploading..." : "+ Attach Photo Proof (Optional)"}
                                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadProof(project.id, index, e)} disabled={uploadingPhaseIdx === index} />
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}