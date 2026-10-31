import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  subtext?: string;
  badgeText?: string;
  isErrorBadge?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendDirection = 'up',
  subtext,
  badgeText,
  isErrorBadge = false,
}) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#EAE5EC] shadow-[0_1px_3px_0_rgba(39,33,43,0.04)] hover:shadow-md transition-shadow flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#817986] uppercase tracking-wider">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#F5EAF9] flex items-center justify-center text-[#6D286F]">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-[28px] font-bold text-[#27212B] tracking-tight tabular-nums">
          {value}
        </span>

        {trend && (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FAF9FB] text-[#27212B] text-[11px] font-semibold border border-[#EAE5EC]">
            <span className="material-symbols-outlined text-[14px] text-[#16845B]">
              {trendDirection === 'down' ? 'trending_down' : 'trending_up'}
            </span>
            {trend}
          </span>
        )}

        {badgeText && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              isErrorBadge
                ? 'bg-[#FDF0F2] text-[#C53B4B] border border-[#C53B4B]/20'
                : 'bg-[#F5EAF9] text-[#6D286F] border border-[#6D286F]/20'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-2 text-xs text-[#817986]">
          {subtext}
        </div>
      )}
    </div>
  );
};

export default StatCard;
