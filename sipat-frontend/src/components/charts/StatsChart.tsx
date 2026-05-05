import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

// Mock data for multiple statistics
const data = [
  { name: "Jan", users: 4000, posts: 2400 },
  { name: "Feb", users: 3000, posts: 1398 },
  { name: "Mar", users: 2000, posts: 9800 },
  { name: "Apr", users: 2780, posts: 3908 },
  { name: "May", users: 1890, posts: 4800 },
  { name: "Jun", users: 2390, posts: 3800 },
];

// Define specific props for our custom tooltip to satisfy strict TypeScript
interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    value: number | string;
    name: string;
    color: string;
  }[];
  label?: string;
}

// Premium Custom Tooltip for Stacked/Multi-bar
const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] min-w-[160px] transition-colors duration-300">
        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          {label}
        </p>
        <div className="space-y-3">
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-md shadow-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-600 dark:text-slate-300 font-semibold capitalize">
                  {entry.name}
                </span>
              </div>
              <span className="text-slate-900 dark:text-white font-black ml-4 tracking-tight">
                {typeof entry.value === "number"
                  ? entry.value.toLocaleString()
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Premium Custom Legend Types
interface LegendPayload {
  color: string;
  value: string;
}

interface CustomLegendProps {
  payload?: LegendPayload[];
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
  if (!payload) return null;

  return (
    <div className="flex justify-center gap-8 mt-4">
      {payload.map((entry, index) => (
        <div
          key={`item-${index}`}
          className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
        >
          <div
            className="w-3.5 h-3.5 rounded-md shadow-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 capitalize transition-colors">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function StatsChart() {
  const { theme } = useTheme();

  // Dynamic Hex Colors for Recharts SVG elements
  const gridColor = theme === "dark" ? "#1e293b" : "#f1f5f9"; // slate-800 : slate-100
  const textColor = theme === "dark" ? "#64748b" : "#94a3b8"; // slate-500 : slate-400
  const cursorColor = theme === "dark" ? "#1e293b" : "#f8fafc"; // slate-800 : slate-50
  const secondaryBarColor = theme === "dark" ? "#334155" : "#cbd5e1"; // slate-700 : slate-300

  return (
    <div className="w-full bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-[1.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-none transition-all duration-500 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-slate-900 dark:text-white font-extrabold text-xl tracking-tight transition-colors">
            Growth Metrics
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 transition-colors">
            Users vs Posts comparison
          </p>
        </div>
        <button className="p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
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
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>

      {/* Chart Area */}
      <div className="h-75 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            barGap={8}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke={gridColor}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }}
              dy={15}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }}
              tickFormatter={(value: number) =>
                value >= 1000 ? `${value / 1000}k` : value.toString()
              }
              dx={-10}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: cursorColor, opacity: 0.4 }}
            />
            <Legend content={<CustomLegend />} verticalAlign="bottom" />

            {/* Primary Bar: Indigo */}
            <Bar
              dataKey="users"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
              animationDuration={1500}
            />

            {/* Secondary Bar: Dynamic Theme Color */}
            <Bar
              dataKey="posts"
              fill={secondaryBarColor}
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
