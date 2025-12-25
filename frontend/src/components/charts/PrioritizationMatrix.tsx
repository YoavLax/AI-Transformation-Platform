"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface MatrixData {
  id: string;
  name: string;
  x: number;
  y: number;
  risk?: number;
}

interface PrioritizationMatrixProps {
  data: MatrixData[];
  xLabel?: string;
  yLabel?: string;
  onPointClick?: (data: MatrixData) => void;
  className?: string;
}

const getQuadrantColor = (x: number, y: number): string => {
  if (x >= 50 && y >= 50) return "#22c55e"; // High impact, high feasibility - green
  if (x >= 50 && y < 50) return "#f59e0b"; // High impact, low feasibility - amber
  if (x < 50 && y >= 50) return "#3b82f6"; // Low impact, high feasibility - blue
  return "#94a3b8"; // Low impact, low feasibility - gray
};

export function PrioritizationMatrix({
  data,
  xLabel = "Impact",
  yLabel = "Feasibility",
  onPointClick,
  className,
}: PrioritizationMatrixProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            name={xLabel}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            label={{
              value: xLabel,
              position: "bottom",
              fill: "#374151",
              fontSize: 14,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            name={yLabel}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            label={{
              value: yLabel,
              angle: -90,
              position: "left",
              fill: "#374151",
              fontSize: 14,
            }}
          />
          <ReferenceLine x={50} stroke="#d1d5db" strokeDasharray="5 5" />
          <ReferenceLine y={50} stroke="#d1d5db" strokeDasharray="5 5" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number | undefined, name: string | undefined) => [
              `${value ?? 0}%`,
              name === "x" ? xLabel : yLabel,
            ]}
            labelFormatter={(_, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.name;
              }
              return "";
            }}
          />
          <Scatter
            data={data}
            cursor="pointer"
            onClick={(data) => onPointClick?.(data as unknown as MatrixData)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getQuadrantColor(entry.x, entry.y)}
                r={8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-gray-600">Strategic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">Quick Wins</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-sm text-gray-600">Low Priority</span>
        </div>
      </div>
    </div>
  );
}
