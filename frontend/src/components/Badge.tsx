import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const getStyle = (st: string) => {
    switch (st.toUpperCase()) {
      case 'ACTIVE':
      case 'PAID':
      case 'SUCCESS':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'QUOTATION':
      case 'DRAFT':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'CONFIRMED':
      case 'CONFIGURED':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'PAUSED':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'OVERDUE':
      case 'FAILED':
      case 'CLOSED':
      case 'VOID':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle(
        status
      )} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80 animate-pulse" />
      {status}
    </span>
  );
};
