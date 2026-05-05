import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, Link } from "react-router-dom";

export default function ReviewCommit() {
  const { id } = useParams(); // Retrieves the ID from the URL (e.g., REV-001)
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock processing function
  const handleAction = (actionType: string) => {
    console.log(`Executing ${actionType} on ticket ${id}`);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      navigate("/agency/dashboard"); // Returns to dashboard after action
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-20 pt-4">
      {/* Header */}
      <div>
        <Link to="/agency/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Review Commit</h1>
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest rounded-lg">Pending</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Ticket ID: {id || "REV-UNKNOWN"}</p>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] shadow-sm overflow-hidden"
      >
        {/* Ticket Details */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                J
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Juan Dela Cruz</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Verified Citizen • Submitted Oct 24, 2026</p>
              </div>
           </div>

           <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Streetlight outage on Rizal Ave</h2>
           <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-6">
             "Three consecutive solar streetlights have been completely dark for the past two nights near the intersection of Rizal Ave and 4th Street. This is causing a major hazard for pedestrians and tricycles crossing the highway."
           </p>

           <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
              <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm font-bold">Attached Evidence: image_report_rizal.jpg</span>
           </div>
        </div>

        {/* Action Panel */}
        <div className="p-8 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Approving this commit will publicly verify the issue and add it to the agency backlog.
          </p>
          <div className="flex w-full sm:w-auto items-center gap-3">
             <button 
               onClick={() => handleAction("Reject")}
               disabled={isProcessing}
               className="flex-1 sm:flex-none px-6 py-3 bg-white dark:bg-slate-800 border-2 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
             >
               Reject Request
             </button>
             <button 
               onClick={() => handleAction("Approve")}
               disabled={isProcessing}
               className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-600 hover:border-emerald-700 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center min-w-[140px]"
             >
               {isProcessing ? (
                 <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               ) : "Verify & Approve"}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}