import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { motion } from "framer-motion";

export default function ProjectView() {
    const { id } = useParams();
    const [project, setProject] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);

    // Comment Form State
    const [targetPhase, setTargetPhase] = useState("Whole Project");
    const [textContent, setTextContent] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [authorName, setAuthorName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Constants
    const CLOUD_NAME = "dupjdmjha";
    const UPLOAD_PRESET = "sipat_uploads";
    const GEMINI_API_KEY = "YOUR_API_KEY_HERE"; // Be careful exposing this!

    useEffect(() => {
        fetchProject();
        fetchComments();
    }, [id]);

    const fetchProject = async () => {
        const res = await fetch(`http://localhost:8080/api/projects/${id}`);
        const data = await res.json();
        data.phases = JSON.parse(data.phases || "[]");
        setProject(data);
    };

    const fetchComments = async () => {
        const res = await fetch(`http://localhost:8080/api/comments/${id}`);
        setComments(await res.json());
    };

    const handleReaction = async (commentId: number, type: string) => {
        await fetch(`http://localhost:8080/api/comments/${commentId}/react`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type })
        });
        fetchComments(); // Refresh counts
    };

    // --- AI VERIFICATION LOGIC ---
    const verifyPhotoWithAI = async (photoFile: File, projectContext: string): Promise<boolean> => {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            is_match: { type: SchemaType.BOOLEAN, description: "True if the image matches the project context" },
                            reason: { type: SchemaType.STRING, description: "Why it matches or doesn't" }
                        },
                        required: ["is_match", "reason"]
                    }
                }
            });

            // Convert file to base64
            const base64Promise = new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(photoFile);
            });
            const inlineData = { data: await base64Promise, mimeType: photoFile.type };

            const prompt = `You are a public works auditor. The user claims this photo shows progress on this project context: "${projectContext}". Does the photo visually support this claim?`;

            const result = await model.generateContent([prompt, { inlineData } as any]);
            const aiData = JSON.parse(result.response.text());

            console.log("AI Verification Result:", aiData);
            return aiData.is_match;
        } catch (e) {
            console.error("AI Error:", e);
            return false; // Fail safe
        }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        let imageUrl = null;
        let aiVerified = false;

        try {
            // 1. Upload Image & Run AI Validation
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", UPLOAD_PRESET);

                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                    method: "POST", body: formData
                });
                imageUrl = (await uploadRes.json()).secure_url;

                // Context: Send the project description or the specific phase to the AI
                const context = targetPhase === "Whole Project"
                    ? project.description
                    : project.phases.find((p: any) => p.title === targetPhase)?.description || project.title;

                aiVerified = await verifyPhotoWithAI(file, context);
            }

            // 2. Save to DB
            await fetch("http://localhost:8080/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: id,
                    target_phase: targetPhase,
                    author_name: authorName,
                    is_anonymous: isAnonymous,
                    text_content: textContent,
                    image_url: imageUrl,
                    ai_verified: aiVerified
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

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            {/* --- PROJECT HEADER --- */}
            <h1 className="text-4xl font-black mb-2">{project.title}</h1>
            <p className="text-slate-500 mb-8">{project.description}</p>

            {/* --- PUBLIC AUDIT / COMMENTS SECTION --- */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
                <h3 className="text-xl font-bold mb-4">Submit Public Proof</h3>

                <form onSubmit={submitComment} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <select
                            value={targetPhase}
                            onChange={(e) => setTargetPhase(e.target.value)}
                            className="p-3 rounded-lg border border-slate-200"
                        >
                            <option value="Whole Project">Whole Project</option>
                            {project.phases?.map((p: any) => (
                                <option key={p.title} value={p.title}>{p.title}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600">
                                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 text-indigo-600" />
                                Post Anonymously
                            </label>
                            {!isAnonymous && (
                                <input type="text" placeholder="Your Name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full text-sm outline-none" required />
                            )}
                        </div>
                    </div>

                    <textarea
                        required placeholder="Describe what you see at the site..." rows={3}
                        value={textContent} onChange={(e) => setTextContent(e.target.value)}
                        className="w-full p-4 rounded-lg border border-slate-200"
                    />

                    <div className="flex justify-between items-center">
                        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">
                            {isSubmitting ? "Verifying AI..." : "Post Proof"}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- COMMENTS FEED --- */}
            <div className="flex flex-col gap-6">
                <h3 className="text-2xl font-black">Community Evidence</h3>

                {comments.map((comment) => (
                    <div key={comment.id} className={`p-6 rounded-2xl border ${comment.ai_verified ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-slate-900">{comment.author_name}</h4>
                                <p className="text-xs text-slate-500 font-medium">
                                    Commenting on: <span className="text-indigo-600">{comment.target_phase}</span>
                                </p>
                            </div>

                            {/* 🚀 AI Verification Badge */}
                            {comment.ai_verified && (
                                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                                    ✓ AI Verified Proof
                                </span>
                            )}
                        </div>

                        <p className="text-slate-700 mb-4">{comment.text_content}</p>
                        {comment.image_url && <img src={comment.image_url} alt="Proof" className="w-full max-w-sm rounded-lg mb-4" />}

                        {/* Reactions */}
                        <div className="flex gap-4 border-t border-slate-200/60 pt-4">
                            <button onClick={() => handleReaction(comment.id, 'likes')} className="text-sm font-bold text-slate-500 hover:text-emerald-600">
                                👍 Looks Legit ({comment.likes})
                            </button>
                            <button onClick={() => handleReaction(comment.id, 'neutrals')} className="text-sm font-bold text-slate-500 hover:text-slate-900">
                                😐 Unsure ({comment.neutrals})
                            </button>
                            <button onClick={() => handleReaction(comment.id, 'unlikes')} className="text-sm font-bold text-slate-500 hover:text-red-600">
                                👎 Fake/Incorrect ({comment.unlikes})
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}