import React from 'react';

export type BadgeStatus =
  | 'ACTIVE'
  | 'PAID'
  | 'CONFIRMED'
  | 'PENDING'
  | 'QUOTATION'
  | 'PAST_DUE'
  | 'OVERDUE'
  | 'FAILED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'VOID'
  | 'DRAFT'
  | 'PAUSED'
  | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const norm = (status || '').toUpperCase();

  let bg = 'bg-[#FAF9FB] text-[#817986] border-[#EAE5EC]';
  let dotColor = 'bg-[#817986]';
  let label = status;

  if (['ACTIVE', 'PAID', 'SUCCESS', 'READY'].includes(norm)) {
    bg = 'bg-[#E8F5EE] text-[#16845B] border-[#16845B]/20';
    dotColor = 'bg-[#16845B]';
    label = norm === 'PAID' ? 'Paid' : 'Active';
  } else if (['PENDING', 'QUOTATION', 'CONFIRMED', 'WARNING', 'TRIAL'].includes(norm)) {
    bg = 'bg-[#FEF6E9] text-[#B7791F] border-[#B7791F]/20';
    dotColor = 'bg-[#B7791F]';
    label = norm === 'QUOTATION' ? 'Quotation' : norm === 'CONFIRMED' ? 'Confirmed' : 'Pending';
  } else if (['OVERDUE', 'FAILED', 'ERROR', 'CLOSED', 'CANCELLED', 'VOID'].includes(norm)) {
    bg = 'bg-[#FDF0F2] text-[#C53B4B] border-[#C53B4B]/20';
    dotColor = 'bg-[#C53B4B]';
    label = norm === 'OVERDUE' ? 'Overdue' : norm === 'CLOSED' ? 'Closed' : 'Failed';
  } else if (['PAUSED', 'DRAFT'].includes(norm)) {
    bg = 'bg-[#FAF9FB] text-[#817986] border-[#EAE5EC]';
    dotColor = 'bg-[#817986]';
    label = norm === 'PAUSED' ? 'Paused' : 'Draft';
  }

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-0.5 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizeClasses} ${bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="capitalize">{label}</span>
    </span>
  );
};

export default StatusBadge;
