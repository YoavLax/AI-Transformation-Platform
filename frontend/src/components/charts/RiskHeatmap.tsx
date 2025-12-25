"use client";

import { cn } from "@/lib/utils";

interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface RiskHeatmapProps {
  data: HeatmapData[];
  xLabels: string[];
  yLabels: string[];
  className?: string;
}

const getHeatmapColor = (value: number): string => {
  if (value >= 80) return "bg-red-500";
  if (value >= 60) return "bg-orange-500";
  if (value >= 40) return "bg-yellow-500";
  if (value >= 20) return "bg-green-400";
  return "bg-green-200";
};

export function RiskHeatmap({
  data,
  xLabels,
  yLabels,
  className,
}: RiskHeatmapProps) {
  const getValue = (x: string, y: string): number => {
    const item = data.find((d) => d.x === x && d.y === y);
    return item?.value || 0;
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="p-2" />
            {xLabels.map((label) => (
              <th
                key={label}
                className="p-2 text-xs font-medium text-gray-600 text-center"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yLabels.map((yLabel) => (
            <tr key={yLabel}>
              <td className="p-2 text-xs font-medium text-gray-600 text-right whitespace-nowrap">
                {yLabel}
              </td>
              {xLabels.map((xLabel) => {
                const value = getValue(xLabel, yLabel);
                return (
                  <td key={`${xLabel}-${yLabel}`} className="p-1">
                    <div
                      className={cn(
                        "w-12 h-12 rounded flex items-center justify-center text-white text-xs font-medium",
                        getHeatmapColor(value)
                      )}
                      title={`${xLabel} / ${yLabel}: ${value}`}
                    >
                      {value}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-200" />
          <span className="text-xs text-gray-600">Low (0-20)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-400" />
          <span className="text-xs text-gray-600">Medium-Low (20-40)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-xs text-gray-600">Medium (40-60)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-xs text-gray-600">High (60-80)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-xs text-gray-600">Critical (80-100)</span>
        </div>
      </div>
    </div>
  );
}
