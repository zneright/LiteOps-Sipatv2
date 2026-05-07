import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface Phase {
    title: string;
    description: string;
    image_url: string;
    status?: "pending" | "completed";
    start_date?: string;
    completion_date?: string;
}

interface Project {
    id: number;
    title: string;
    budget: string;
    phases: any;
    category: string;
    file_url?: string;
    keywords?: string;
    start_date?: string;
    completion_date?: string;
    organization_name?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ManageProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingPhaseIdx, setUploadingPhaseIdx] = useState<number | null>(null);
    const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

    const CLOUD_NAME = "dupjdmjha";
    const UPLOAD_PRESET = "sipat_uploads";

    useEffect(() => {
        if (user?.name) {
            fetchProjects();
        }
    }, [user]);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API_URL}/api/projects");
            const data = await res.json();

            const myProjects = data.filter((p: Project) =>
                p.organization_name === user?.name ||
                (!p.organization_name && user?.name === "DPWH")
            );

            setProjects(myProjects);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    const safeParsePhases = (phasesData: any): Phase[] => {
        if (!phasesData) return [];
        if (Array.isArray(phasesData)) return phasesData;
        try {
            return JSON.parse(phasesData);
        } catch (e) {
            console.warn("Could not parse phases, returning empty array:", e);
            return [];
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

            const parsedPhases = safeParsePhases(projectToUpdate.phases);
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

            const parsedPhases = safeParsePhases(projectToUpdate.phases);
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
        await fetch(`${API_URL}/api/projects/${projectId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phases: updatedPhasesString })
        });
        setProjects(projects.map(p => p.id === projectId ? { ...p, phases: updatedPhasesString } : p));
    };

    const getProgressPercentage = (phasesData: any) => {
        const phases = safeParsePhases(phasesData);
        if (phases.length === 0) return 0;
        const completedCount = phases.filter(p => p.status === "completed" || p.image_url !== "").length;
        return Math.round((completedCount / phases.length) * 100);
    };

    const toggleExpand = (id: number) => {
        setExpandedProjectId(expandedProjectId === id ? null : id);
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8 pb-24 pt-6 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-white"
        >
            <motion.div variants={itemVariants} className="flex flex-col items-start">
                <Link to="/agency/dashboard" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4">
                    <motion.svg whileHover={{ x: -3 }} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></motion.svg>
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                    Project Tracker
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base sm:text-lg">
                    Click a project to expand and update its timeline.
                </p>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 dark:border-indigo-400/20 dark:border-t-indigo-400 rounded-full"
                    />
                    <span className="font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase text-sm animate-pulse">Loading projects...</span>
                </div>
            ) : projects.length === 0 ? (
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-12 rounded-[2rem] text-center border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <p className="font-bold text-slate-500 dark:text-slate-400 text-lg">No projects published yet.</p>
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} className="flex flex-col gap-5 sm:gap-6">
                    <AnimatePresence>
                        {projects.map((project) => {
                            const parsedPhases = safeParsePhases(project.phases);
                            const percentage = getProgressPercentage(project.phases);
                            const isExpanded = expandedProjectId === project.id;

                            return (
                                <motion.div
                                    layout
                                    variants={itemVariants}
                                    key={project.id}
                                    className={`bg-white dark:bg-slate-900/80 backdrop-blur-xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none ${isExpanded ? 'border-indigo-200 dark:border-indigo-500/30 rounded-[2rem] shadow-indigo-100 dark:shadow-none' : 'border-slate-200/60 dark:border-slate-800/60 rounded-[1.5rem]'}`}
                                >
                                    <div
                                        onClick={() => toggleExpand(project.id)}
                                        className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <div className="flex-1 w-full">
                                            <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3 inline-block border border-indigo-100 dark:border-indigo-500/20">
                                                {project.category}
                                            </span>
                                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-3 line-clamp-2">{project.title}</h2>

                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm">
                                                <p className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                                                    <span className="p-1 rounded bg-slate-100 dark:bg-slate-800">💰</span>
                                                    Budget: <span className="text-slate-900 dark:text-slate-200 font-black">₱{project.budget}</span>
                                                </p>
                                                {(project.start_date || project.completion_date) && (
                                                    <p className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                                                        <span className="p-1 rounded bg-slate-100 dark:bg-slate-800">🗓</span>
                                                        Timeline: {project.start_date || "TBD"} to {project.completion_date || "TBD"}
                                                    </p>
                                                )}
                                            </div>

                                            {project.keywords && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {project.keywords.split(',').map((kw, i) => (
                                                        <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold rounded-md">
                                                            #{kw.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between w-full md:w-auto gap-6 sm:gap-8 pt-4 border-t border-slate-100 dark:border-slate-800 md:pt-0 md:border-0 shrink-0">
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 sm:w-32 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 rounded-full" />
                                                </div>
                                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 w-12 text-right">{percentage}%</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                className={`p-2.5 rounded-full ${isExpanded ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                            </motion.div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden border-t border-slate-100 dark:border-slate-800/80"
                                            >
                                                <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/50">

                                                    <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                                                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                                            Timeline & Verification
                                                        </h3>
                                                        {project.file_url && (
                                                            <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href={project.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors border border-blue-200 dark:border-blue-500/30 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                                View Original Document
                                                            </motion.a>
                                                        )}
                                                    </div>

                                                    {parsedPhases.length === 0 ? (
                                                        <div className="text-center p-8 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 font-medium">No timeline data extracted.</div>
                                                    ) : (
                                                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-200 dark:before:via-indigo-900/50 before:to-transparent pt-2 pb-2">
                                                            {parsedPhases.map((phase, index) => {
                                                                const isCompleted = phase.status === "completed";
                                                                const hasImage = phase.image_url !== "";

                                                                return (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: index * 0.1 }}
                                                                        key={index}
                                                                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                                                                    >
                                                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 dark:border-slate-900 font-bold text-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors duration-300 ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900'}`}>
                                                                            {isCompleted ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : index + 1}
                                                                        </div>

                                                                        <div className={`w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] p-5 sm:p-6 rounded-2xl border transition-all duration-300 shadow-sm ${isCompleted ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/40' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}>
                                                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                                                                                <div>
                                                                                    <h4 className={`font-black text-lg ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{phase.title}</h4>
                                                                                    {(phase.start_date || phase.completion_date) && (
                                                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-widest flex items-center gap-1.5">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                                                            {phase.start_date || "TBD"} — {phase.completion_date || "TBD"}
                                                                                        </p>
                                                                                    )}
                                                                                </div>

                                                                                <motion.button
                                                                                    whileHover={{ scale: 1.05 }}
                                                                                    whileTap={{ scale: 0.95 }}
                                                                                    onClick={() => handleManualVerify(project.id, index)}
                                                                                    className={`shrink-0 text-[10px] font-black px-3 py-1.5 rounded-lg border transition-colors ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-200 dark:hover:bg-emerald-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                                                                                    title="Mark as complete if verified by citizens in comments"
                                                                                >
                                                                                    {isCompleted ? "✔ VERIFIED" : "MARK COMPLETE"}
                                                                                </motion.button>
                                                                            </div>

                                                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">{phase.description}</p>

                                                                            {hasImage ? (
                                                                                <div className="relative h-40 sm:h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group/img">
                                                                                    <img src={phase.image_url} alt="Proof" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300"></div>
                                                                                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                                                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                                                        PHOTO PROOF
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <label className={`relative flex flex-col items-center justify-center w-full py-6 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${uploadingPhaseIdx === index ? 'border-indigo-300 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}>
                                                                                    <div className={`flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400 ${uploadingPhaseIdx === index ? 'opacity-50' : ''}`}>
                                                                                        <svg className={`w-6 h-6 ${uploadingPhaseIdx === index ? 'animate-bounce' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                                                        <span className="font-bold text-xs sm:text-sm">
                                                                                            {uploadingPhaseIdx === index ? "Uploading Proof..." : "Attach Photo Proof (Optional)"}
                                                                                        </span>
                                                                                    </div>
                                                                                    {uploadingPhaseIdx === index && (
                                                                                        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 dark:bg-indigo-400 animate-pulse w-full"></div>
                                                                                    )}
                                                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadProof(project.id, index, e)} disabled={uploadingPhaseIdx === index} />
                                                                                </label>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    );
}