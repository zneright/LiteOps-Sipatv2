import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useAuth } from "../../context/AuthContext";

interface ProjectPhase {
  title: string;
  description: string;
  image_url: string;
  start_date: string;
  completion_date: string;
}

export default function Uploader() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [startDate, setStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [aiSummary, setAiSummary] = useState("");

  const [phases, setPhases] = useState<ProjectPhase[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemMessage, setSystemMessage] = useState({ text: "", type: "" });

  const CLOUD_NAME = "dupjdmjha";
  const UPLOAD_PRESET = "sipat_uploads";
  const GEMINI_API_KEY = "AIzaSyBnRUARwHFqgq5UyhyMMuVDbyIt0PdJ83U";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  
  const uploadToCloudinary = (fileToUpload: File, trackProgress = false): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

      xhr.open("POST", url, true);
      if (trackProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
        else reject("Failed to upload to Cloudinary.");
      };
      xhr.onerror = () => reject("Network error during upload.");

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("upload_preset", UPLOAD_PRESET);
      xhr.send(formData);
    });
  };

  const addPhase = () => {
    setPhases([...phases, { title: "", description: "", image_url: "", start_date: "", completion_date: "" }]);
  };

  const updatePhase = (index: number, field: keyof ProjectPhase, value: string) => {
    const newPhases = [...phases];
    newPhases[index][field] = value;
    setPhases(newPhases);
  };

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  const handlePhaseImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const phaseFile = e.target.files?.[0];
    if (!phaseFile) return;

    setSystemMessage({ text: "Uploading phase image...", type: "info" });
    try {
      const imgUrl = await uploadToCloudinary(phaseFile, false);
      updatePhase(index, "image_url", imgUrl);
      setSystemMessage({ text: "Phase image attached!", type: "success" });
    } catch (error) {
      setSystemMessage({ text: "Failed to upload phase image.", type: "error" });
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  };

  const analyzeWithAI = async (selectedFile: File) => {
    setIsAnalyzing(true);
    setSystemMessage({ text: "AI is reading the document to extract data...", type: "info" });

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

      const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "Project name" },
          category: { type: SchemaType.STRING, description: "Must be Infrastructure, Technology, Environment, or Healthcare" },
          budget: { type: SchemaType.STRING, description: "Total budget amount, numbers and commas only" },
          description: { type: SchemaType.STRING, description: "Short 1-2 sentence overview" },
          keywords: { type: SchemaType.STRING, description: "Comma-separated string of keywords" },
          start_date: { type: SchemaType.STRING, description: "YYYY-MM-DD format, or empty string" },
          completion_date: { type: SchemaType.STRING, description: "YYYY-MM-DD format, or empty string" },
          ai_summary: { type: SchemaType.STRING, description: "Detailed text extraction for RAG" },
          phases: {
            type: SchemaType.ARRAY,
            description: "A list of project milestones, bidding steps, or construction phases.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING, description: "Phase name (e.g. Planning, Bidding, Construction)" },
                description: { type: SchemaType.STRING, description: "1-sentence detail of what happens in this phase" },
                start_date: { type: SchemaType.STRING, description: "YYYY-MM-DD or empty string" },
                completion_date: { type: SchemaType.STRING, description: "YYYY-MM-DD or empty string" },
                image_url: { type: SchemaType.STRING, description: "Always leave as empty string" }
              },
              required: ["title", "description", "start_date", "completion_date", "image_url"]
            }
          }
        },
        required: ["title", "description", "budget", "phases"]
      };

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      const prompt = `
        Analyze the attached official public document. Extract ONLY factual data matching the JSON schema. 
        You MUST extract any project milestones, timelines, bidding processes, or construction steps into the 'phases' array.
      `;

      const filePart = await fileToGenerativePart(selectedFile);
      const result = await model.generateContent([prompt, filePart as any]);

      const responseText = result.response.text();
      const aiData = JSON.parse(responseText);

      if (aiData.title) setTitle(aiData.title);
      if (aiData.category) setCategory(aiData.category);
      if (aiData.budget) setBudget(aiData.budget);
      if (aiData.description) setDescription(aiData.description);
      if (aiData.keywords) setKeywords(aiData.keywords);
      if (aiData.start_date) setStartDate(aiData.start_date);
      if (aiData.completion_date) setCompletionDate(aiData.completion_date);
      if (aiData.ai_summary) setAiSummary(aiData.ai_summary);
      if (aiData.phases && Array.isArray(aiData.phases)) setPhases(aiData.phases);

      setSystemMessage({ text: "✨ AI extracted project details and phases. Please review.", type: "success" });

    } catch (error: any) {
      console.error("AI Parse Error:", error);
      setSystemMessage({ text: `AI Error: ${error.message || "Failed to process document."}`, type: "error" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) setPreviewUrl(URL.createObjectURL(selectedFile));
      else setPreviewUrl(null);

      if (selectedFile.type === "application/pdf" || selectedFile.type.startsWith("image/")) {
        analyzeWithAI(selectedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setSystemMessage({ text: "Please upload a document first.", type: "error" });

    setIsSubmitting(true);
    setProgress(0);

    try {
      const cloudinaryUrl = await uploadToCloudinary(file, true);

      const projectData = {
        title, category, budget, description,
        keywords,
        start_date: startDate || null,
        completion_date: completionDate || null,
        ai_summary: aiSummary,
        phases: JSON.stringify(phases),
        file_url: cloudinaryUrl,
        file_type: file.type
      };

      const response = await fetch("http://localhost:8080/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) throw new Error("Failed to save project.");
      navigate("/agency/dashboard");

    } catch (error: any) {
      setSystemMessage({ text: error.message, type: "error" });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8 pb-24 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="flex flex-col gap-1 sm:gap-2">
        <Link to="/agency/dashboard" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-fit mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Publish New Project
        </h1>
      </div>

      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-white/90 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col gap-6 sm:gap-8 relative overflow-hidden">

        <AnimatePresence>
          {isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center rounded-[1.5rem] sm:rounded-[2.5rem]">
              <svg className="animate-spin h-10 w-10 sm:h-12 sm:w-12 text-indigo-600 dark:text-indigo-400 mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-white animate-pulse">LuminOS AI is reading document...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSubmitting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center px-6 text-center rounded-[1.5rem] sm:rounded-[2.5rem]">
              <svg className="animate-spin h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
                {progress < 100 ? "Uploading Document..." : "Saving to Database..."}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                {progress < 100 ? "Securely storing your file to the cloud." : "Finalizing project details in the system."}
              </p>

              <div className="w-full max-w-xs sm:max-w-sm bg-slate-200 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${progress}%` }}
                >
                  <span className="text-[9px] sm:text-[10px] font-black text-white mix-blend-difference">{progress}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {systemMessage.text && !isAnalyzing && !isSubmitting && (
          <div className={`p-4 rounded-xl text-sm font-bold border ${systemMessage.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' : systemMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'}`}>
            {systemMessage.text}
          </div>
        )}

        <div>
          <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Project Document (PDF/Image)</label>
          <input type="file" id="main-upload" accept="image/*,.pdf" className="hidden" onChange={handleMainFileChange} />
          <label htmlFor="main-upload" className="w-full h-40 sm:h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden transition-colors">
            {previewUrl ? <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Preview" /> : file?.type === "application/pdf" ? <div className="text-rose-500/80 dark:text-rose-400/50 text-5xl font-black">PDF</div> : null}
            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-white/5 group-hover:scale-110 transition-transform"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-3 truncate max-w-[250px] sm:max-w-xs">{file ? file.name : "Click to upload document"}</p>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Project Title</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all placeholder:text-slate-400" placeholder="E.g. Pasig River Rehabilitation" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Keywords (Comma separated)</label>
            <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. road repair, dpwh, bridge" className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" />
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all appearance-none cursor-pointer">
              <option className="dark:bg-slate-800">Infrastructure</option>
              <option className="dark:bg-slate-800">Technology</option>
              <option className="dark:bg-slate-800">Environment</option>
              <option className="dark:bg-slate-800">Healthcare</option>
              <option className="dark:bg-slate-800">Education</option>
              <option className="dark:bg-slate-800">Transport</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Allocated Budget (₱)</label>
            <input required type="text" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="E.g. 5,000,000" className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" />
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Overall Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Overall Completion Date</label>
            <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]" />
          </div>
        </div>

        <div className="border-t border-slate-200/60 dark:border-white/5 pt-6 sm:pt-8 mt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Project Timeline & Phases</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">AI extracted these steps. Edit them or add photos as proof.</p>
            </div>
            <button type="button" onClick={addPhase} className="w-full sm:w-auto px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-100 dark:border-indigo-500/20">
              + Add Phase
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {phases.map((phase, index) => (
              <div key={index} className="p-4 sm:p-5 lg:p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-[1.25rem] border border-slate-200/60 dark:border-white/5 relative group transition-all hover:border-slate-300 dark:hover:border-white/10">
                <button type="button" onClick={() => removePhase(index)} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm transition-colors z-10">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 mt-6 sm:mt-0">
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">Phase Title</label>
                      <input type="text" value={phase.title} onChange={(e) => updatePhase(index, "title", e.target.value)} placeholder="e.g. Planning & Bidding" className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">Start Date</label>
                        <input type="date" value={phase.start_date} onChange={(e) => updatePhase(index, "start_date", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">Completion Date</label>
                        <input type="date" value={phase.completion_date} onChange={(e) => updatePhase(index, "completion_date", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">Description</label>
                      <textarea value={phase.description} onChange={(e) => updatePhase(index, "description", e.target.value)} placeholder="What happens in this phase?" rows={2} className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"></textarea>
                    </div>
                  </div>

                  <div className="flex flex-col h-full min-h-[140px]">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">Phase Proof</label>
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-xl relative overflow-hidden bg-white/50 dark:bg-slate-900/30 transition-colors">
                      {phase.image_url ? (
                        <img src={phase.image_url} alt={phase.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <label className="cursor-pointer text-center p-4 w-full h-full flex flex-col items-center justify-center">
                          <svg className="w-6 h-6 text-indigo-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 block">Upload Photo</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">(Optional)</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhaseImageUpload(index, e)} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end pt-6 sm:pt-8 border-t border-slate-200/60 dark:border-white/5">
          <button type="submit" disabled={isSubmitting || isAnalyzing} className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 dark:shadow-indigo-900/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base">
            {isSubmitting ? "Publishing..." : "Publish Project"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}