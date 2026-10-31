import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SubDataPoint {
  plan: string;
  active: number;
  quotations: number;
}

interface SubscriptionChartProps {
  data?: SubDataPoint[];
  height?: number;
}

const defaultData: SubDataPoint[] = [
  { plan: 'Cloud ERP Pro', active: 38, quotations: 12 },
  { plan: 'ERP Enterprise', active: 24, quotations: 8 },
  { plan: 'AI Document OCR', active: 62, quotations: 15 },
  { plan: 'Odoo Connector', active: 19, quotations: 6 },
];

export const SubscriptionChart: React.FC<SubscriptionChartProps> = ({
  data = defaultData,
  height = 240,
}) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5EC" />
          <XAxis
            dataKey="plan"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#817986', fontSize: 11 }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#817986', fontSize: 11 }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 rounded-xl border border-[#EAE5EC] shadow-dropdown text-xs space-y-1">
                    <p className="font-bold text-[#27212B]">{label}</p>
                    <p className="text-[#6D286F] font-semibold flex items-center justify-between gap-3">
                      <span>Active Subscriptions:</span>
                      <strong>{payload[0]?.value}</strong>
                    </p>
                    {payload[1] && (
                      <p className="text-[#B7791F] font-semibold flex items-center justify-between gap-3">
                        <span>Quotes Pending:</span>
                        <strong>{payload[1]?.value}</strong>
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="active" fill="#6D286F" radius={[6, 6, 0, 0]} name="Active" />
          <Bar dataKey="quotations" fill="#D1ACD7" radius={[6, 6, 0, 0]} name="Quotations" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubscriptionChart;
