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

    const [replyingTo, setReplyingTo] = useState<{ id: number, name: string } | null>(null);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    const CLOUD_NAME = "dupjdmjha";
    const UPLOAD_PRESET = "sipat_uploads";
  const GEMINI_API_KEY = "AIzaSyDiX2AbY2y0CvDUTh3u6Bgg9E6aWcztos4";
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
                if (data.phases && typeof data.phases === 'string') parsedPhases = JSON.parse(data.phases);
                else if (Array.isArray(data.phases)) parsedPhases = data.phases;
            } catch (e) { }

            data.phases = parsedPhases;
            setProject(data);
        } catch (error) { console.error("Error loading project:", error); }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/comments/${id}`);
            if (!res.ok) throw new Error("Failed to fetch comments");
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (error) { setComments([]); }
    };

    const handleProjectReaction = async (type: 'likes' | 'neutrals' | 'unlikes') => {
        if (!user?.email) return alert("Please log in to react.");
        try {
            await fetch(`http://localhost:8080/api/projects/${id}/react`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, user_email: user.email })
            });
            fetchProject();
        } catch (error) { console.error("Failed to react to project:", error); }
    };

    const handleReaction = async (commentId: number, type: 'likes' | 'neutrals' | 'unlikes') => {
        if (!user?.email) return alert("Please log in to react.");
        try {
            await fetch(`http://localhost:8080/api/comments/${commentId}/react`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, user_email: user.email })
            });
            fetchComments();
        } catch (error) { console.error("Failed to post reaction:", error); }
    };

    const initiateReply = (commentId: number, authorName: string) => {
        setReplyingTo({ id: commentId, name: authorName });
        if (commentInputRef.current) {
            commentInputRef.current.focus();
            commentInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const verifyPhotoWithAI = async (photoFile: File, userComment: string, projectContext: string) => {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            match_score: { type: SchemaType.INTEGER },
                            reason: { type: SchemaType.STRING },
                            is_ghost_project: { type: SchemaType.BOOLEAN }
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

            const prompt = `Official Project Details: "${projectContext}". Citizen's Claim: "${userComment}". Does photo prove claim? match_score 0-100. If ghost project/unfinished, set is_ghost_project true and score >80.`;
            const result = await model.generateContent([prompt, { inlineData } as any]);
            return JSON.parse(result.response.text());
        } catch (e) { return { match_score: 0, reason: "Verification failed", is_ghost_project: false }; }
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
                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: "POST", body: formData });
                imageUrl = (await uploadRes.json()).secure_url;
                const context = activeTab === "Overall Project" ? project.ai_summary || project.description : project.phases.find((p: any) => p.title === activeTab)?.description || project.title;
                aiResult = await verifyPhotoWithAI(file, textContent, context);
            }

            const finalAuthorName = isAnonymous ? 'Anonymous Citizen' : (user?.name || 'Citizen');

            await fetch("http://localhost:8080/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: id,
                    parent_id: replyingTo?.id || null,
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
            setReplyingTo(null);
            fetchComments();
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProgressData = (phases: any[]) => {
        if (!phases || phases.length === 0) return { percentage: 0, latestPhase: "No timeline set" };
        const completedPhases = phases.filter((p: any) => p.status === "completed" || (p.image_url && p.image_url.trim() !== ""));
        const percentage = Math.round((completedPhases.length / phases.length) * 100);
        const latestPhase = completedPhases.length > 0 ? `Completed: ${completedPhases[completedPhases.length - 1].title}` : "Pending Start";
        return { percentage, latestPhase };
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "TBD";
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (!project) return <div className="w-full py-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    const { percentage, latestPhase } = getProgressData(project.phases);
    const phaseComments = comments.filter(c => c.target_phase === activeTab);
    const topLevelComments = phaseComments.filter(c => !c.parent_id);

    const isOverall = activeTab === "Overall Project";
    const currentContextData = isOverall ? project : project.phases?.find((p: any) => p.title === activeTab);

    const renderComment = (comment: any, isReply = false) => {
        const replies = phaseComments.filter(c => c.parent_id === comment.id);

        return (
            <div key={comment.id} className={`${isReply ? 'ml-8 md:ml-12 mt-4 pl-4 border-l-2 border-slate-200 dark:border-slate-800' : 'p-6 rounded-3xl border shadow-sm mt-6'} ${comment.is_ghost_alert ? 'bg-red-50 dark:bg-red-500/10 border-red-200' : comment.ai_match_score >= 40 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>

                <div className="flex justify-between items-start mb-4">
                    <Link to={`/profile/${encodeURIComponent(comment.author_name)}`} className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {comment.author_name}
                    </Link>

                    <div className="flex flex-col items-end">
                        {comment.is_ghost_alert ? (
                            <span className="bg-red-100 text-red-700 text-[10px] font-black px-3 py-1 rounded-full">🚨 GHOST PROJECT ALERT</span>
                        ) : comment.ai_match_score >= 80 ? (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full">✓ High Match ({comment.ai_match_score}%)</span>
                        ) : comment.ai_match_score >= 40 ? (
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full">Partial Match ({comment.ai_match_score}%)</span>
                        ) : comment.ai_match_score > 0 ? (
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full">Low Match ({comment.ai_match_score}%)</span>
                        ) : null}
                    </div>
                </div>

                <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 leading-relaxed">{comment.text_content}</p>
                {comment.image_url && <img src={comment.image_url} alt="Proof" className="w-full rounded-xl mb-4 max-h-96 object-cover border border-slate-200 dark:border-slate-800" />}

                <div className="flex flex-wrap items-center gap-6 border-t border-slate-200/60 dark:border-slate-800/60 pt-4 mt-2">
                    <button onClick={() => handleReaction(comment.id, 'likes')} className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">👍 ({comment.likes || 0})</button>
                    <button onClick={() => handleReaction(comment.id, 'neutrals')} className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">😐 ({comment.neutrals || 0})</button>
                    <button onClick={() => handleReaction(comment.id, 'unlikes')} className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors">👎 ({comment.unlikes || 0})</button>

                    {!isReply && (
                        <button onClick={() => initiateReply(comment.id, comment.author_name)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 ml-auto flex items-center gap-1 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            Reply
                        </button>
                    )}
                </div>

                {replies.map(reply => renderComment(reply, true))}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-10">

            {/* LEFT COLUMN */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div>
                    <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Feed
                    </Link>

                    <h1 className="text-3xl font-black mb-3 break-words leading-tight">{project.title}</h1>

                    <div className="flex flex-wrap gap-4 mb-5">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <span className="text-[10px] uppercase font-black text-emerald-600 block mb-0.5">Budget</span>
                            <span className="text-sm font-bold text-emerald-700">₱{project.budget}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] uppercase font-black text-slate-500 block mb-0.5">
                                {isOverall ? "Overall Timeline" : "Phase Timeline"}
                            </span>
                            <span className="text-sm font-bold text-slate-700">
                                {formatDate(currentContextData?.start_date)} - {formatDate(currentContextData?.completion_date)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mb-2 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Progress: {percentage}%</span>
                            <span className={`text-[10px] font-bold truncate max-w-[50%] text-right ${percentage === 100 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                                {percentage === 100 ? "Fully Completed" : latestPhase}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full rounded-full transition-all duration-1000 ease-out ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} />
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Rate Progress</span>
                            <div className="flex gap-4">
                                <button onClick={() => handleProjectReaction('likes')} className="text-xs font-bold text-slate-500 hover:text-emerald-600">👍 {project.likes || 0}</button>
                                <button onClick={() => handleProjectReaction('neutrals')} className="text-xs font-bold text-slate-500 hover:text-slate-900">😐 {project.neutrals || 0}</button>
                                <button onClick={() => handleProjectReaction('unlikes')} className="text-xs font-bold text-slate-500 hover:text-red-600">👎 {project.unlikes || 0}</button>
                            </div>
                        </div>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-4">
                        {isOverall ? project.description : currentContextData?.description}
                    </p>

                    {project.file_url && (
                        <a href={project.file_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl border border-blue-200 w-fit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            View Original Document
                        </a>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2 flex flex-col gap-1 border border-slate-200 mt-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider p-2">Filter by Phase</h3>

                    <button onClick={() => setActiveTab("Overall Project")} className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "Overall Project" ? "bg-white shadow-sm border-slate-200 text-indigo-600" : "text-slate-500 hover:bg-slate-100 border-transparent border"}`}>
                        Overall Project
                    </button>

                    {/* 🚀 FIX: Redesigned Phase Buttons to explicitly show the Phase Dates */}
                    {project.phases?.map((p: any) => (
                        <button key={p.title} onClick={() => setActiveTab(p.title)} className={`text-left flex flex-col justify-center px-4 py-3 rounded-xl transition-all border ${activeTab === p.title ? "bg-white shadow-sm border-slate-200 text-indigo-600" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}>
                            <div className="flex items-center justify-between w-full">
                                <span className={`text-sm font-bold truncate pr-2 ${activeTab === p.title ? "text-indigo-600" : "text-slate-600"}`}>{p.title}</span>
                                {(p.status === "completed" || (p.image_url && p.image_url.trim() !== "")) && <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>

                            {(p.start_date || p.completion_date) && (
                                <span className="text-[10px] font-bold text-slate-400 mt-1">
                                    {formatDate(p.start_date)} - {formatDate(p.completion_date)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="w-full md:w-2/3 flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black mb-1 text-slate-900 dark:text-white">Submit Proof for: <span className="text-indigo-600">{activeTab}</span></h3>
                    <p className="text-xs text-slate-500 mb-4">Upload a photo to verify or dispute this project's status.</p>

                    <form onSubmit={submitComment} className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600">
                                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 text-indigo-600" />
                                Post Anonymously
                            </label>
                            {!isAnonymous && (
                                <span className="text-sm font-medium text-slate-500">Posting as: <strong className="text-slate-900 dark:text-white">{user?.name || "Citizen"}</strong></span>
                            )}
                        </div>

                        {replyingTo && (
                            <div className="flex items-center justify-between bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-xs font-bold border border-indigo-100">
                                <span>Replying to {replyingTo.name}</span>
                                <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-red-500">✕ Cancel</button>
                            </div>
                        )}

                        <textarea
                            ref={commentInputRef}
                            required placeholder="Explain what the photo shows..." rows={3}
                            value={textContent} onChange={(e) => setTextContent(e.target.value)}
                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />

                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-200">
                            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 cursor-pointer" />
                            <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50">
                                {isSubmitting ? "AI is Analyzing..." : "Post Proof"}
                            </button>
                        </div>
                    </form>
                </div>

                <h3 className="text-xl font-black mt-4 text-slate-900 dark:text-white">Community Evidence ({phaseComments.length})</h3>

                {topLevelComments.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 border-dashed">
                        No proof submitted for this phase yet.
                    </div>
                ) : (
                    topLevelComments.map(comment => renderComment(comment, false))
                )}
            </div>
        </div>
    );
}