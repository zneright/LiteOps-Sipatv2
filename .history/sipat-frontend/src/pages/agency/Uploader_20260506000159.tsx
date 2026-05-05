import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
// If you have useAuth, you can use it to get the currently logged-in agency's ID
// import { useAuth } from "../../context/AuthContext"; 

export default function Uploader() {
  const navigate = useNavigate();
  // const { user } = useAuth(); // Grab the logged-in user

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");

  // File & Upload State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // CLOUDINARY CONFIG (You need to replace these with your actual Cloudinary details)
  const CLOUD_NAME = "your_cloud_name_here"; // e.g., "dxyz123"
  const UPLOAD_PRESET = "your_unsigned_preset_here"; // e.g., "sipat_uploads"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadError("");

      // Create a local preview if it's an image
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null); // It's a PDF or document
      }
    }
  };

  const uploadToCloudinary = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      // "auto/upload" allows both images and RAW files (like PDFs)
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

      xhr.open("POST", url, true);

      // Track the upload progress percentage!
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url); // This is the magic URL we want
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setUploadError("Please select a file or document to upload.");
      return;
    }

    setIsSubmitting(true);
    setUploadError("");
    setProgress(0);

    try {
      // 1. UPLOAD FILE TO CLOUDINARY FIRST
      const cloudinaryUrl = await uploadToCloudinary(file);

      // 2. PREPARE DATA FOR CODEIGNITER (Including the new URL)
      const projectData = {
        title: title,
        category: category,
        budget: budget,
        description: description,
        file_url: cloudinaryUrl,
        file_type: file.type, // Tells us if it's an image or PDF
        // created_by: user?.email // Optional: Link to the agency who posted it
      };

      // 3. SEND TO CODEIGNITER MYSQL DATABASE
      const response = await fetch("http://localhost:8080/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) throw new Error("Failed to save project to database.");

      // Success! Route back to dashboard
      navigate("/agency/dashboard");

    } catch (error: any) {
      console.error(error);
      setUploadError(error.message || "An error occurred during upload.");
      setIsSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-20 pt-4 px-4">
      {/* Header */}
      <div>
        <Link to="/agency/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Publish New Project
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Upload an official document, PDF, or image to the citizen feed.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] p-8 shadow-sm flex flex-col gap-8"
      >
        {uploadError && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold">
            {uploadError}
          </div>
        )}

        {/* FILE UPLOAD AREA */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            Project Document or Image (PDF, JPG, PNG)
          </label>

          {/* Hide the actual file input, use a styled label instead */}
          <input
            type="file"
            id="file-upload"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <label
            htmlFor="file-upload"
            className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-slate-950/50 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group relative overflow-hidden"
          >
            {previewUrl ? (
              // IMAGE PREVIEW
              <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
            ) : file && file.type === "application/pdf" ? (
              // PDF PREVIEW ICON
              <div className="text-red-500 text-5xl font-black">PDF</div>
            ) : null}

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shadow-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs font-medium text-slate-400 bg-white/50 dark:bg-black/50 px-2 py-1 rounded-md mt-1">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "PDF, PNG, JPG up to 10MB"}
              </p>
            </div>
          </label>
        </div>

        {/* DYNAMIC PROGRESS BAR */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="w-full">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                <span>{progress < 100 ? "Uploading to Cloudinary..." : "Saving to Database..."}</span>
                <span className="text-blue-600">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* METADATA FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Project Title</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tullahan River Dredging Phase 2" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 font-medium" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 font-medium">
              <option>Infrastructure</option>
              <option>Technology</option>
              <option>Environment</option>
              <option>Healthcare</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Allocated Budget (₱)</label>
            <input required type="text" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 5,000,000" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 font-medium" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Detailed Description</label>
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project scope and expected community impact..." className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 font-medium resize-none"></textarea>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <Link to="/agency/dashboard" className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center min-w-[160px] relative overflow-hidden group">
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
            {isSubmitting ? "Processing..." : "Publish Project"}
          </button>
        </div>
      </motion.form>

      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}