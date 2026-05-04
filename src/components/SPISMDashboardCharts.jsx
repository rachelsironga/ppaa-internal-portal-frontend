import React from "react";
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";

const PALETTE = ["#696CFF", "#71DD37", "#FFAB00", "#03C3EC", "#FF3E1D", "#8592A3"];

const mapBarColorToHex = (barColor) => {
  switch (barColor) {
    case "bg-success":
      return "#71DD37";
    case "bg-info":
      return "#03C3EC";
    case "bg-warning":
      return "#FFAB00";
    case "bg-danger":
      return "#FF3E1D";
    default:
      return "#696CFF";
  }
};

const prepareData = (data = []) =>
  (Array.isArray(data) ? data : []).map((d, idx) => ({
    ...d,
    _label: d.label || d.category || d.status || d.name || `Item ${idx + 1}`,
    _value: d.value ?? d.count ?? 0,
  }));

// Circular gauge for institutional performance
export const GaugeChart = ({ value = 0 }) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const chartData = [{ name: "Institutional Performance", value: v, fill: "#696CFF" }];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadialBarChart
        innerRadius="70%"
        outerRadius="100%"
        data={chartData}
        startAngle={180}
        endAngle={0}
        cx="50%"
        cy="80%"
      >
        <RadialBar
          background
          clockWise
          dataKey="value"
          cornerRadius={999}
          minAngle={5}
        />
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: "32px", fontWeight: 600, fill: "#696CFF" }}
        >
          {v.toFixed(1)}%
        </text>
        <text
          x="50%"
          y="75%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: "12px", fill: "#6c757d" }}
        >
          Institutional Performance
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

// Donut chart for status distributions
export const DoughnutChart = ({ data = [] }) => {
  const prepared = prepareData(data);
  if (!prepared.length) {
    return <p className="text-muted small mb-0">No data available.</p>;
  }

  const total = prepared.reduce((sum, d) => sum + (d._value || 0), 0) || 1;

  return (
    <div className="d-flex">
      <div style={{ width: "60%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={prepared}
              dataKey="_value"
              nameKey="_label"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
            >
              {prepared.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-grow-1 ps-3 small">
        {prepared.map((item, idx) => {
          const pct = total ? ((item._value / total) * 100).toFixed(1) : 0;
          const color = item.color || PALETTE[idx % PALETTE.length];
          return (
            <div key={idx} className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center">
                <span
                  className="rounded-circle me-2"
                  style={{ width: 10, height: 10, backgroundColor: color }}
                ></span>
                <span className="text-truncate" title={item._label}>
                  {item._label}
                </span>
              </div>
              <span className="text-muted">
                {item._value} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Vertical bar chart (used for objectives by FY, objective performance, etc.)
export const BarChart = ({ data = [], barColor = "bg-primary" }) => {
  const prepared = prepareData(data);
  if (!prepared.length) {
    return <p className="text-muted small mb-0">No data available.</p>;
  }

  const fill = mapBarColorToHex(barColor);

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={prepared} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="_label"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={40}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="_value" fill={fill} radius={[4, 4, 0, 0]} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Area + line chart for quarterly trend
export const QuarterlyTrendChart = ({ data = [] }) => {
  const prepared = prepareData(
    data.map((d) => ({ ...d, value: d.value ?? d._value }))
  );
  if (!prepared.length) {
    return <p className="text-muted small mb-0">No trend data available.</p>;
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={prepared} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#696CFF" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#696CFF" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="_label"
            tick={{ fontSize: 10 }}
            interval={0}
            height={30}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="_value"
            stroke="#696CFF"
            fillOpacity={1}
            fill="url(#colorAI)"
          />
          <Line
            type="monotone"
            dataKey="_value"
            stroke="#FF3E1D"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Stacked progress view for status / completion (kept lightweight)
export const ProgressChart = ({ items, data, title }) => {
  const rows = Array.isArray(items) ? items : Array.isArray(data) ? data : [];

  if (rows.length === 0) {
    return <p className="text-muted small mb-0">No status data available.</p>;
  }

  const total = rows.reduce((sum, r) => sum + (r.value || 0), 0) || 1;

  return (
    <div>
      {title && <p className="small text-muted mb-2">{title}</p>}
      <div className="progress mb-2" style={{ height: 16 }}>
        {rows.map((r, idx) => {
          const val = r.value || 0;
          const pct = (val / total) * 100;
          const cls =
            r.color ||
            (idx === 0 ? "bg-success" : idx === 1 ? "bg-warning" : idx === 2 ? "bg-secondary" : "bg-danger");
          return (
            <div
              key={idx}
              className={`progress-bar ${cls}`}
              style={{ width: `${pct}%` }}
              title={`${r.label}: ${val}`}
            ></div>
          );
        })}
      </div>
      <div className="d-flex flex-wrap gap-2 small">
        {rows.map((r, idx) => (
          <span key={idx} className="d-inline-flex align-items-center me-2">
            <span
              className="rounded-circle me-1"
              style={{
                width: 8,
                height: 8,
                backgroundColor:
                  r.colorClass ||
                  (r.color ||
                    (idx === 0
                      ? "#28a745"
                      : idx === 1
                      ? "#ffc107"
                      : idx === 2
                      ? "#6c757d"
                      : "#dc3545")),
              }}
            ></span>
            <span className="text-muted">
              {r.label}: <span className="fw-semibold">{r.value}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

