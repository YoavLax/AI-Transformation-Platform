"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: "blue" | "green" | "yellow" | "red";
}

export function Progress({
  value,
  max = 100,
  className,
  showLabel = false,
  color = "blue",
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", {
              "bg-blue-600": color === "blue",
              "bg-green-600": color === "green",
              "bg-yellow-500": color === "yellow",
              "bg-red-600": color === "red",
            })}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-right">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}
