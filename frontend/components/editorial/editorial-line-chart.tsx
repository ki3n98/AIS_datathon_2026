"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SeriesPoint } from "@/lib/dashboard-data";

type EditorialLineChartProps = {
  data: SeriesPoint[];
  lines: string[];
  percent?: boolean;
};

const COLORS = ["#111111", "#7a6a46", "#4d5f76", "#9b4a26"];

export function EditorialLineChart({ data, lines, percent = false }: EditorialLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#d8d0c4" vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(value: number) => (percent ? `${value.toFixed(0)}%` : value.toFixed(0))}
        />
        <Tooltip />
        {lines.slice(0, 3).map((line, index) => (
          <Line key={line} type="monotone" dataKey={line} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
