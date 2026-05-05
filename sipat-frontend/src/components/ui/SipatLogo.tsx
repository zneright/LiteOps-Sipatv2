import React from "react";

interface SipatLogoProps {
  className?: string;
}

export default function SipatLogo({ className = "w-8 h-8" }: SipatLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Premium SaaS Gradient for the inner target */}
        <linearGradient id="targetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" /> {/* Indigo-400 */}
          <stop offset="100%" stopColor="#4f46e5" /> {/* Indigo-600 */}
        </linearGradient>

        {/* Subtle shadow for the paper airplane to give it depth */}
        <filter id="planeShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="4"
            floodColor="#000000"
            floodOpacity="0.1"
          />
        </filter>
      </defs>

      {/* Outer Ring - Adapts to Light/Dark Mode (Slate-800 in Light, Slate-200 in Dark) */}
      <circle
        cx="40"
        cy="60"
        r="28"
        stroke="currentColor"
        className="text-slate-800 dark:text-slate-200 transition-colors duration-300"
        strokeWidth="10"
      />

      {/* Inner Target Core - Uses the Indigo Gradient */}
      <circle cx="40" cy="60" r="12" fill="url(#targetGradient)" />

      {/* Paper Airplane - Breaking out of the target */}
      <g filter="url(#planeShadow)">
        {/* Main wing */}
        <path
          d="M35 65 L95 15 L60 85 L45 60 Z"
          fill="currentColor"
          className="text-indigo-500 dark:text-indigo-400 transition-colors duration-300"
        />
        {/* Top fold of the airplane to give it 3D structure */}
        <path
          d="M95 15 L45 60 L35 45 Z"
          fill="currentColor"
          className="text-indigo-300 dark:text-indigo-200 transition-colors duration-300"
        />
      </g>
    </svg>
  );
}
