import React from "react";
import { motion } from "framer-motion";

export interface ProgressBarProps {
  /** The current progress value (0 to 100) */
  progress: number;
  /** Optional text label displayed above the bar */
  label?: string;
  /** Whether to show the percentage value text */
  showValue?: boolean;
  /** Tailwind class for the gradient start color */
  colorFrom?: string;
  /** Tailwind class for the gradient end color */
  colorTo?: string;
}

export default function ProgressBar({
  progress,
  label = "Project Progress",
  showValue = true,
  colorFrom = "from-indigo-500",
  colorTo = "to-purple-500",
}: ProgressBarProps) {
  // Ensure progress stays within 0-100 bounds
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Header Label & Value */}
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs font-semibold">
          {label && (
            <span className="text-slate-500 dark:text-slate-400 tracking-wide">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {clampedProgress}%
            </span>
          )}
        </div>
      )}

      {/* Track & Fill */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} // Custom spring-like easing
          className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorFrom} ${colorTo}`}
        />
      </div>
    </div>
  );
}
