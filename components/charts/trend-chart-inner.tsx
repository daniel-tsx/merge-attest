"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendChartInner({
  data,
  metric,
}: {
  data: Array<Record<string, string | number>>;
  metric: "risk" | "testGaps";
}) {
  const color = metric === "risk" ? "#dc2626" : "#d97706";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
        <LineChart data={data} margin={{ left: -20, right: 16, top: 10, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1", fontSize: 12 }} />
          <Line type="monotone" dataKey={metric} stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
