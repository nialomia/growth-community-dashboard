import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { useDashboard } from "../../dashboard-context";

const palette = {
  blue: "var(--gc-ibm-blue)",
  green: "var(--gc-green)",
  purple: "var(--gc-purple)",
  grey: "var(--gc-grey)",
  amber: "var(--gc-amber)",
};

const axisStyle = { fontSize: 12, fill: "#697077" };

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[var(--border)] bg-white px-3 py-2 shadow-sm">
      <p className="text-[12px] text-[var(--gc-grey)]">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-[13px] text-[var(--gc-graphite)]">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ background: p.color }}
          />
          {p.name}: <span className="tabular-nums" style={{ fontWeight: 500 }}>
            {p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

type Series = { key: string; name: string; color: keyof typeof palette };

export function TrendLineChart({
  data,
  series,
  height = 240,
  yFormatter,
}: {
  data: any[];
  series: Series[];
  height?: number;
  yFormatter?: (v: number) => string;
}) {
  const { lowData } = useDashboard();
  // Low-data mode: only the primary series, no grid, no dots.
  const shown = lowData ? series.slice(0, 1) : series;
  return (
    <ResponsiveContainer width="100%" height={lowData ? Math.min(height, 180) : height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        {!lowData && <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#eef1f4" vertical={false} />}
        <XAxis key="x" dataKey={Object.keys(data[0])[0]} tick={axisStyle} tickLine={false} axisLine={{ stroke: "#dde1e6" }} />
        <YAxis
          key="y"
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={yFormatter}
        />
        <Tooltip key="tt" content={<ChartTooltip />} />
        {!lowData && shown.length > 1 && <Legend key="lg" iconType="plainline" wrapperStyle={{ fontSize: 12 }} />}
        {shown.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={palette[s.color]}
            strokeWidth={2}
            dot={lowData ? false : { r: 2 }}
            activeDot={{ r: 4 }}
            isAnimationActive={!lowData}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  series,
  height = 240,
}: {
  data: any[];
  series: Series[];
  height?: number;
}) {
  const { lowData } = useDashboard();
  const shown = lowData ? series.slice(0, 1) : series;
  return (
    <ResponsiveContainer width="100%" height={lowData ? Math.min(height, 180) : height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        {!lowData && <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#eef1f4" vertical={false} />}
        <XAxis key="x" dataKey={Object.keys(data[0])[0]} tick={axisStyle} tickLine={false} axisLine={{ stroke: "#dde1e6" }} />
        <YAxis key="y" tick={axisStyle} tickLine={false} axisLine={false} width={44} />
        <Tooltip key="tt" content={<ChartTooltip />} cursor={{ fill: "rgba(15,98,254,0.05)" }} />
        {!lowData && shown.length > 1 && <Legend key="lg" wrapperStyle={{ fontSize: 12 }} />}
        {shown.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={palette[s.color]}
            radius={[3, 3, 0, 0]}
            isAnimationActive={!lowData}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* Grouped bar chart with multiple series side-by-side. */
export function GroupedBarChart({
  data,
  series,
  height = 240,
  yFormatter,
}: {
  data: any[];
  series: Series[];
  height?: number;
  yFormatter?: (v: number) => string;
}) {
  const { lowData } = useDashboard();
  const shown = lowData ? series.slice(0, 1) : series;
  return (
    <ResponsiveContainer width="100%" height={lowData ? Math.min(height, 180) : height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        {!lowData && <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#eef1f4" vertical={false} />}
        <XAxis key="x" dataKey={Object.keys(data[0])[0]} tick={axisStyle} tickLine={false} axisLine={{ stroke: "#dde1e6" }} />
        <YAxis key="y" tick={axisStyle} tickLine={false} axisLine={false} width={44} tickFormatter={yFormatter} />
        <Tooltip key="tt" content={<ChartTooltip />} cursor={{ fill: "rgba(15,98,254,0.05)" }} />
        {!lowData && <Legend key="lg" wrapperStyle={{ fontSize: 12 }} />}
        {shown.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={palette[s.color]} radius={[3, 3, 0, 0]} isAnimationActive={!lowData} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* Sparkline-style micro chart for compact KPI contexts. */
export function MiniSpark({ data, dataKey, color = "blue" }: { data: any[]; dataKey: string; color?: keyof typeof palette }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey={dataKey} stroke={palette[color]} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
