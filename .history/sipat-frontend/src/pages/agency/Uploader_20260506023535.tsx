import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🚀 Updated Structure for Phases
interface ProjectPhase {
  title: string;
  description: string;
  image_url: string;
  start_date: string; // NEW
  completion_date: string; // NEW
}

export default function Uploader() {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [startDate, setStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [aiSummary, setAiSummary] = useState("");

  const [phases, setPhases] = useState<ProjectPhase[]>([]);

  // File & Upload State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // AI & Progress States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemMessage, setSystemMessage] = useState({ text: "", type: "" });

  const CLOUD_NAME = "dupjdmjha";
  const UPLOAD_PRESET = "sipat_uploads";
  const GEMINI_API_KEY = "AIzaSyAkyX-WwVdx4FvZPeMw-FXDW8Uugy5IyDc";

  const uploadToCloudinary = (fileToUpload: File, trackProgress = false): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

      xhr.open("POST", url, true);
      if (trackProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            // Track the upload percentage
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

  // --- DYNAMIC PHASE FUNCTIONS ---
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

  // --- AI PARSING ---
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

      // 🚀 FIX 1 & 2: Use a stable model and force Native JSON Mode
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // Fallback to 1.5-flash if 2.5 causes issues
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const prompt = `
        You are a highly secure Data Extraction AI for a Government Transparency Platform.
        Analyze the attached official public document. Extract ONLY factual data.
        
        Required JSON Keys:
        - "title": Project name.
        - "category": Match exactly one: ["Infrastructure", "Technology", "Environment", "Healthcare"]. Default to "Infrastructure".
        - "budget": Extract total budget amount (numbers/commas only).
        - "description": A short 1-2 sentence overview.
        - "keywords": A comma-separated string of keywords related to the project.
        - "start_date": Overall project start date formatted as YYYY-MM-DD. Leave blank if none.
        - "completion_date": Overall project completion date formatted as YYYY-MM-DD. Leave blank if none.
        - "ai_summary": Detailed text extraction for a RAG AI search engine (Khoj).
        - "phases": Create an Array of Objects representing the project milestones. Each object MUST have:
            1. "title": The name of the phase (e.g. "Bidding", "Construction").
            2. "description": A 1-sentence detail of what happens in this phase based on the document.
            3. "start_date": Phase start date (YYYY-MM-DD). Leave blank if none.
            4. "completion_date": Phase completion date (YYYY-MM-DD). Leave blank if none.
            5. "image_url": Leave this as an empty string "".
      `;

      const filePart = await fileToGenerativePart(selectedFile);
      const result = await model.generateContent([prompt, filePart as any]);

      // 🚀 FIX 3: No more regex needed. Safely parse the direct response.
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

      // 🚀 FIX 4: Show the actual error message in the UI so you know what failed
      setSystemMessage({
        text: `AI Error: ${error.message || "Failed to process document."}`,
        type: "error"
      });
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

  // --- FINAL SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setSystemMessage({ text: "Please upload a document first.", type: "error" });

    setIsSubmitting(true);
    setProgress(0);

    try {
      // Passes 'true' to trigger the onprogress event handler
      const cloudinaryUrl = await uploadToCloudinary(file, true);

      // Inside handleSubmit, change your projectData payload to this:
      const projectData = {
        title, category, budget, description,
        keywords,
        start_date: startDate || null, // 🚀 FIX: Changes "" to null
        completion_date: completionDate || null, // 🚀 FIX: Changes "" to null
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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4">

      <div>
        <Link to="/agency/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Publish New Project</h1>
      </div>

      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] p-8 shadow-sm flex flex-col gap-8 relative overflow-hidden">


        <AnimatePresence>
          {isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center">
              <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="font-bold text-slate-800 dark:text-white animate-pulse">LuminOS AI is reading document...</p>
            </motion.div>
          )}
        </AnimatePresence>


        <AnimatePresence>
          {isSubmitting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center px-8 text-center">
              <svg className="animate-spin h-12 w-12 text-indigo-600 mb-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>

              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                {progress < 100 ? "Uploading Document..." : "Saving to Database..."}
              </h2>
              <p className="text-sm font-medium text-slate-500 mb-6">
                {progress < 100 ? "Securely storing your file to the cloud." : "Finalizing project details in the system."}
              </p>


              <div className="w-full max-w-sm bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${progress} % ` }}
                >
                  <span className="text-[10px] font-black text-white mix-blend-difference">{progress}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {systemMessage.text && !isAnalyzing && !isSubmitting && (
          <div className={`p - 4 rounded - xl text - sm font - bold border ${systemMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : systemMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {systemMessage.text}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Project Document (PDF/Image)</label>
          <input type="file" id="main-upload" accept="image/*,.pdf" className="hidden" onChange={handleMainFileChange} />
          <label htmlFor="main-upload" className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-950/50 flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden">
            {previewUrl ? <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" /> : file?.type === "application/pdf" ? <div className="text-red-500 text-5xl font-black">PDF</div> : null}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
              <p className="text-sm font-bold text-slate-700 mt-2">{file ? file.name : "Click to upload document"}</p>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Project Title</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Keywords (Comma separated)</label>
            <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. road repair, dpwh, bridge" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50">
              <option>Infrastructure</option><option>Technology</option><option>Environment</option><option>Healthcare</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Allocated Budget (₱)</label>
            <input required type="text" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Overall Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Overall Completion Date</label>
            <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/50" />
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Project Timeline & Phases</h3>
              <p className="text-xs text-slate-500 font-medium">AI extracted these steps. Edit them or add photos as proof.</p>
            </div>
            <button type="button" onClick={addPhase} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg hover:bg-indigo-100 transition-colors">
              + Add Phase
            </button>
          </div>

          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div key={index} className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                <button type="button" onClick={() => removePhase(index)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <input type="text" value={phase.title} onChange={(e) => updatePhase(index, "title", e.target.value)} placeholder="Phase Name (e.g. Bidding)" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50" />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Start Date</label>
                        <input type="date" value={phase.start_date} onChange={(e) => updatePhase(index, "start_date", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Completion Date</label>
                        <input type="date" value={phase.completion_date} onChange={(e) => updatePhase(index, "completion_date", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50" />
                      </div>
                    </div>

                    <textarea value={phase.description} onChange={(e) => updatePhase(index, "description", e.target.value)} placeholder="What happens in this phase?" rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50 resize-none"></textarea>
                  </div>

                  <div className="flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg relative overflow-hidden h-full min-h-[100px]">
                    {phase.image_url ? (
                      <img src={phase.image_url} alt={phase.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <label className="cursor-pointer text-center p-2">
                        <span className="text-xs font-bold text-indigo-500 hover:text-indigo-600 block">Upload Photo</span>
                        <span className="text-[10px] text-slate-400 block mt-1">(Optional proof)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhaseImageUpload(index, e)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-slate-200">
          <button type="submit" disabled={isSubmitting || isAnalyzing} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all">
            {isSubmitting ? "Publishing..." : "Publish Project"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}