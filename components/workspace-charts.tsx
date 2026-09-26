"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkspaceMetrics } from "@/lib/workspace-metrics";

const chartColors = ["#d06b35", "#285943", "#234e70"];

export default function WorkspaceCharts({ metrics }: { metrics: WorkspaceMetrics }) {
  const hasData = metrics.total > 0;

  return (
    <div className="visual-grid">
      <article className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Status mix</p>
            <h2>Progress at a glance</h2>
          </div>
        </div>
        <div className="chart">
          {hasData ? (
            <ResponsiveContainer height={240} width="100%">
              <BarChart data={metrics.byStatus}>
                <CartesianGrid stroke="#d9dfd7" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fill: "#506057", fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "#506057", fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#d06b35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <p>No status data available yet.</p>
            </div>
          )}
        </div>
      </article>

      <article className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Priority mix</p>
            <h2>Where attention goes</h2>
          </div>
        </div>
        <div className="chart">
          {hasData ? (
            <ResponsiveContainer height={240} width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={metrics.byPriority}
                  dataKey="value"
                  innerRadius={58}
                  nameKey="name"
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {metrics.byPriority.map((entry, index) => (
                    <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <p>No priority data available yet.</p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
