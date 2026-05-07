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

    useEffect(() => {
        fetchProject();
        fetchComments();
        if (user?.email) {
            fetch("http://localhost:8080/api/logs/create", {
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
            fetch(`http://localhost:8080/api/users/saved?email=${user.email}`)
                .then(res => res.json())
                .then(data => { if (data.saved_projects) setIsFollowed(data.saved_projects.includes(Number(id))); })
                .catch(console.error);
        }
    }, [user, id]);

    const toggleFollow = async () => {
        if (!user?.email) return alert("Please log in to follow projects.");
        setIsFollowed(!isFollowed);
        try {
            await fetch("http://localhost:8080/api/users/toggle-save", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, project_id: Number(id) })
            });
        } catch (error) { console.error("Failed to save project", error); }
    };

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
            await fetch(`http://localhost:8080/api/projects/${id}/react`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, user_email: user.email }) });
            fetchProject();
        } catch (error) { console.error("Failed to react:", error); }
    };

    const handleReaction = async (commentId: number, type: 'likes' | 'neutrals' | 'unlikes') => {
        if (!user?.email) return alert("Please log in to react.");
        try {
            await fetch(`http://localhost:8080/api/comments/${commentId}/react`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, user_email: user.email }) });
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

    if (!project) return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950">
            <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 rounded-full border-t-4 border-indigo-500 opacity-30"></motion.div>
                <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="h-16 w-16 rounded-full border-l-4 border-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]"></motion.div>
            </div>
            <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Syncing Nodes...</motion.p>
        </div>
    );

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
            <div key={comment.id} className="relative z-10">
                {isReply && <div className="absolute -left-4 sm:-left-6 top-6 w-4 sm:w-6 h-10 border-b-2 border-l-2 border-slate-200 dark:border-slate-700/50 rounded-bl-2xl z-0" />}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={` ${isReply ? 'ml-6 sm:ml-8 mt-4' : 'mt-8'} p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] relative z-10 ${isGhost ? 'bg-rose-50/80 dark:bg-rose-900/10 border-rose-200/60 dark:border-rose-500/20' : comment.ai_match_score >= 40 ? 'bg-emerald-50/80 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-500/20' : 'bg-white/80 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/50 backdrop-blur-xl'} `}>
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[0.8rem] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm border border-indigo-200/50 dark:border-indigo-500/30 shadow-inner">
                                {comment.author_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <Link to={`/public-profile/${encodeURIComponent(comment.author_name)}`} className="font-black text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-tight">
                                    {comment.author_name}
                                </Link>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{formatDateTime(comment.created_at)}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {isGhost ? (
                                <span className="bg-rose-100/80 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-rose-200/60 dark:border-rose-500/30 flex items-center gap-1.5 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                                    Ghost Flag
                                </span>
                            ) : comment.ai_match_score >= 80 ? (
                                <span className="bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    High Match ({comment.ai_match_score}%)
                                </span>
                            ) : comment.ai_match_score >= 40 ? (
                                <span className="bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-blue-200/60 dark:border-blue-500/30 shadow-sm">
                                    Partial ({comment.ai_match_score}%)
                                </span>
                            ) : comment.ai_match_score > 0 ? (
                                <span className="bg-slate-100/80 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-600/50 shadow-sm">
                                    Low ({comment.ai_match_score}%)
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {isReply && <div className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mb-3 flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> Replying to @{parentName}</div>}

                    <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-[1.25rem] border border-slate-100/50 dark:border-slate-800/50 shadow-inner mb-4">
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">"{comment.text_content}"</p>
                    </div>

                    {comment.image_url && (
                        <motion.div className="overflow-hidden rounded-[1.5rem] mb-5 border border-slate-200/50 dark:border-slate-700/50 shadow-md">
                            <motion.img whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} src={comment.image_url} alt="Proof" className="w-full max-h-96 object-cover" />
                        </motion.div>
                    )}

                    <div className="flex flex-wrap items-center justify-between border-t border-slate-200/60 dark:border-slate-700/50 pt-4 mt-2 gap-4">
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-[1rem] border border-slate-100 dark:border-slate-700/50 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                            <motion.button whileHover={{ scale: 1.15, rotate: -10 }} whileTap={{ scale: 0.9 }} onClick={() => handleReaction(comment.id, 'likes')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm">👍 <span>{comment.likes || 0}</span></motion.button>
                            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => handleReaction(comment.id, 'neutrals')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">😐 <span>{comment.neutrals || 0}</span></motion.button>
                            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                            <motion.button whileHover={{ scale: 1.15, rotate: 10 }} whileTap={{ scale: 0.9 }} onClick={() => handleReaction(comment.id, 'unlikes')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm">👎 <span>{comment.unlikes || 0}</span></motion.button>
                        </div>

                        <button onClick={() => initiateReply(comment.id, comment.author_name)} className="w-full sm:w-auto text-[11px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-all duration-300 transform active:scale-95 group/reply border border-indigo-100 dark:border-indigo-500/20">
                            <svg className="w-4 h-4 transform group-hover/reply:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            Reply to Thread
                        </button>
                    </div>
                </motion.div>
                {replies.length > 0 && (<div className="ml-3 sm:ml-6 border-l-2 border-slate-200 dark:border-slate-700/50 relative mt-2 z-0">{replies.map(reply => renderComment(reply, true, comment.author_name))}</div>)}
            </div>
        );
    };

    return (
        <div className="w-full min-h-screen relative overflow-x-hidden font-sans bg-slate-50 dark:bg-slate-950 selection:bg-indigo-500/30">
            <div className="fixed inset-0 pointer-events-none -z-20">
                <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                <motion.div animate={{ x: [0, -30, 0], y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 18, ease: "linear" }} className="absolute top-[20%] right-[-10%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-purple-500/10 dark:bg-purple-600/15 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <div className="relative max-w-[90rem] mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col xl:flex-row gap-8 xl:gap-12">
                <AnimatePresence>
                    {role === 'agency' && (
                        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] w-[90%] sm:w-auto shadow-2xl">
                            <button onClick={() => navigate('/agency/feedback')} className="w-full justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 py-3.5 sm:py-4 rounded-[1.25rem] flex items-center gap-3 text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                <span className="truncate">Return to Dashboard</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="w-full xl:w-[45%] flex flex-col gap-8">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0.4 }} className="flex flex-col gap-8 sticky top-8">
                        <div>
                            <Link to={role === 'agency' ? "/agency/feedback" : "/explore"} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/80 dark:border-slate-700/50 shadow-sm text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 hover:scale-105 transition-all duration-300 w-fit mb-6">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                {role === 'agency' ? "Dashboard" : "Feed"}
                            </Link>

                            <div className="flex justify-between items-start gap-6 mb-4">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black break-words leading-[1.1] tracking-tighter text-slate-900 dark:text-white drop-shadow-sm">{project.title}</h1>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleFollow} className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${isFollowed ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-500 border border-rose-200 dark:border-rose-500/30' : 'bg-white/80 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 hover:text-rose-400 border border-slate-200 dark:border-slate-700/50 backdrop-blur-md'}`}>
                                    <svg className="w-6 h-6" fill={isFollowed ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                </motion.button>
                            </div>

                            <div className="mb-8 flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 p-2 rounded-[1.25rem] w-fit border border-white/60 dark:border-slate-700/50 shadow-sm backdrop-blur-md">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-3">Managed By</span>
                                <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-all shadow-sm border border-indigo-100 dark:border-indigo-500/30">
                                    <span className="text-sm">🏛️</span> {orgName}
                                </Link>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <div className="bg-emerald-50/80 dark:bg-emerald-900/20 px-5 py-4 rounded-[1.5rem] border border-emerald-200/60 dark:border-emerald-500/20 flex-1 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-[0.07] dark:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">💰</div>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 dark:text-emerald-500 block mb-1 relative z-10">Budget Allocated</span>
                                    <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight relative z-10">₱{project.budget}</span>
                                </div>
                                <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md px-5 py-4 rounded-[1.5rem] border border-white/80 dark:border-slate-700/50 flex-1 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-[0.04] dark:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">🗓️</div>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 block mb-1 relative z-10">{isOverall ? "Overall Timeline" : "Phase Timeline"}</span>
                                    <span className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 relative z-10 flex flex-col gap-1 mt-2">
                                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>{formatDate(currentContextData?.start_date)}</span>
                                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>{formatDate(currentContextData?.completion_date)}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 mb-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        Completion: {percentage}%
                                    </span>
                                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest truncate max-w-[50%] text-right ${percentage === 100 ? 'text-emerald-500 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{percentage === 100 ? "Fully Completed" : latestPhase}</span>
                                </div>
                                <div className="w-full h-3 sm:h-4 bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-300/30 dark:border-slate-700/50">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.5, type: "spring", bounce: 0.2 }} className={`h-full rounded-full relative overflow-hidden ${percentage === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}>
                                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                    </motion.div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-5 mt-2 gap-4">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-full sm:w-auto text-center sm:text-left">Community Rating</span>
                                    <div className="flex gap-2 w-full sm:w-auto justify-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-[1.25rem] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                        <motion.button whileHover={{ scale: 1.1, rotate: -10 }} whileTap={{ scale: 0.9 }} onClick={() => handleProjectReaction('likes')} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-black text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm">👍 {project.likes || 0}</motion.button>
                                        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 my-auto"></div>
                                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleProjectReaction('neutrals')} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-black text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">😐 {project.neutrals || 0}</motion.button>
                                        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 my-auto"></div>
                                        <motion.button whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }} onClick={() => handleProjectReaction('unlikes')} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-black text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm">👎 {project.unlikes || 0}</motion.button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white/50 dark:border-slate-700/50 shadow-sm relative">
                                <span className="absolute top-4 left-4 text-4xl text-indigo-500/20 font-serif">"</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm md:text-[15px] leading-relaxed font-medium relative z-10 px-4 pt-4">{isOverall ? project.description : currentContextData?.description}</p>
                                <span className="absolute bottom-[-10px] right-6 text-4xl text-indigo-500/20 font-serif rotate-180">"</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="w-full xl:w-[55%] flex flex-col gap-8">
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0.4 }} className="flex flex-col gap-8">

                        <div className="relative z-20 w-full">
                            <div className="flex items-center gap-3 mb-5 px-2">
                                <div className="w-10 h-10 rounded-[0.8rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Select Scope</h3>
                            </div>

                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#F8FAFC] dark:from-[#0B1120] to-transparent z-10 pointer-events-none"></div>
                                <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#F8FAFC] dark:from-[#0B1120] to-transparent z-10 pointer-events-none"></div>

                                <div className="flex overflow-x-auto snap-x scrollbar-hide gap-3 sm:gap-4 pb-6 pt-2 px-2 sm:px-4">
                                    <button onClick={() => setActiveTab("Overall Project")} className={`shrink-0 snap-center relative flex flex-col justify-between p-4 sm:p-5 w-[140px] sm:w-[160px] h-[120px] sm:h-[130px] rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-300 transform-gpu overflow-hidden border ${activeTab === "Overall Project" ? "text-white dark:text-slate-900 border-transparent shadow-[0_10px_30px_rgba(99,102,241,0.3)] scale-105" : "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-white/80 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1"}`}>
                                        {activeTab === "Overall Project" && (
                                            <motion.div layoutId="activePhase" className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] sm:rounded-[2rem] -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                        )}
                                        <div className="flex justify-between items-start w-full relative z-10">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-inner ${activeTab === "Overall Project" ? "bg-white/20 dark:bg-black/10 text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-indigo-500"}`}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                        </div>
                                        <div className="text-left relative z-10 mt-auto">
                                            <span className={`block text-[10px] uppercase font-black tracking-widest mb-0.5 ${activeTab === "Overall Project" ? "opacity-80" : "text-slate-400"}`}>Primary</span>
                                            <span className="block text-sm sm:text-base font-black leading-tight truncate">Overall Project</span>
                                        </div>
                                    </button>

                                    {project.phases?.map((p: any, index: number) => {
                                        const isCompleted = p.status === "completed" || (p.image_url && p.image_url.trim() !== "");
                                        const isActive = activeTab === p.title;

                                        return (
                                            <button key={p.title} onClick={() => setActiveTab(p.title)} className={`shrink-0 snap-center relative flex flex-col justify-between p-4 sm:p-5 w-[140px] sm:w-[160px] h-[120px] sm:h-[130px] rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-300 transform-gpu overflow-hidden border ${isActive ? "text-white dark:text-slate-900 border-transparent shadow-[0_10px_30px_rgba(99,102,241,0.3)] scale-105" : "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-white/80 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1"}`}>
                                                {isActive && (
                                                    <motion.div layoutId="activePhase" className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] sm:rounded-[2rem] -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                                )}
                                                <div className="flex justify-between items-start w-full relative z-10">
                                                    <div className={`text-2xl sm:text-3xl font-black italic opacity-30 ${isActive ? "text-white dark:text-slate-900" : "text-slate-400"}`}>
                                                        #{index + 1}
                                                    </div>
                                                    {isCompleted && (
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${isActive ? "bg-white text-emerald-500 dark:bg-slate-900 dark:text-emerald-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"}`}>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-left relative z-10 mt-auto">
                                                    <span className={`block text-[9px] sm:text-[10px] uppercase font-black tracking-widest mb-0.5 ${isActive ? "opacity-80 text-indigo-100 dark:text-indigo-900" : "text-slate-400"}`}>{isCompleted ? "Completed" : "In Progress"}</span>
                                                    <span className="block text-sm sm:text-base font-black leading-tight line-clamp-2">{p.title}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-8 border border-white/80 dark:border-slate-700/50 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative overflow-hidden group">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 blur-[50px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-500 pointer-events-none"></div>

                            <div className="flex items-center justify-between mb-2 relative z-10">
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Submit Proof
                                </h3>
                                <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 truncate max-w-[150px] sm:max-w-[200px]">{activeTab}</span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium relative z-10">Upload photographic evidence to verify or dispute current progress.</p>

                            <form onSubmit={submitComment} className="flex flex-col gap-5 relative z-10">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-800/40 p-3 sm:p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                    <label className="flex items-center gap-3 cursor-pointer text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest group/anon">
                                        <div className="relative flex items-center justify-center">
                                            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="peer sr-opacity w-5 h-5 opacity-0 absolute cursor-pointer" />
                                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                                <svg className={`w-3.5 h-3.5 text-white transform transition-transform ${isAnonymous ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                        Post Anonymously
                                    </label>
                                    {!isAnonymous && (
                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                            Identity: <strong className="text-slate-900 dark:text-white">{user?.name || "Citizen"}</strong>
                                        </span>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {replyingTo && (
                                        <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} className="flex items-center justify-between bg-indigo-50/80 dark:bg-indigo-500/10 border-l-4 border-indigo-500 text-indigo-700 dark:text-indigo-400 px-4 py-3 rounded-r-[1.25rem] rounded-l-sm text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm">
                                            <span className="flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> Replying to @{replyingTo.name}</span>
                                            <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-rose-500 dark:hover:text-rose-400 transition-colors bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="relative group/textarea">
                                    <textarea ref={commentInputRef} required placeholder="Detail your observations here..." rows={4} value={textContent} onChange={(e) => setTextContent(e.target.value)} className="w-full p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-[15px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner resize-none leading-relaxed" />
                                    <div className="absolute bottom-4 right-4 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest pointer-events-none opacity-0 group-focus-within/textarea:opacity-100 transition-opacity">Audit Text Active</div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 sm:p-2 rounded-[1.5rem] sm:rounded-[1.25rem] border border-slate-200/80 dark:border-slate-700/50 gap-4 shadow-sm">
                                    <div className="relative flex-1">
                                        <input type="file" id="file-upload" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="sr-only" />
                                        <label htmlFor="file-upload" className="flex items-center justify-center sm:justify-start gap-2 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all w-full shadow-sm text-center sm:text-left">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            {file ? <span className="truncate max-w-[150px]">{file.name}</span> : "Attach Image Evidence"}
                                        </label>
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 px-8 py-3.5 sm:py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-[0_8px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 group/post">
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                Post Proof
                                                <svg className="w-3.5 h-3.5 transform group-hover/post:translate-x-1 group-hover/post:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between px-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-3 rounded-[1.25rem] border border-white/50 dark:border-slate-700/50 shadow-sm">
                                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                                    Audit Logs
                                </h3>
                                <span className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest shadow-sm border border-slate-100 dark:border-slate-700/50">{phaseComments.length} Entries</span>
                            </div>

                            {topLevelComments.length === 0 ? (
                                <div className="p-10 sm:p-16 text-center text-slate-400 bg-white/50 dark:bg-slate-800/30 backdrop-blur-xl rounded-[2.5rem] border-2 border-slate-200/60 dark:border-slate-700 border-dashed shadow-sm flex flex-col items-center">
                                    <div className="text-5xl mb-4 opacity-40 grayscale filter drop-shadow-md">📸</div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">No proof submitted for this scope yet. Be the first to verify.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    {topLevelComments.slice().reverse().map(comment => renderComment(comment, false))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}