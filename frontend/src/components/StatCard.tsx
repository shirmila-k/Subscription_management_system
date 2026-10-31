import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp,
}) => {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 shadow-xl group">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trendUp
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-rose-400 bg-rose-500/10'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
