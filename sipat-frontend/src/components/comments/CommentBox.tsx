import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface CommentBoxProps {
  onSubmit: (content: string) => Promise<void> | void;
  placeholder?: string;
  isLoading?: boolean;
  maxLength?: number;
  isAnonymous?: boolean;
}

export default function CommentBox({
  onSubmit,
  placeholder = "Add your thoughts or verify this update...",
  isLoading = false,
  maxLength = 500,
  isAnonymous = true,
}: CommentBoxProps) {
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > maxLength;
  const isDisabled = charCount === 0 || isOverLimit || isLoading;

  const handleSubmit = async () => {
    if (isDisabled) return;
    await onSubmit(content);
    setContent(""); // Reset after submission
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300">
      <div className="flex gap-4">
        {/* Avatar Area */}
        <div className="shrink-0 pt-1">
          {isAnonymous ? (
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-inner flex items-center justify-center text-white font-bold">
              A
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="w-full min-h-[100px] p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl resize-y text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
            />

            {/* Absolute positioned Anonymous Badge */}
            <AnimatePresence>
              {isFocused && isAnonymous && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-4 right-4 pointer-events-none"
                >
                  <span className="px-2 py-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    Posting Anonymously
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between">
            <div
              className={`text-xs font-medium transition-colors ${isOverLimit ? "text-red-500" : "text-slate-400"}`}
            >
              {charCount} / {maxLength}
            </div>

            <motion.button
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              onClick={handleSubmit}
              disabled={isDisabled}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 ${
                isDisabled
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 text-white cursor-pointer"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Post Comment"
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
