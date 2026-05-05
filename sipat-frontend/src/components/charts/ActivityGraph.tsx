import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

// Mock data representing daily user activity
const data = [
  { day: "Mon", activity: 1200 },
  { day: "Tue", activity: 2100 },
  { day: "Wed", activity: 1800 },
  { day: "Thu", activity: 3200 },
  { day: "Fri", activity: 2800 },
  { day: "Sat", activity: 4100 },
  { day: "Sun", activity: 3800 },
];

// Define specific props for our custom tooltip to satisfy strict TypeScript
interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

// Premium SaaS Custom Tooltip
const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] min-w-[140px] transition-colors duration-300">
        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
          {label}
        </p>
        <div className="flex items-center gap-2.5">
          {/* Glowing dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          <span className="text-slate-600 dark:text-slate-300 text-sm font-semibold">
            Interactions
          </span>
        </div>
        <p className="text-slate-900 dark:text-white text-3xl font-black mt-2 tracking-tight">
          {payload[0].value?.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function ActivityGraph() {
  const { theme } = useTheme();

  // Define hex colors based on theme for SVG elements that don't support Tailwind classes
  const gridColor = theme === "dark" ? "#1e293b" : "#f1f5f9"; // slate-800 : slate-100
  const textColor = theme === "dark" ? "#64748b" : "#94a3b8"; // slate-500 : slate-400
  const cursorColor = theme === "dark" ? "#334155" : "#cbd5e1"; // slate-700 : slate-300

  return (
    <div className="w-full bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-[1.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-none transition-all duration-500 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-slate-900 dark:text-white font-extrabold text-xl tracking-tight transition-colors">
            Activity Overview
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 transition-colors">
            Daily platform interactions
          </p>
        </div>
        <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full shadow-sm transition-colors">
          +24% this week
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-75 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Premium Indigo Gradient */}
              <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>

              {/* Wow Factor: SVG Drop Shadow for the chart line */}
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="6"
                  floodColor="#6366f1"
                  floodOpacity="0.3"
                />
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke={gridColor}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }}
              dy={15}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }}
              tickFormatter={(value: number) => `${value / 1000}k`}
              dx={-10}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: cursorColor,
                strokeWidth: 2,
                strokeDasharray: "6 6",
              }}
            />

            <Area
              type="monotone"
              dataKey="activity"
              stroke="#6366f1" // Indigo 500
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorActivity)"
              filter="url(#shadow)"
              activeDot={{
                r: 8,
                strokeWidth: 0,
                fill: "#6366f1",
                style: {
                  filter: "drop-shadow(0px 0px 6px rgba(99,102,241,0.6))",
                },
              }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
