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
  Legend,
} from "recharts";

const PALETTE = ["#696CFF", "#71DD37", "#FFAB00", "#03C3EC", "#FF3E1D", "#8592A3"];

// Generic stat card used in dashboards (e.g. ICT Assets, SPISM)
export const StatCard = ({ title, value, icon, color = "primary", subtitle, percentage }) => (
  <div
    className={`card widget-flat bg-${color} text-white h-100`}
    style={{
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "scale(1.03) translateY(-3px)";
      e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "scale(1) translateY(0)";
      e.currentTarget.style.boxShadow = "";
    }}
  >
    <div className="card-body">
      <div className="float-end">
        <div className="avatar-sm rounded-circle bg-white bg-opacity-25 p-2">
          <i className={`bx ${icon} fs-4`}></i>
        </div>
      </div>
      <h5 className="fw-normal mt-0 text-white-50">{title}</h5>
      <h3 className="my-2 text-white">{value?.toLocaleString() ?? 0}</h3>
      {percentage !== undefined && (
        <span className="badge bg-white bg-opacity-25">{percentage}%</span>
      )}
      {subtitle && <p className="mb-0 text-white-50 small">{subtitle}</p>}
    </div>
  </div>
);

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
export const DoughnutChart = ({
  data = [],
  innerRadius = 55,
  outerRadius = 80,
  showSliceLabels = false,
}) => {
  const prepared = prepareData(data);
  if (!prepared.length) {
    return <p className="text-muted small mb-0">No data available.</p>;
  }

  const total = prepared.reduce((sum, d) => sum + (d._value || 0), 0) || 1;

  const renderPctLabel = ({ percent }) => {
    if (!showSliceLabels) return null;
    if (!percent || percent <= 0) return null;
    const pct = Math.round(percent * 100);
    if (pct < 5) return null;
    return `${pct}%`;
  };

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
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              label={renderPctLabel}
              labelLine={false}
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

// Horizontal bar chart for objective performance: each objective gets its own color,
// shows OI% average, and a High/Low summary beside each.
const PERFORMANCE_THRESHOLD = 70; // ≥70% = High, <70% = Low

export const ObjectivePerformanceChart = ({ data = [], valueLabel = "OI %" }) => {
  const prepared = prepareData(data);
  if (!prepared.length) {
    return <p className="text-muted small mb-0">No objective performance data available.</p>;
  }

  const withColorAndSummary = prepared.map((d, idx) => ({
    ...d,
    color: d.color || PALETTE[idx % PALETTE.length],
    summary: (d._value ?? 0) >= PERFORMANCE_THRESHOLD ? "High" : "Low",
    _fullLabel: d.fullLabel || d.full_label || d.full_title || d.title || d._label,
  }));

  const chartHeight = Math.max(200, withColorAndSummary.length * 36);

  return (
    <div className="d-flex gap-4">
      <div style={{ width: "50%", minWidth: 240, height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart
            data={withColorAndSummary}
            layout="vertical"
            margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="_label"
              tick={{ fontSize: 11 }}
              width={140}
            />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(1)}%`, valueLabel]}
              labelFormatter={(label, payload) =>
                payload?.[0]?.payload?._fullLabel || label
              }
            />
            <Bar dataKey="_value" radius={[0, 4, 4, 0]} name={valueLabel}>
              {withColorAndSummary.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-grow-1 small">
        {withColorAndSummary.map((item, idx) => (
          <div
            key={idx}
            className="d-flex justify-content-between align-items-center mb-2 py-1"
          >
            <div className="d-flex align-items-center flex-grow-1 min-w-0 me-2">
              <span
                className="rounded-circle flex-shrink-0"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: item.color,
                }}
              />
              <span
                className="ms-2 text-wrap"
                style={{ whiteSpace: "normal", lineHeight: 1.2 }}
                title={item._fullLabel}
              >
                {item._fullLabel}
              </span>
            </div>
            <div className="d-flex align-items-center flex-shrink-0">
              <span className="text-muted me-2">{Number(item._value || 0).toFixed(1)}%</span>
              <span
                className={`badge ${
                  item.summary === "High"
                    ? "bg-label-success"
                    : "bg-label-danger"
                }`}
              >
                {item.summary}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const truncate = (s, max = 42) => {
  const str = String(s ?? "");
  if (str.length <= max) return str;
  return `${str.slice(0, max)}…`;
};

// Clustered bar chart for target performance: KPI% vs TI% per target
export const TargetPerformanceChart = ({
  targets = [],
  kpiColor = "#696CFF",
  tiColor = "#71DD37",
}) => {
  const rows = Array.isArray(targets) ? targets : [];
  if (rows.length === 0) {
    return <p className="text-muted small mb-0">No targets available.</p>;
  }

  const prepared = rows.map((t, idx) => {
    const title = t?.title || t?.label || t?.category || `Target ${idx + 1}`;
    const kpi = Number(t?.kpi_score ?? t?.kpi ?? t?.value ?? 0);
    const ti = Number(t?.operational_score ?? t?.ti ?? 0);
    return {
      name: truncate(title, 36),
      fullName: title,
      kpi: Number.isFinite(kpi) ? kpi : 0,
      ti: Number.isFinite(ti) ? ti : 0,
    };
  });

  // Show best 12 targets for readability (still keep full list in table below)
  const top = [...prepared].sort((a, b) => (b.kpi || 0) - (a.kpi || 0)).slice(0, 12);
  const height = Math.max(260, top.length * 34);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={top}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
          barCategoryGap={10}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 120]} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
          <Tooltip
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
            formatter={(v, name) => [`${Number(v).toFixed(1)}%`, String(name)]}
          />
          <Legend />
          <Bar
            dataKey="kpi"
            name="KPI performance (KPI%)"
            fill={kpiColor}
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="ti"
            name="Target Implementation (TI%)"
            fill={tiColor}
            radius={[0, 4, 4, 0]}
          />
        </ReBarChart>
      </ResponsiveContainer>
      {prepared.length > 12 && (
        <p className="small text-muted mb-0 mt-2">
          Showing top <strong>12</strong> targets by KPI%. See the table below for the full list.
        </p>
      )}
    </div>
  );
};

// Vertical bar chart (used for objectives by FY, objective performance, etc.)
export const BarChart = ({ data = [], barColor = "bg-primary", valueLabel }) => {
  const prepared = prepareData(data);
  if (!prepared.length) {
    return <p className="text-muted small mb-0">No data available.</p>;
  }

  const fill = mapBarColorToHex(barColor);
  const hasPerItemColor = prepared.some((d) => Boolean(d.color));

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
          <Bar
            dataKey="_value"
            fill={hasPerItemColor ? undefined : fill}
            radius={[4, 4, 0, 0]}
            name={valueLabel || undefined}
          >
            {hasPerItemColor
              ? prepared.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || fill} />
                ))
              : null}
          </Bar>
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

// Multi-series line chart for quarterly comparison (KPI vs institution vs baseline)
export const QuarterlyComparisonChart = ({ quarters = [], institutionalValue = null }) => {
  if (!Array.isArray(quarters) || quarters.length === 0) {
    return <p className="text-muted small mb-0">No comparison data available.</p>;
  }

  const inst =
    typeof institutionalValue === "number"
      ? institutionalValue
      : Number(institutionalValue || 0);

  const prepared = quarters.map((q) => ({
    name: q.label || q._label || q.category || q.status || "",
    kpi: q.value ?? q._value ?? 0,
    institution: inst || 0,
    baseline: 100,
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={prepared} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            interval={0}
            height={30}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="kpi"
            stroke="#696CFF"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Average KPI / AI %"
          />
          <Line
            type="monotone"
            dataKey="institution"
            stroke="#03C3EC"
            strokeWidth={2}
            dot={{ r: 0 }}
            strokeDasharray="4 4"
            name="Institutional AI (FY)"
          />
          <Line
            type="monotone"
            dataKey="baseline"
            stroke="#FFAB00"
            strokeWidth={1.5}
            dot={{ r: 0 }}
            strokeDasharray="2 6"
            name="Ideal baseline (100%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Stacked progress view for status / completion (kept lightweight, no Recharts)
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

// Activity feed list (used by ICT assets and can be reused elsewhere)
export const ActivityFeed = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted mb-0">No recent activities</p>
      </div>
    );
  }

  const getActivityTypeClass = (type) => {
    const classes = {
      Maintenance: "bg-warning",
      Assignment: "bg-info",
      Purchase: "bg-success",
      Disposal: "bg-danger",
    };
    return classes[type] || "bg-secondary";
  };

  const getActivityIcon = (type) => {
    const icons = {
      Maintenance: "bx bx-wrench",
      Assignment: "bx bx-user-check",
      Purchase: "bx bx-purchase-tag",
      Disposal: "bx bx-trash",
    };
    return icons[type] || "bx bx-info-circle";
  };

  return (
    <div className="activity-feed">
      {activities.slice(0, 8).map((activity, index) => (
        <div key={index} className="activity-item d-flex align-items-start mb-3">
          <div
            className={`activity-badge me-3 flex-shrink-0 ${getActivityTypeClass(
              activity.activity_type
            )}`}
          >
            <i className={getActivityIcon(activity.activity_type)}></i>
          </div>
          <div className="activity-content flex-grow-1">
            <div className="d-flex justify-content-between">
              <h6 className="mb-1">{activity.description}</h6>
              {activity.timestamp && (
                <small className="text-muted">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </small>
              )}
            </div>
            <p className="mb-1 text-muted">
              {activity.asset_tag && (
                <>
                  Asset: <strong>{activity.asset_tag}</strong>
                </>
              )}
              {activity.user && (
                <>
                  {" "}
                  • By: <strong>{activity.user}</strong>
                </>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

