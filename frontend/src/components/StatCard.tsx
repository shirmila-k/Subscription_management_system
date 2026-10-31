import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendObject {
  value: number | string;
  isPositive?: boolean;
}

export interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  trend?: string | TrendObject;
  trendUp?: boolean;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  label,
  value,
  subtitle,
  description,
  icon,
  trend,
  trendUp,
  actionText,
  onAction,
  className = '',
}) => {
  const displayTitle = label || title || '';
  const displaySubtitle = description || subtitle;

  let trendText: string | null = null;
  let isPositiveTrend = trendUp;

  if (typeof trend === 'string') {
    trendText = trend;
  } else if (trend && typeof trend === 'object') {
    trendText = `${trend.isPositive ? '+' : ''}${trend.value}%`;
    isPositiveTrend = trend.isPositive !== undefined ? trend.isPositive : true;
  }

  // Render Icon helper: either element or component function
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div
      className={`bg-white rounded-2xl p-6 border border-[#EAE5EC] shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#817986] uppercase tracking-wider">{displayTitle}</p>
          <div className="w-10 h-10 rounded-xl bg-[#F3EAF5] text-[#6D286F] flex items-center justify-center transition-transform group-hover:scale-105">
            {renderIcon()}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <h3 className="text-3xl font-extrabold text-[#27212B] tracking-tight">{value}</h3>
          {trendText && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                isPositiveTrend
                  ? 'text-[#16845B] bg-[#E8F5EE]'
                  : 'text-[#C53B4B] bg-[#FDF0F2]'
              }`}
            >
              {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendText}
            </span>
          )}
        </div>

        {displaySubtitle && <p className="mt-1 text-xs text-[#817986]">{displaySubtitle}</p>}
      </div>

      {actionText && (
        <div className="mt-4 pt-3 border-t border-[#F0ECF2]">
          <button
            onClick={onAction}
            className="text-xs font-semibold text-[#6D286F] hover:text-[#421747] flex items-center gap-1 transition"
          >
            {actionText} &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

export default StatCard;
