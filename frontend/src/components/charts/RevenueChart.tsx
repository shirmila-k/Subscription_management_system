import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatINR } from '../../utils/format';

interface DataPoint {
  month: string;
  revenue: number;
  collections: number;
}

interface RevenueChartProps {
  data?: DataPoint[];
  height?: number;
}

const defaultData: DataPoint[] = [
  { month: 'May', revenue: 145000, collections: 128000 },
  { month: 'Jun', revenue: 182000, collections: 165000 },
  { month: 'Jul', revenue: 215000, collections: 198000 },
  { month: 'Aug', revenue: 268000, collections: 242000 },
  { month: 'Sep', revenue: 310000, collections: 295000 },
  { month: 'Oct', revenue: 384000, collections: 362000 },
];

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data = defaultData,
  height = 280,
}) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="plumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6D286F" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6D286F" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16845B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#16845B" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5EC" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#817986', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#817986', fontSize: 11 }}
            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 rounded-xl border border-[#EAE5EC] shadow-dropdown text-xs space-y-1">
                    <p className="font-bold text-[#27212B]">{label}</p>
                    <p className="text-[#6D286F] font-semibold flex items-center justify-between gap-3">
                      <span>Invoiced:</span>
                      <strong>{formatINR(Number(payload[0]?.value) || 0)}</strong>
                    </p>
                    {payload[1] && (
                      <p className="text-[#16845B] font-semibold flex items-center justify-between gap-3">
                        <span>Collected:</span>
                        <strong>{formatINR(Number(payload[1]?.value) || 0)}</strong>
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#6D286F"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#plumGradient)"
            name="Invoiced Revenue"
          />
          <Area
            type="monotone"
            dataKey="collections"
            stroke="#16845B"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#emeraldGradient)"
            name="Cash Collected"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
