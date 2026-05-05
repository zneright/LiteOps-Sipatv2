import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface Phase {
    title: string;
    description: string;
    image_url: string;
    status?: "pending" | "completed"; // 🚀 Tracks if the phase is done!
}

interface Project {
    id: number;
    title: string;
    budget: string;
    phases: string; // JSON string from DB
    category: string;
}

export default function ManageProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingPhaseIdx, setUploadingPhaseIdx] = useState<number | null>(null);

    const CLOUD_NAME = "dupjdmjha";
    const UPLOAD_PRESET = "sipat_uploads";

    // 1. Fetch Projects on Load
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

    // 2. Cloudinary Uploader for Proof
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

    // 3. Mark Phase Complete & Upload Proof
    const handleUploadProof = async (projectId: number, phaseIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhaseIdx(phaseIndex); // Show loading spinner on this specific phase

        try {
            // Find the project being edited
            const projectToUpdate = projects.find(p => p.id === projectId);
            if (!projectToUpdate) return;

            // Parse the phases, update the specific one
            const parsedPhases: Phase[] = JSON.parse(projectToUpdate.phases || "[]");

            // Upload image
            const proofUrl = await uploadProofToCloudinary(file);

            // Mark as completed and attach proof URL
            parsedPhases[phaseIndex].image_url = proofUrl;
            parsedPhases[phaseIndex].status = "completed";

            const updatedPhasesString = JSON.stringify(parsedPhases);

            // Save to CodeIgniter Database
            await fetch(`http://localhost:8080/api/projects/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phases: updatedPhasesString })
            });

            // Update local React state so UI updates instantly
            setProjects(projects.map(p => p.id === projectId ? { ...p, phases: updatedPhasesString } : p));

        } catch (error) {
            console.error("Failed to update phase", error);
            alert("Failed to upload proof. Please try again.");
        } finally {
            setUploadingPhaseIdx(null);
        }
    };

    // 4. Calculate Percentage Helper
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

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4">
            <div>
                <Link to="/agency/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Project Tracker</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Upload proof of progress to keep citizens updated.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="animate-pulse font-bold text-slate-500">Loading projects...</span></div>
            ) : projects.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl text-center border border-slate-200"><p className="font-bold text-slate-500">No projects published yet.</p></div>
            ) : (
                <div className="flex flex-col gap-8">
                    {projects.map((project) => {
                        const parsedPhases: Phase[] = JSON.parse(project.phases || "[]");
                        const percentage = getProgressPercentage(project.phases);

                        return (
                            <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">

                                {/* Project Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-lg mb-2 inline-block">{project.category}</span>
                                        <h2 className="text-2xl font-black text-slate-900">{project.title}</h2>
                                        <p className="text-slate-500 font-bold text-sm mt-1">Budget: ₱{project.budget}</p>
                                    </div>

                                    {/* Circular Percentage Badge */}
                                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                                        <span className="text-xl font-black">{percentage}%</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-8">
                                    <motion.div
                                        initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                    />
                                </div>

                                {/* Timeline Builder */}
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Timeline & Proof</h3>

                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                    {parsedPhases.map((phase, index) => {
                                        const isCompleted = phase.status === "completed" || phase.image_url !== "";

                                        return (
                                            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                {/* Timeline Node */}
                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 font-bold text-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                    {isCompleted ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : index + 1}
                                                </div>

                                                {/* Phase Card */}
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-slate-50 dark:bg-slate-950/50 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                                                    <h4 className={`font-black text-sm mb-1 ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>{phase.title}</h4>
                                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">{phase.description}</p>

                                                    {/* Image Preview or Uploader */}
                                                    {isCompleted && phase.image_url ? (
                                                        <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200">
                                                            <img src={phase.image_url} alt="Proof" className="w-full h-full object-cover" />
                                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm">VERIFIED PROOF</div>
                                                        </div>
                                                    ) : (
                                                        <label className={`flex items-center justify-center w-full py-2.5 rounded-lg border-2 border-dashed border-indigo-200 text-indigo-600 font-bold text-xs cursor-pointer transition-colors ${uploadingPhaseIdx === index ? 'opacity-50' : 'hover:bg-indigo-50 hover:border-indigo-400'}`}>
                                                            {uploadingPhaseIdx === index ? "Uploading Proof..." : "+ Upload Photo Proof"}
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadProof(project.id, index, e)} disabled={uploadingPhaseIdx === index} />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}