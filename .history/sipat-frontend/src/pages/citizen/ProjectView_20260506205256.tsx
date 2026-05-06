import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export default function ProjectView() {
    const { id } = useParams();
    const { user } = useAuth();
    const [project, setProject] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState("Overall Project");

    const [textContent, setTextContent] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 🚀 NEW: Added a reference to control the text area
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    const CLOUD_NAME = "dupjdmjha";
    const UPLOAD_PRESET = "sipat_uploads";
    const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

    useEffect(() => {
        fetchProject();
        fetchComments();
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/projects/${id}`);
            if (!res.ok) throw new Error("Failed to fetch project");

            const data = await res.json();

            let parsedPhases = [];
            try {
                if (data.phases && typeof data.phases === 'string') {
                    parsedPhases = JSON.parse(data.phases);
                } else if (Array.isArray(data.phases)) {
                    parsedPhases = data.phases;
                }
            } catch (parseError) {
                console.error("Could not parse phases:", parseError);
            }

            data.phases = parsedPhases;
            setProject(data);

        } catch (error) {
            console.error("Error loading project:", error);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/comments/${id}`);
            if (!res.ok) throw new Error("Failed to fetch comments");

            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);

        } catch (error) {
            console.error("Error loading comments:", error);
            setComments([]);
        }
    };

    const handleReaction = async (commentId: number, type: 'likes' | 'neutrals' | 'unlikes') => {
        try {
            await fetch(`http://localhost:8080/api/comments/${commentId}/react`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            fetchComments();
        } catch (error) {
            console.error("Failed to post reaction:", error);
        }
    };

    // 🚀 NEW: The Facebook-style Reply function
    const handleReply = (authorName: string) => {
        // 1. Add the @name to the text box
        setTextContent((prevText) => {
            const newText = prevText ? `${prevText} @${authorName} ` : `@${authorName} `;
            return newText;
        });

        // 2. Scroll to the text box and focus it automatically
        if (commentInputRef.current) {
            commentInputRef.current.focus();
            commentInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const verifyPhotoWithAI = async (photoFile: File, userComment: string, projectContext: string) => {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            match_score: { type: SchemaType.INTEGER, description: "Score 0 to 100. How accurate is the citizen's claim based on the photo?" },
                            reason: { type: SchemaType.STRING, description: "Brief explanation of the score." },
                            is_ghost_project: { type: SchemaType.BOOLEAN, description: "True if the user claims the project is abandoned, unfinished, or missing, AND the photo supports an empty/unfinished site." }
                        },
                        required: ["match_score", "reason", "is_ghost_project"]
                    }
                }
            });

            const base64Promise = new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(photoFile);
            });
            const inlineData = { data: await base64Promise, mimeType: photoFile.type };

            const prompt = `
                You are a government transparency auditor. 
                Official Project Details: "${projectContext}"
                Citizen's Claim: "${userComment}"
                
                Look at the attached photo. Does the photo prove the citizen's claim regarding the official project? 
                Provide a match_score from 0 to 100. 
                CRITICAL: If the citizen claims the project is a "ghost project", "abandoned", or "unfinished", and the photo shows a lack of progress, GIVE IT A HIGH SCORE (>80) and set is_ghost_project to true.
            `;

            const result = await model.generateContent([prompt, { inlineData } as any]);
            return JSON.parse(result.response.text());
        } catch (e) {
            console.error("AI Error:", e);
            return { match_score: 0, reason: "Verification failed", is_ghost_project: false };
        }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        let imageUrl = null;
        let aiResult = { match_score: 0, is_ghost_project: false };

        try {
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", UPLOAD_PRESET);
                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                    method: "POST", body: formData
                });
                imageUrl = (await uploadRes.json()).secure_url;

                const context = activeTab === "Overall Project"
                    ? project.ai_summary || project.description
                    : project.phases.find((p: any) => p.title === activeTab)?.description || project.title;

                aiResult = await verifyPhotoWithAI(file, textContent, context);
            }

            const finalAuthorName = isAnonymous ? 'Anonymous Citizen' : (user?.name || 'Citizen');

            await fetch("http://localhost:8080/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: id,
                    target_phase: activeTab,
                    author_name: finalAuthorName,
                    is_anonymous: isAnonymous,
                    text_content: textContent,
                    image_url: imageUrl,
                    ai_match_score: aiResult.match_score,
                    is_ghost_alert: aiResult.is_ghost_project
                })
            });

            setTextContent("");
            setFile(null);
            fetchComments();
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProgressData = (phases: any[]) => {
        if (!phases || phases.length === 0) return { percentage: 0, latestPhase: "No timeline set" };
        const completedPhases = phases.filter((p: any) => p.status === "completed" || p.image_url !== "");
        const percentage = Math.round((completedPhases.length / phases.length) * 100);
        const latestPhase = completedPhases.length > 0
            ? `Completed: ${completedPhases[completedPhases.length - 1].title}`
            : "Pending Start";
        return { percentage, latestPhase };
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "TBD";
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (!project) return (
        <div className="w-full py-20 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
    );

    const filteredComments = comments.filter(c => c.target_phase === activeTab);
    const { percentage, latestPhase } = getProgressData(project.phases);

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-10">

            {/* LEFT COLUMN: Project Details & Filtering */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div>
                    <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Feed
                    </Link>

                    <h1 className="text-3xl font-black mb-3 break-words leading-tight">{project.title}</h1>

                    <div className="flex flex-wrap gap-4 mb-5">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                            <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 block mb-0.5">Budget</span>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">₱{project.budget}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] uppercase font-black text-slate-500 block mb-0.5">Timeline</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatDate(project.start_date)} - {formatDate(project.completion_date)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                Progress: {percentage}%
                            </span>
                            <span className={`text-[10px] font-bold truncate max-w-[50%] text-right ${percentage === 100 ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {percentage === 100 ? "Fully Completed" : latestPhase}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'}`}
                            />
                        </div>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{project.description}</p>

                    {project.file_url && (
                        <a href={project.file_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors border border-blue-200 dark:border-blue-500/30 w-fit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            View Original Document
                        </a>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2 flex flex-col gap-1 border border-slate-200 dark:border-slate-800 mt-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider p-2">Filter by Phase</h3>

                    <button
                        onClick={() => setActiveTab("Overall Project")}
                        className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "Overall Project" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
                    >
                        Overall Project
                    </button>

                    {project.phases?.map((p: any) => (
                        <button
                            key={p.title}
                            onClick={() => setActiveTab(p.title)}
                            className={`text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === p.title ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
                        >
                            <span className="truncate pr-2">{p.title}</span>
                            {(p.status === "completed" || p.image_url) && (
                                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: Comments Feed */}
            <div className="w-full md:w-2/3 flex flex-col gap-6">

                {/* Submit Proof Form */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-black mb-1 text-slate-900 dark:text-white">Submit Proof for: <span className="text-indigo-600 dark:text-indigo-400">{activeTab}</span></h3>
                    <p className="text-xs text-slate-500 mb-4">Upload a photo to verify or dispute this project's status.</p>

                    <form onSubmit={submitComment} className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600 dark:text-slate-400">
                                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                Post Anonymously
                            </label>

                            {!isAnonymous && (
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Posting as: <strong className="text-slate-900 dark:text-white">{user?.name || "Citizen"}</strong>
                                </span>
                            )}
                        </div>

                        {/* 🚀 NEW: Added ref={commentInputRef} to control focus */}
                        <textarea
                            ref={commentInputRef}
                            required placeholder="Explain what the photo shows (e.g. 'Road is finished' or 'Nothing was built here')..." rows={3}
                            value={textContent} onChange={(e) => setTextContent(e.target.value)}
                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />

                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-500/10 file:text-indigo-600 dark:file:text-indigo-400 cursor-pointer" />
                            <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? "AI is Analyzing..." : "Post Proof"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Feed */}
                <h3 className="text-xl font-black mt-4 text-slate-900 dark:text-white">Community Evidence ({filteredComments.length})</h3>

                {filteredComments.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                        No proof submitted for this phase yet.
                    </div>
                ) : (
                    filteredComments.map((comment) => (
                        <div key={comment.id} className={`p-6 rounded-3xl border ${comment.is_ghost_alert ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : comment.ai_match_score >= 40 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>

                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-900 dark:text-white">{comment.author_name}</h4>

                                <div className="flex flex-col items-end">
                                    {comment.is_ghost_alert ? (
                                        <span className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-xs font-black px-3 py-1 rounded-full border border-red-200 dark:border-red-500/30">
                                            🚨 GHOST PROJECT ALERT
                                        </span>
                                    ) : comment.ai_match_score >= 80 ? (
                                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-black px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                                            ✓ High Match ({comment.ai_match_score}%)
                                        </span>
                                    ) : comment.ai_match_score >= 40 ? (
                                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-xs font-black px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/30">
                                            Partial Match ({comment.ai_match_score}%)
                                        </span>
                                    ) : (
                                        <span className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-xs font-black px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                            Low Match ({comment.ai_match_score}%)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 leading-relaxed">
                                {/* Format the tagged user with bold text so it looks like a real mention */}
                                {comment.text_content.split(' ').map((word: string, index: number) =>
                                    word.startsWith('@') ? <span key={index} className="font-bold text-indigo-600 dark:text-indigo-400">{word} </span> : `${word} `
                                )}
                            </p>

                            {comment.image_url && <img src={comment.image_url} alt="Proof" className="w-full rounded-xl mb-4 max-h-96 object-cover border border-slate-200 dark:border-slate-800" />}

                            {/* 🚀 NEW: Added the Reply button beside the reactions */}
                            <div className="flex flex-wrap items-center gap-6 border-t border-slate-200/60 dark:border-slate-800/60 pt-4 mt-2">
                                <button onClick={() => handleReaction(comment.id, 'likes')} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">👍 Accurate ({comment.likes})</button>
                                <button onClick={() => handleReaction(comment.id, 'neutrals')} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">😐 Unsure ({comment.neutrals})</button>
                                <button onClick={() => handleReaction(comment.id, 'unlikes')} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">👎 Inaccurate ({comment.unlikes})</button>

                                <button onClick={() => handleReply(comment.author_name)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 ml-auto transition-colors flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    Reply
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}