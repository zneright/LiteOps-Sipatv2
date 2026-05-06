import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectView() {
    const { id } = useParams();
    const [project, setProject] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState("Whole Project");

    // Comment Form State
    const [textContent, setTextContent] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [authorName, setAuthorName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

            // 🚀 SAFELY parse the phases to prevent React from crashing
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
            // 🚀 Ensure it's ALWAYS an array so .map() doesn't crash the page
            setComments(Array.isArray(data) ? data : []);

        } catch (error) {
            console.error("Error loading comments:", error);
            setComments([]); // Fallback to empty array
        }
    };

    // --- 🚀 ADVANCED AI SCORING & GHOST PROJECT DETECTION ---
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
                // Upload to Cloudinary
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", UPLOAD_PRESET);
                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                    method: "POST", body: formData
                });
                imageUrl = (await uploadRes.json()).secure_url;

                // Determine context based on the active tab
                const context = activeTab === "Whole Project"
                    ? project.ai_summary || project.description
                    : project.phases.find((p: any) => p.title === activeTab)?.description || project.title;

                aiResult = await verifyPhotoWithAI(file, textContent, context);
            }

            // Save to Database
            await fetch("http://localhost:8080/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: id,
                    target_phase: activeTab, // Automatically tags the active tab!
                    author_name: authorName,
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

    if (!project) return <div>Loading...</div>;

    // Filter comments based on the selected tab
    const filteredComments = comments.filter(c => c.target_phase === activeTab);

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-10">

            {/* LEFT COLUMN: Project Details & Filtering */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-black mb-2">{project.title}</h1>
                    <p className="text-sm font-bold text-emerald-600 mb-4">Budget: ₱{project.budget}</p>
                    <p className="text-slate-500 text-sm">{project.description}</p>
                </div>

                {/* 🚀 Phase Tabs for Filtering */}
                <div className="bg-slate-50 rounded-2xl p-2 flex flex-col gap-1 border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider p-2">Filter by Phase</h3>

                    <button
                        onClick={() => setActiveTab("Whole Project")}
                        className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "Whole Project" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:bg-slate-100"}`}
                    >
                        Whole Project
                    </button>

                    {project.phases?.map((p: any) => (
                        <button
                            key={p.title}
                            onClick={() => setActiveTab(p.title)}
                            className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === p.title ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:bg-slate-100"}`}
                        >
                            {p.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: Comments Feed */}
            <div className="w-full md:w-2/3 flex flex-col gap-6">

                {/* Submit Proof Form */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black mb-1">Submit Proof for: <span className="text-indigo-600">{activeTab}</span></h3>
                    <p className="text-xs text-slate-500 mb-4">Upload a photo to verify or dispute this project's status.</p>

                    <form onSubmit={submitComment} className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600">
                                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 text-indigo-600" />
                                Anonymous
                            </label>
                            {!isAnonymous && (
                                <input type="text" placeholder="Your Name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full text-sm p-2 bg-slate-50 rounded-lg outline-none" required />
                            )}
                        </div>

                        <textarea
                            required placeholder="Explain what the photo shows (e.g. 'Road is finished' or 'Nothing was built here')..." rows={3}
                            value={textContent} onChange={(e) => setTextContent(e.target.value)}
                            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />

                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600" />
                            <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors">
                                {isSubmitting ? "AI is Analyzing..." : "Post Proof"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Feed */}
                <h3 className="text-xl font-black mt-4">Community Evidence ({filteredComments.length})</h3>

                {filteredComments.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                        No proof submitted for this phase yet.
                    </div>
                ) : (
                    filteredComments.map((comment) => (
                        <div key={comment.id} className={`p-6 rounded-3xl border ${comment.is_ghost_alert ? 'bg-red-50 border-red-200' : comment.ai_match_score >= 40 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>

                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-900">{comment.author_name}</h4>

                                {/* 🚀 Dynamic AI Badges based on Score */}
                                <div className="flex flex-col items-end">
                                    {comment.is_ghost_alert ? (
                                        <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-full">
                                            🚨 GHOST PROJECT ALERT
                                        </span>
                                    ) : comment.ai_match_score >= 80 ? (
                                        <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full">
                                            ✓ High Match ({comment.ai_match_score}%)
                                        </span>
                                    ) : comment.ai_match_score >= 40 ? (
                                        <span className="bg-blue-100 text-blue-700 text-xs font-black px-3 py-1 rounded-full">
                                            Partial Match ({comment.ai_match_score}%)
                                        </span>
                                    ) : (
                                        <span className="bg-slate-100 text-slate-500 text-xs font-black px-3 py-1 rounded-full">
                                            Low Match ({comment.ai_match_score}%)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p className="text-slate-700 text-sm mb-4 leading-relaxed">{comment.text_content}</p>
                            {comment.image_url && <img src={comment.image_url} alt="Proof" className="w-full rounded-xl mb-4 max-h-96 object-cover" />}

                            <div className="flex gap-6 border-t border-slate-200/60 pt-4">
                                <button onClick={() => handleReaction(comment.id, 'likes')} className="text-xs font-bold text-slate-500 hover:text-emerald-600">👍 Accurate ({comment.likes})</button>
                                <button onClick={() => handleReaction(comment.id, 'neutrals')} className="text-xs font-bold text-slate-500 hover:text-slate-900">😐 Unsure ({comment.neutrals})</button>
                                <button onClick={() => handleReaction(comment.id, 'unlikes')} className="text-xs font-bold text-slate-500 hover:text-red-600">👎 Inaccurate ({comment.unlikes})</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}