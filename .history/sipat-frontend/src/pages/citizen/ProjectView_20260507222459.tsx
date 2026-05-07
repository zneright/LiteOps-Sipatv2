import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export default function ProjectView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const [project, setProject] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState("Overall Project");
    const [textContent, setTextContent] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: number, name: string } | null>(null);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    const [isFollowed, setIsFollowed] = useState(false);

    const CLOUD_NAME = "dupjdmjha";
    const UPLOAD_PRESET = "sipat_uploads";
    const GEMINI_API_KEY = "AIzaSyCkwsHcdpGCovR7FRdqhsN8gwCj3kFjbOg";
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

    useEffect(() => {
        fetchProject();
        fetchComments();
        if (user?.email) {
            fetch(`${API_URL}/api/logs/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    actor_email: user.email,
                    action_type: "VIEW",
                    description: `Viewed project details for Project ID #${id}`
                })
            }).catch(console.error);
        }
    }, [id]);

    useEffect(() => {
        if (user?.email && id) {
            fetch(`${API_URL}/api/users/saved?email=${user.email}`)
                .then(res => res.json())
                .then(data => { if (data.saved_projects) setIsFollowed(data.saved_projects.includes(Number(id))); })
                .catch(console.error);
        }
    }, [user, id]);

    const toggleFollow = async () => {
        if (!user?.email) return alert("Please log in to follow projects.");
        setIsFollowed(!isFollowed);
        try {
            await fetch(`${API_URL}/api/users/toggle-save`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, project_id: Number(id) })
            });
        } catch (error) { console.error("Failed to save project", error); }
    };

    const fetchProject = async () => {
        try {
            const res = await fetch(`${API_URL}/api/projects/${id}`);
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
            const res = await fetch(`${API_URL}/api/comments/${id}`);
            if (!res.ok) throw new Error("Failed to fetch comments");
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (error) { setComments([]); }
    };

    const handleProjectReaction = async (type: 'likes' | 'neutrals' | 'unlikes') => {
        if (!user?.email) return alert("Please log in to react.");
        try {
            await fetch(`${API_URL}/api/projects/${id}/react`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, user_email: user.email }) });
            fetchProject();
        } catch (error) { console.error("Failed to react:", error); }
    };

    const handleReaction = async (commentId: number, type: 'likes' | 'neutrals' | 'unlikes') => {
        if (!user?.email) return alert("Please log in to react.");
        try {
            await fetch(`${API_URL}/api/comments/${commentId}/react`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, user_email: user.email }) });
            fetchComments();
        } catch (error) { console.error("Failed to react:", error); }
    };

    const initiateReply = (commentId: number, authorName: string) => {
        setReplyingTo({ id: commentId, name: authorName });
        if (commentInputRef.current) {
            commentInputRef.current.focus();
            commentInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const verifyContentWithAI = async (userComment: string, projectContext: string, photoFile: File | null) => {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: { type: SchemaType.OBJECT, properties: { match_score: { type: SchemaType.INTEGER }, reason: { type: SchemaType.STRING }, is_ghost_project: { type: SchemaType.BOOLEAN } }, required: ["match_score", "reason", "is_ghost_project"] }
                }
            });

            let prompt = ""; let contentArray: any[] = [];

            if (photoFile) {
                const base64Promise = new Promise((resolve) => {
                    const reader = new FileReader(); reader.onloadend = () => resolve((reader.result as string).split(',')[1]); reader.readAsDataURL(photoFile);
                });
                const inlineData = { data: await base64Promise, mimeType: photoFile.type };
                prompt = `You are an AI auditing public infrastructure projects. \nOfficial Project Details: "${projectContext}"\nCitizen's Comment: "${userComment}"\n\nTask: Analyze both the attached photo AND the citizen's comment.\n1. match_score (0-100): How well does the visual evidence support the Official Details? Use the Citizen's Comment for context, but prioritize visual proof.\n2. is_ghost_project (boolean): Set to true ONLY if the citizen's comment suggests abandonment AND the photo visually proves it (e.g., dirt lots, severe decay). If the photo shows a completed project, this must be false.\n3. reason (string): Short 1-sentence explanation.`;
                contentArray = [prompt, { inlineData } as any];
            } else {
                prompt = `You are an AI auditing public infrastructure projects. \nOfficial Project Details: "${projectContext}"\nCitizen's Comment: "${userComment}"\n\nTask: Analyze the citizen's text comment.\n1. match_score (0-100): How positive and supportive is this comment regarding the project's progress? (100 = highly positive/confirming completion, 0 = highly negative/unrelated).\n2. is_ghost_project (boolean): Set to true ONLY if the comment explicitly claims the project is a "ghost project", abandoned, fake, or a scam.\n3. reason (string): Short 1-sentence explanation.`;
                contentArray = [prompt];
            }

            const result = await model.generateContent(contentArray);
            return JSON.parse(result.response.text());
        } catch (e: any) {
            console.error("Gemini API Error:", e);
            alert(`⚠️ AI WARNING: The AI failed to analyze this comment.\n\nReason: ${e.message}\n\nThe comment will still be posted, but without an AI score.`);
            return { match_score: 0, reason: "Verification failed", is_ghost_project: false };
        }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        let imageUrl = null;
        try {
            if (file) {
                const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", UPLOAD_PRESET);
                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: "POST", body: formData });
                imageUrl = (await uploadRes.json()).secure_url;
            }
            const context = activeTab === "Overall Project" ? project.ai_summary || project.description : project.phases.find((p: any) => p.title === activeTab)?.description || project.title;
            const aiResult = await verifyContentWithAI(textContent, context, file);
            const finalAuthorName = isAnonymous ? 'Anonymous Citizen' : (user?.name || 'Citizen');

            await fetch("http://localhost:8080/api/comments", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: id, user_email: user?.email, parent_id: replyingTo?.id || null, target_phase: activeTab, author_name: finalAuthorName, is_anonymous: isAnonymous, text_content: textContent, image_url: imageUrl, ai_match_score: aiResult.match_score, is_ghost_alert: aiResult.is_ghost_project })
            });
            setTextContent(""); setFile(null); setReplyingTo(null); fetchComments();
        } catch (error) { console.error("Submission Error:", error); alert("An error occurred while posting your comment."); } finally { setIsSubmitting(false); }
    };

    const getProgressData = (phases: any[]) => {
        if (!phases || phases.length === 0) return { percentage: 0, latestPhase: "No timeline set" };
        const completedPhases = phases.filter((p: any) => p.status === "completed" || (p.image_url && p.image_url.trim() !== ""));
        const percentage = Math.round((completedPhases.length / phases.length) * 100);
        return { percentage, latestPhase: completedPhases.length > 0 ? `Completed: ${completedPhases[completedPhases.length - 1].title}` : "Pending Start" };
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "TBD"; return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return "Just now"; return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (!project) return <div className="w-full py-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    const { percentage, latestPhase } = getProgressData(project.phases);
    const phaseComments = comments.filter(c => c.target_phase === activeTab);
    const topLevelComments = phaseComments.filter(c => !c.parent_id);
    const isOverall = activeTab === "Overall Project";
    const currentContextData = isOverall ? project : project.phases?.find((p: any) => p.title === activeTab);
    const orgName = project.organization_name || "DPWH";

    const renderComment = (comment: any, isReply = false, parentName = "") => {
        const replies = phaseComments.filter(c => c.parent_id === comment.id);
        const isGhost = Number(comment.is_ghost_alert) === 1;

        return (
            <div key={comment.id} className="relative">
                {isReply && <div className="absolute -left-3 sm:-left-6 top-6 w-3 sm:w-6 h-10 border-b-2 border-l-2 border-slate-200 dark:border-slate-800 rounded-bl-xl" />}
                <div className={` ${isReply ? 'ml-4 sm:ml-8 mt-3' : 'mt-6'} p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-sm transition-all ${isGhost ? 'bg-red-50 border-red-200' : comment.ai_match_score >= 40 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'} `}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-0.5">
                            <Link to={`/public-profile/${encodeURIComponent(comment.author_name)}`} className="font-bold text-xs sm:text-sm text-slate-900 hover:text-indigo-600 transition-colors">
                                {comment.author_name}
                            </Link>
                            <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">{formatDateTime(comment.created_at)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            {isGhost ? (<span className="bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md">🚨 GHOST</span>) : comment.ai_match_score >= 80 ? (<span className="bg-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md">✓ High Match ({comment.ai_match_score}%)</span>) : comment.ai_match_score >= 40 ? (<span className="bg-blue-100 text-blue-700 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md">Partial ({comment.ai_match_score}%)</span>) : comment.ai_match_score > 0 ? (<span className="bg-slate-100 text-slate-500 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md">Low ({comment.ai_match_score}%)</span>) : null}
                        </div>
                    </div>
                    {isReply && <div className="text-[10px] sm:text-[11px] font-bold text-indigo-500 mb-2">Replying to @{parentName}</div>}
                    <p className="text-slate-700 text-sm mb-4 leading-relaxed">{comment.text_content}</p>
                    {comment.image_url && <img src={comment.image_url} alt="Proof" className="w-full rounded-xl mb-4 max-h-80 object-cover border border-slate-200" />}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 border-t border-slate-200/60 pt-3 mt-1">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReaction(comment.id, 'likes')} className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">👍 {comment.likes || 0}</motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReaction(comment.id, 'neutrals')} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">😐 {comment.neutrals || 0}</motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReaction(comment.id, 'unlikes')} className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors">👎 {comment.unlikes || 0}</motion.button>
                        <button onClick={() => initiateReply(comment.id, comment.author_name)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 ml-auto flex items-center gap-1 transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> Reply</button>
                    </div>
                </div>
                {replies.length > 0 && (<div className="ml-2 sm:ml-4 border-l-2 border-slate-200 relative">{replies.map(reply => renderComment(reply, true, comment.author_name))}</div>)}
            </div>
        );
    };

    return (
        <div className="relative max-w-5xl mx-auto py-6 sm:py-10 px-4 flex flex-col md:flex-row gap-6 md:gap-10">
            <AnimatePresence>
                {role === 'agency' && (
                    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-[90%] sm:w-auto">
                        <button onClick={() => navigate('/agency/feedback')} className="w-full justify-center bg-slate-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 text-[10px] sm:text-sm font-black tracking-wider hover:scale-105 transition-all"><svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg><span className="truncate">RETURN TO AGENCY DASHBOARD</span></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div>
                    <Link to={role === 'agency' ? "/agency/feedback" : "/explore"} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-4"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>{role === 'agency' ? "Back to Dashboard" : "Back to Feed"}</Link>

                    <div className="flex justify-between items-start gap-4 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-black break-words leading-tight">{project.title}</h1>
                        <button onClick={toggleFollow} className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isFollowed ? 'bg-rose-100 text-rose-500 shadow-sm border border-rose-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-rose-400'}`}>
                            <svg className="w-5 h-5" fill={isFollowed ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </button>
                    </div>

                    <div className="mb-5 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Managed By:</span>
                        <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black uppercase hover:bg-indigo-100 transition-colors shadow-sm">🏛️ {orgName}</Link>
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4 mb-5">
                        <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex-1"><span className="text-[9px] uppercase font-black text-emerald-600 block mb-0.5">Budget</span><span className="text-sm font-bold text-emerald-700">₱{project.budget}</span></div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex-1"><span className="text-[9px] uppercase font-black text-slate-500 block mb-0.5">{isOverall ? "Overall Timeline" : "Phase Timeline"}</span><span className="text-sm font-bold text-slate-700">{formatDate(currentContextData?.start_date)} - {formatDate(currentContextData?.completion_date)}</span></div>
                    </div>

                    <div className="flex flex-col gap-1.5 mb-2 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                        <div className="flex justify-between items-end"><span className="text-xs font-black text-slate-500 uppercase tracking-widest">Progress: {percentage}%</span><span className={`text-[10px] font-bold truncate max-w-[50%] text-right ${percentage === 100 ? 'text-emerald-500' : 'text-indigo-600'}`}>{percentage === 100 ? "Fully Completed" : latestPhase}</span></div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3"><motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full rounded-full transition-all duration-1000 ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} /></div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:block">Rate Progress</span><div className="flex gap-4 w-full sm:w-auto justify-between sm:justify-start"><motion.button whileTap={{ scale: 0.8 }} onClick={() => handleProjectReaction('likes')} className="text-xs font-bold text-slate-500 hover:text-emerald-600">👍 {project.likes || 0}</motion.button><motion.button whileTap={{ scale: 0.8 }} onClick={() => handleProjectReaction('neutrals')} className="text-xs font-bold text-slate-500 hover:text-slate-900">😐 {project.neutrals || 0}</motion.button><motion.button whileTap={{ scale: 0.8 }} onClick={() => handleProjectReaction('unlikes')} className="text-xs font-bold text-slate-500 hover:text-red-600">👎 {project.unlikes || 0}</motion.button></div></div>
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed mt-4 bg-slate-50 p-4 rounded-2xl">{isOverall ? project.description : currentContextData?.description}</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-2 flex flex-row md:flex-col overflow-x-auto snap-x scrollbar-hide gap-2 border border-slate-200 mt-2 shadow-inner">
                    <h3 className="hidden md:block text-xs font-black text-slate-400 uppercase tracking-wider p-2">Filter by Phase</h3>
                    <button onClick={() => setActiveTab("Overall Project")} className={`shrink-0 md:w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all snap-center ${activeTab === "Overall Project" ? "bg-white shadow-sm border-slate-200 text-indigo-600 scale-[1.02]" : "text-slate-500 hover:bg-slate-100 border-transparent border"}`}>Overall Project</button>
                    {project.phases?.map((p: any) => (
                        <button key={p.title} onClick={() => setActiveTab(p.title)} className={`shrink-0 md:w-full text-left flex flex-col justify-center px-4 py-2 sm:py-3 rounded-xl transition-all border snap-center ${activeTab === p.title ? "bg-white shadow-sm border-slate-200 text-indigo-600 scale-[1.02]" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}>
                            <div className="flex items-center justify-between w-full gap-2"><span className={`text-sm font-bold truncate ${activeTab === p.title ? "text-indigo-600" : "text-slate-600"}`}>{p.title}</span>{(p.status === "completed" || (p.image_url && p.image_url.trim() !== "")) && <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}</div>
                            {(p.start_date || p.completion_date) && (<span className="text-[10px] font-bold text-slate-400 mt-1 hidden sm:block">{formatDate(p.start_date)} - {formatDate(p.completion_date)}</span>)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full md:w-2/3 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-base sm:text-lg font-black mb-1 relative z-10">Submit Proof for: <span className="text-indigo-600">{activeTab}</span></h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mb-4 relative z-10">Upload a photo to verify or dispute this project's status.</p>

                    <form onSubmit={submitComment} className="flex flex-col gap-4 relative z-10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600"><input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300" /> Post Anonymously</label>
                            {!isAnonymous && (<span className="text-xs sm:text-sm font-medium text-slate-500">Posting as: <strong className="text-slate-900">{user?.name || "Citizen"}</strong></span>)}
                        </div>

                        {replyingTo && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700 px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg text-xs font-bold">
                                <span>Replying to @{replyingTo.name}</span><button type="button" onClick={() => setReplyingTo(null)} className="hover:text-red-500">✕ Cancel</button>
                            </motion.div>
                        )}

                        <textarea ref={commentInputRef} required placeholder="Explain what the photo shows..." rows={3} value={textContent} onChange={(e) => setTextContent(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" />
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-50 p-2 rounded-xl border border-slate-200 gap-3">
                            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm w-full sm:w-auto file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer transition-colors" />
                            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 sm:py-2 rounded-lg font-bold text-sm transition-transform active:scale-95 shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
                                {isSubmitting ? (<><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing...</>) : "Post Proof"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">Community Evidence</h3>
                    <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full text-xs">{phaseComments.length} entries</span>
                </div>

                {topLevelComments.length === 0 ? (
                    <div className="p-6 sm:p-10 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                        <div className="text-4xl mb-3 opacity-50">📸</div><p className="text-sm font-bold text-slate-500">No proof submitted yet.</p>
                    </div>
                ) : (topLevelComments.map(comment => renderComment(comment, false)))}
            </div>
        </div>
    );
}