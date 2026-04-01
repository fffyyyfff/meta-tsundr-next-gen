'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --- StatCard ---

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  className?: string;
}

export function StatCard({ label, value, description, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

// --- StatusPieChart ---

const STATUS_COLORS: Record<string, string> = {
  UNREAD: '#9ca3af',
  READING: '#3b82f6',
  FINISHED: '#10b981',
};

const STATUS_LABELS: Record<string, string> = {
  UNREAD: '積読',
  READING: '読書中',
  FINISHED: '読了',
};

interface StatusPieChartProps {
  byStatus: Record<string, number>;
}

export function StatusPieChart({ byStatus }: StatusPieChartProps) {
  const data = Object.entries(byStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    value: count,
    status,
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ステータス別</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">ステータス別</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              label={({ name, value }) => `${name} ${value}`}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#ccc'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// --- MonthlyBarChart ---

interface MonthlyBarChartProps {
  data: { month: string; count: number }[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const formatted = data.map((d) => {
    const [, m] = d.month.split('-');
    return { ...d, label: `${parseInt(m!, 10)}月` };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">月別追加冊数</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" name="追加冊数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
