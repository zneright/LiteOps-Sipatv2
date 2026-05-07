import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const categoryMetadata = [
    { name: "Infrastructure", icon: "🏗️", gradient: "from-blue-500 to-indigo-600" },
    { name: "Technology", icon: "⚡", gradient: "from-violet-500 to-purple-600" },
    { name: "Environment", icon: "🌿", gradient: "from-emerald-500 to-teal-600" },
    { name: "Healthcare", icon: "🏥", gradient: "from-rose-500 to-orange-500" },
    { name: "Education", icon: "🎓", gradient: "from-cyan-500 to-blue-500" },
    { name: "Transport", icon: "🚌", gradient: "from-orange-500 to-amber-500" },
];

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const [isLoading, setIsLoading] = useState(true);
    const [loadingText, setLoadingText] = useState("Scanning database...");
    const [projects, setProjects] = useState<any[]>([]);
    const [agencies, setAgencies] = useState<any[]>([]);

    const GEMINI_API_KEY = "AIzaSyDiX2AbY2y0CvDUTh3u6Bgg9E6aWcztos4";

    const getExactCategoryUI = (categoryName: string) => {
        const found = categoryMetadata.find(c => c.name.toLowerCase() === (categoryName || "").toLowerCase().trim());
        if (found) return { bg: found.gradient, icon: found.icon };
        return { bg: "from-slate-500 to-slate-700", icon: "📁" };
    };

    useEffect(() => {
        const performSemanticSearch = async () => {
            setIsLoading(true);
            setLoadingText("Scanning database...");

            try {
                // 1. Fetch Standard SQL Results
                const response = await fetch(`http://localhost:8080/api/projects/search?q=${encodeURIComponent(query)}`);
                let sqlData = { projects: [], agencies: [] };
                if (response.ok) sqlData = await response.json();

                // 2. Fetch ALL projects for AI Deep Scan
                setLoadingText("AI is reading PDF summaries...");
                const allRes = await fetch("http://localhost:8080/api/projects");
                const allProjects = await allRes.json();

                // Prepare lightweight payload for AI to save tokens
                const lightweightProjects = allProjects.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    summary: p.ai_summary || p.description,
                    keywords: p.keywords
                }));

                // 3. AI Semantic Filtering
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash-lite",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: SchemaType.OBJECT,
                            properties: {
                                matched_project_ids: {
                                    type: SchemaType.ARRAY,
                                    items: { type: SchemaType.INTEGER },
                                    description: "List of project IDs that semantically match the user's search query based on the title, keywords, or AI document summary."
                                }
                            },
                            required: ["matched_project_ids"]
                        }
                    }
                });

                const prompt = `
            User Search Query: "${query}"
            
            Here is a list of all public infrastructure projects:
            ${JSON.stringify(lightweightProjects)}
            
            Task: Perform a semantic search. Find any projects where the search query matches the intent or meaning of the project's title, keywords, or summary. 
            Return the IDs of the matching projects.
        `;

                const aiResult = await model.generateContent(prompt);
                const parsedAI = JSON.parse(aiResult.response.text());
                const aiMatchedIds = parsedAI.matched_project_ids || [];

                // 4. Combine SQL Matches + AI Semantic Matches
                const finalProjects = allProjects.filter((p: any) =>
                    sqlData.projects.some((sqlP: any) => sqlP.id === p.id) || aiMatchedIds.includes(p.id)
                ).map((p: any) => ({
                    ...p,
                    ui: getExactCategoryUI(p.category)
                }));

                setProjects(finalProjects);
                setAgencies(sqlData.agencies || []);

            } catch (error) {
                console.error("Search Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (query) {
            performSemanticSearch();
        } else {
            setIsLoading(false);
        }
    }, [query]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "TBD";
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8 pb-20">

            {/* Header */}
            <section className="flex flex-col gap-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
                    AI Semantic Search Results
                </p>
                <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                    "{query}"
                </motion.h1>
            </section>

            {isLoading ? (
                <div className="w-full py-32 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-xl">✨</div>
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 animate-pulse">{loadingText}</p>
                </div>
            ) : projects.length === 0 && agencies.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="text-5xl mb-6">🕵️‍♂️</div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No matches found</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">Our AI couldn't find any projects or scanned documents matching "{query}".</p>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-12">

                    {/* 🚀 AGENCY MATCHES */}
                    {agencies.length > 0 && (
                        <section>
                            <h2 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                Agencies & LGUs
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {agencies.map((agency) => (
                                    <Link key={agency.id} to={`/agency-profile/${encodeURIComponent(agency.organization_name)}`} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-3xl font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {agency.organization_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">{agency.organization_name}</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mt-1">
                                                <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg> Official Account
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 🚀 PROJECT MATCHES */}
                    {projects.length > 0 && (
                        <section>
                            <h2 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                Infrastructure Projects
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {projects.map((project, idx) => {
                                        const orgName = project.organization_name || "DPWH";

                                        return (
                                            <motion.div key={project.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative hover:-translate-y-1">

                                                {/* Pure UI Header */}
                                                <Link to={`/project/${project.id}`} className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${project.ui.bg} relative overflow-hidden flex flex-col items-center justify-center shadow-inner block`}>
                                                    <div className="absolute inset-0 opacity-30 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-overlay">
                                                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /></svg>
                                                    </div>
                                                    <span className="text-6xl mb-3 drop-shadow-xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">{project.ui.icon}</span>
                                                    <span className="text-white/95 font-black text-xl text-center px-6 mix-blend-overlay line-clamp-2 leading-tight drop-shadow-md group-hover:-translate-y-1 transition-transform duration-500">{project.title}</span>

                                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-slate-900 font-black tracking-wider uppercase text-[9px] shadow-sm">{project.category || "General"}</div>
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <div className="bg-white px-5 py-2.5 rounded-xl text-slate-900 font-black tracking-widest uppercase text-xs shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">View Project</div>
                                                    </div>
                                                </Link>

                                                <div className="p-5 flex flex-col flex-grow bg-white dark:bg-slate-900">
                                                    <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors mb-2">{project.title}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-3">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {formatDate(project.created_at)}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-grow mb-4">{project.description}</p>

                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
                                                        <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="flex items-center gap-2.5 group/agency">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black shadow-sm group-hover/agency:bg-indigo-600 group-hover/agency:text-white transition-colors">{orgName.charAt(0).toUpperCase()}</div>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover/agency:text-indigo-600 transition-colors">{orgName}</span>
                                                        </Link>
                                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₱{project.budget}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}