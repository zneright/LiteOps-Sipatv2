import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface Phase {
    title: string;
    description: string;
    image_url: string;
    status?: "pending" | "completed";
}

interface Project {
    id: number;
    title: string;
    budget: string;
    phases: string;
    category: string;
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
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4">
            <div>
                <Link to="/agency/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Dashboard
                </Link>
                {/* 🚀 HIGH CONTRAST HEADERS */}
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Project Tracker</h1>
                <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">Click a project to expand and update its timeline.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="animate-pulse font-bold text-slate-600 dark:text-slate-300">Loading projects...</span></div>
            ) : projects.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl text-center border border-slate-200 dark:border-slate-700"><p className="font-bold text-slate-600 dark:text-slate-300">No projects published yet.</p></div>
            ) : (
                <div className="flex flex-col gap-6">
                    {projects.map((project) => {
                        const parsedPhases: Phase[] = JSON.parse(project.phases || "[]");
                        const percentage = getProgressPercentage(project.phases);
                        const isExpanded = expandedProjectId === project.id;

                        return (
                            <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] shadow-md overflow-hidden">

                                <div
                                    onClick={() => toggleExpand(project.id)}
                                    className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex-1">
                                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider rounded-lg mb-2 inline-block">
                                            {project.category}
                                        </span>
                                        {/* 🚀 HIGH CONTRAST TITLES */}
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{project.title}</h2>
                                        <p className="text-slate-700 dark:text-slate-300 font-bold text-sm mt-1">Budget: ₱{project.budget}</p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full" />
                                            </div>
                                            <span className="text-lg font-black text-indigo-700 dark:text-indigo-400 w-12 text-right">{percentage}%</span>
                                        </div>
                                        <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="p-6 bg-slate-50 dark:bg-slate-950">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6">Timeline & Verification</h3>

                                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-600 before:to-transparent">
                                                    {parsedPhases.map((phase, index) => {
                                                        const isCompleted = phase.status === "completed";
                                                        const hasImage = phase.image_url !== "";

                                                        return (
                                                            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 font-bold text-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                                                    {isCompleted ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : index + 1}
                                                                </div>

                                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 shadow-sm transition-all hover:shadow-md">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        {/* 🚀 HIGH CONTRAST PHASE TITLES */}
                                                                        <h4 className={`font-black text-base ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{phase.title}</h4>

                                                                        <button
                                                                            onClick={() => handleManualVerify(project.id, index)}
                                                                            className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/50' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                                                            title="Mark as complete if verified by citizens in comments"
                                                                        >
                                                                            {isCompleted ? "✔ VERIFIED" : "MARK COMPLETE"}
                                                                        </button>
                                                                    </div>

                                                                    {/* 🚀 HIGH CONTRAST DESCRIPTIONS */}
                                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">{phase.description}</p>

                                                                    {hasImage ? (
                                                                        <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                                                            <img src={phase.image_url} alt="Proof" className="w-full h-full object-cover" />
                                                                            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded shadow-sm">PHOTO PROOF</div>
                                                                        </div>
                                                                    ) : (
                                                                        <label className={`flex items-center justify-center w-full py-2.5 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-400 font-bold text-xs cursor-pointer transition-colors ${uploadingPhaseIdx === index ? 'opacity-50' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}>
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