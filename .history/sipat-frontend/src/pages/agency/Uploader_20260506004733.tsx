import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function Uploader() {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");

  // File & Upload State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // AI & Progress States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemMessage, setSystemMessage] = useState({ text: "", type: "" });

  // 🔴 REQUIRED CREDENTIALS
  const CLOUD_NAME = "dupjdmjha";
  const UPLOAD_PRESET = "sipat_uploads";
  // Get a free key from: https://aistudio.google.com/app/apikey
  const GEMINI_API_KEY = "AIzaSyAkyX-WwVdx4FvZPeMw-FXDW8Uugy5IyDc";
  const [aiSummary, setAiSummary] = useState("");
  // --- 1. CONVERT FILE TO BASE64 FOR AI ---
  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  // --- 2. THE AI MAGIC PARSER ---
  const analyzeWithAI = async (selectedFile: File) => {
    setIsAnalyzing(true);
    setSystemMessage({ text: "AI is reading the document to extract data...", type: "info" });

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        You are a highly secure, objective Data Extraction AI for a Government Transparency Platform.
        Analyze the attached official public document. Extract ONLY the factual data requested. Do not hallucinate or guess. If a value is not explicitly stated in the document, leave it empty.

        Return your analysis STRICTLY as a raw JSON object with no markdown formatting.
        
        Required JSON Keys:
        - "title": The official project name or document title.
        - "category": Match exactly one: ["Infrastructure", "Technology", "Environment", "Healthcare"]. Default to "Infrastructure" if unclear.
        - "budget": Extract the total allocated budget amount. Return only numbers and commas (e.g., "5,000,000").
        - "description": A short, 1-2 sentence overview for the public feed.
        - "ai_summary": A detailed, comprehensive text extraction of the project's goals, timelines, contractors, and specific location data. This text will be fed into a RAG AI search engine (Khoj) for citizens to query later. Ensure it contains all the factual meat of the document without any sensitive personal information (PII).
      `;

      const filePart = await fileToGenerativePart(selectedFile);

      const result = await model.generateContent([prompt, filePart as any]);
      const responseText = result.response.text();

      // Clean up markdown block if Gemini adds it (e.g., ```json ... ```)
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      const aiData = JSON.parse(cleanJsonStr);

      if (aiData.title) setTitle(aiData.title);
      if (aiData.category) setCategory(aiData.category);
      if (aiData.budget) setBudget(aiData.budget);
      if (aiData.description) setDescription(aiData.description);
      if (aiData.ai_summary) setAiSummary(aiData.ai_summary); // 🚀 Save the summary!

      setSystemMessage({ text: "✨ AI successfully extracted project details. Please review.", type: "success" });

    } catch (error) {
      console.error("AI Parse Error:", error);
      setSystemMessage({ text: "AI could not read the document. Please fill the details manually.", type: "error" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSystemMessage({ text: "", type: "" });

      // Set Preview
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }

      // Trigger AI Analysis if it's a readable document!
      if (selectedFile.type === "application/pdf" || selectedFile.type.startsWith("image/")) {
        analyzeWithAI(selectedFile);
      }
    }
  };

  // --- 3. CLOUDINARY UPLOAD ---
  const uploadToCloudinary = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

      xhr.open("POST", url, true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText).secure_url);
        } else {
          reject("Failed to upload to Cloudinary.");
        }
      };
      xhr.onerror = () => reject("Network error during upload.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      xhr.send(formData);
    });
  };

  // --- 4. FINAL SUBMIT TO CODEIGNITER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setSystemMessage({ text: "Please upload a document first.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setProgress(0);

    try {
      const cloudinaryUrl = await uploadToCloudinary(file);

      const projectData = {
        title,
        category,
        budget,
        description,
        ai_summary: aiSummary, // 🚀 Send to CodeIgniter!
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
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Upload official documents. Our AI will automatically extract the details.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] p-8 shadow-sm flex flex-col gap-8 relative overflow-hidden"
      >

        {isAnalyzing && (
          <div className="absolute inset-0 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="font-bold text-slate-800 dark:text-white animate-pulse">LuminOS AI is reading document...</p>
          </div>
        )}


        <AnimatePresence>
          {systemMessage.text && !isAnalyzing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <div className={`p-4 rounded-xl text-sm font-bold border ${systemMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : systemMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {systemMessage.text}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Project Document (PDF/Image)</label>
          <input type="file" id="file-upload" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
          <label htmlFor="file-upload" className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-950/50 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group relative overflow-hidden">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
            ) : file && file.type === "application/pdf" ? (
              <div className="text-red-500 text-5xl font-black">PDF</div>
            ) : null}

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shadow-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">{file ? file.name : "Click to upload document"}</p>
            </div>
          </label>
        </div>


        <AnimatePresence>
          {isSubmitting && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="w-full">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                <span>{progress < 100 ? "Securing file to Cloudinary..." : "Saving to Database..."}</span>
                <span className="text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-indigo-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.2 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Project Title <span className="text-indigo-500 ml-1 text-[10px]">*AI Extracted</span></label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 font-medium" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 font-medium">
              <option>Infrastructure</option><option>Technology</option><option>Environment</option><option>Healthcare</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Allocated Budget (₱)</label>
            <input required type="text" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 font-medium" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Detailed Summary</label>
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 font-medium resize-none"></textarea>
          </div>
        </div>


        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button type="submit" disabled={isSubmitting || isAnalyzing} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-xl transition-all flex items-center justify-center min-w-[160px]">
            {isSubmitting ? "Processing..." : "Publish to Feed"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}