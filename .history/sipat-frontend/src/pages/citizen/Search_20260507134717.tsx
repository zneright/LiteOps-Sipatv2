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
    const [isAILoading, setIsAILoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const GEMINI_API_KEY = "AIzaSyDiX2AbY2y0CvDUTh3u6Bgg9E6aWcztos4";

    const getExactCategoryUI = (categoryName: string) => {
        const found = categoryMetadata.find(c => c.name.toLowerCase() === (categoryName || "").toLowerCase().trim());
        if (found) return { bg: found.gradient, icon: found.icon };
        return { bg: "from-slate-500 to-slate-700", icon: "📁" };
    };

    useEffect(() => {
        const performSearch = async () => {
            if (!query) return;
            setIsLoading(true);

            try {
                // 1. FAST DATABASE SEARCH (Searches Projects, PDFs, Keywords, Comments, Agencies, Citizens)
                const dbRes = await fetch(`http://localhost:8080/api/projects/search?q=${encodeURIComponent(query)}`);
                if (!dbRes.ok) throw new Error("DB Search failed");

                const sqlData = await dbRes.json();

                // Map the UI to the DB projects
                let currentProjects = (sqlData.projects || []).map((p: any) => ({
                    ...p,
                    ui: getExactCategoryUI(p.category),
                    matchReason: p.found_via_comment ? "Community Comment Match" : "Database Match"
                }));

                setProjects(currentProjects);
                setUsers(sqlData.users || []);
                setIsLoading(false); // Show DB results immediately!

                // 2. BACKGROUND AI SEMANTIC SEARCH
                setIsAILoading(true);
                const allRes = await fetch("http://localhost:8080/api/projects");
                const allProjects = await allRes.json();

                const lightweightProjects = allProjects.map((p: any) => ({
                    id: p.id, title: p.title,
                    scanned_pdf: p.ai_summary || "",
                    keywords: p.keywords || ""
                }));

                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash-lite",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: SchemaType.OBJECT,
                            properties: {
                                matched_projects: {
                                    type: SchemaType.ARRAY,
                                    items: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            id: { type: SchemaType.INTEGER },
                                            reason: { type: SchemaType.STRING, description: "Short 5 word reason, e.g. 'Found in PDF Document'" }
                                        },
                                        required: ["id", "reason"]
                                    }
                                }
                            },
                            required: ["matched_projects"]
                        }
                    }
                });

                const prompt = `User Query: "${query}". Database: ${JSON.stringify(lightweightProjects)}. Find projects semantically matching the query.`;
                const aiResult = await model.generateContent(prompt);

                // 🚀 CRASH PREVENTION: Clean markdown formatting from AI response
                const rawText = aiResult.response.text();
                const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsedAI = JSON.parse(cleanText);

                const aiMatches = parsedAI.matched_projects || [];
                const aiReasonMap: Record<number, string> = {};
                aiMatches.forEach((m: any) => { aiReasonMap[m.id] = m.reason; });
                const aiMatchedIds = aiMatches.map((m: any) => m.id);

                // Merge AI results with existing DB results
                const sqlIds = currentProjects.map(p => p.id);
                const newAiProjects = allProjects
                    .filter((p: any) => aiMatchedIds.includes(p.id) && !sqlIds.includes(p.id))
                    .map((p: any) => ({
                        ...p,
                        ui: getExactCategoryUI(p.category),
                        matchReason: `✨ AI: ${aiReasonMap[p.id]}`
                    }));

                if (newAiProjects.length > 0) {
                    setProjects(prev => [...prev, ...newAiProjects]);
                }

            } catch (error) {
                console.warn("Search process error (Likely AI timeout, DB results preserved):", error);
            } finally {
                setIsLoading(false);
                setIsAILoading(false);
            }
        };

        performSearch();
    }, [query]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "TBD";
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Separate Users into Agencies and Citizens
    const matchedAgencies = users.filter(u => u.role === 'agency');
    const matchedCitizens = users.filter(u => u.role === 'citizen');

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8 pb-20">

            <section className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Search Results for:</p>
                    {isAILoading && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            AI Scanning PDFs...
                        </span>
                    )}
                </div>
                <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                    "{query}"
                </motion.h1>
            </section>

            {isLoading ? (
                <div className="w-full py-32 flex flex-col items-center justify-center gap-6">
                    <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-600 animate-pulse">Searching Database & Documents...</p>
                </div>
            ) : projects.length === 0 && users.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
                    <div className="text-5xl mb-6">🕵️‍♂️</div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No matches found</h3>
                    <p className="text-slate-500 text-center max-w-md">We couldn't find any projects, comments, or users matching "{query}".</p>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-12">

                    {/* 🚀 AGENCY MATCHES */}
                    {matchedAgencies.length > 0 && (
                        <section>
                            <h2 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg> Agencies & LGUs
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {matchedAgencies.map((agency) => (
                                    <Link key={agency.id} to={`/agency-profile/${encodeURIComponent(agency.organization_name)}`} className="group bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-3xl font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {agency.organization_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 line-clamp-1">{agency.organization_name}</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mt-1"><svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg> Official Account</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 🚀 CITIZEN MATCHES */}
                    {matchedCitizens.length > 0 && (
                        <section>
                            <h2 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <span className="text-emerald-500 text-xl">👤</span> Citizens
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {matchedCitizens.map((citizen) => (
                                    <div key={citizen.id} className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-black">
                                            {citizen.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-base">{citizen.full_name}</h3>
                                            <Link to={`/public-profile/${encodeURIComponent(citizen.full_name)}`}>
   View Profile
</Link>
                                        </div>
                                    </div>
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
                                            <motion.div key={project.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} className="group bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative hover:-translate-y-1">
                                                <Link to={`/project/${project.id}`} className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${project.ui.bg} relative overflow-hidden flex flex-col items-center justify-center shadow-inner block`}>
                                                    <div className="absolute inset-0 opacity-30 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-overlay">
                                                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white"><polygon points="0,100 100,0 100,100" /><circle cx="20" cy="20" r="30" /></svg>
                                                    </div>
                                                    <span className="text-6xl mb-3 drop-shadow-xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">{project.ui.icon}</span>
                                                    <span className="text-white/95 font-black text-xl text-center px-6 mix-blend-overlay line-clamp-2 leading-tight drop-shadow-md group-hover:-translate-y-1 transition-transform duration-500">{project.title}</span>
                                                </Link>

                                                <div className="p-5 flex flex-col flex-grow bg-white relative">
                                                    {project.matchReason && (
                                                        <div className="mb-3">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                                                {project.matchReason}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <h3 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors mb-2">{project.title}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-3">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {formatDate(project.created_at)}
                                                    </p>
                                                    <p className="text-sm text-slate-500 line-clamp-2 flex-grow mb-4">{project.description}</p>

                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                        <Link to={`/agency-profile/${encodeURIComponent(orgName)}`} className="flex items-center gap-2.5 group/agency">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-black shadow-sm group-hover/agency:bg-indigo-600 group-hover/agency:text-white transition-colors">{orgName.charAt(0).toUpperCase()}</div>
                                                            <span className="text-xs font-bold text-slate-700 group-hover/agency:text-indigo-600 transition-colors">{orgName}</span>
                                                        </Link>
                                                        <span className="text-sm font-black text-emerald-600">₱{project.budget}</span>
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