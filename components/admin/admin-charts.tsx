"use client";

import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DailyPoint = {
  date: string;
  conversions: number;
  failed: number;
};

export type StatusSlice = {
  name: string;
  value: number;
  fill: string;
};

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
      <h3 className="font-semibold text-base">{title}</h3>
      <p className="mt-0.5 text-muted-foreground text-xs">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function AdminCharts({
  daily,
  statuses,
}: {
  daily: DailyPoint[];
  statuses: StatusSlice[];
}) {
  const hasStatusData = statuses.some((s) => s.value > 0);

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ChartCard
          subtitle="Conversions per day · last 14 days"
          title="Conversion activity"
        >
          <ResponsiveContainer height={240} width="100%">
            <AreaChart
              data={daily}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="fillConversions"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#4285f4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4285f4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillFailed" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                axisLine={false}
                dataKey="date"
                fontSize={11}
                stroke="currentColor"
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                fontSize={11}
                stroke="currentColor"
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                dataKey="conversions"
                fill="url(#fillConversions)"
                name="Conversions"
                stroke="#4285f4"
                strokeWidth={2}
                type="monotone"
              />
              <Area
                dataKey="failed"
                fill="url(#fillFailed)"
                name="Failed"
                stroke="#ef4444"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard subtitle="Recent pipeline outcomes" title="Status breakdown">
        {hasStatusData ? (
          <ResponsiveContainer height={240} width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={statuses}
                dataKey="value"
                innerRadius={55}
                nameKey="name"
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
              >
                {statuses.map((slice) => (
                  <Cell fill={slice.fill} key={slice.name} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[240px] items-center justify-center text-muted-foreground text-sm">
            No conversions yet
          </div>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {statuses.map((s) => (
            <span
              className="flex items-center gap-1.5 text-muted-foreground text-xs"
              key={s.name}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: s.fill }}
              />
              {s.name} · {s.value}
            </span>
          ))}
        </div>
      </ChartCard>
    </section>
  );
}
