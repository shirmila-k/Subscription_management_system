import React from 'react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const norm = (status || '').toUpperCase();

  const getStyle = (): { bg: string; text: string; dot: string; border: string } => {
    switch (norm) {
      case 'ACTIVE':
      case 'PAID':
      case 'SUCCESS':
        return {
          bg: 'bg-[#E8F5EE]',
          text: 'text-[#16845B]',
          dot: 'bg-[#16845B]',
          border: 'border-[#C3E8D5]',
        };

      case 'CONFIRMED':
      case 'CONFIGURED':
        return {
          bg: 'bg-[#F3EAF5]',
          text: 'text-[#6D286F]',
          dot: 'bg-[#6D286F]',
          border: 'border-[#E5D1E8]',
        };

      case 'QUOTATION':
      case 'PENDING':
        return {
          bg: 'bg-[#FEF7EC]',
          text: 'text-[#B7791F]',
          dot: 'bg-[#B7791F]',
          border: 'border-[#FBE3B5]',
        };

      case 'PAUSED':
        return {
          bg: 'bg-[#F5F0FA]',
          text: 'text-[#84418A]',
          dot: 'bg-[#84418A]',
          border: 'border-[#E2D5EC]',
        };

      case 'OVERDUE':
      case 'FAILED':
      case 'CLOSED':
      case 'VOID':
        return {
          bg: 'bg-[#FDF0F2]',
          text: 'text-[#C53B4B]',
          dot: 'bg-[#C53B4B]',
          border: 'border-[#F8CCD3]',
        };

      case 'DRAFT':
      default:
        return {
          bg: 'bg-[#F5F3F7]',
          text: 'text-[#817986]',
          dot: 'bg-[#817986]',
          border: 'border-[#EAE5EC]',
        };
    }
  };

  const style = getStyle();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`} />
      {norm}
    </span>
  );
};

export default StatusBadge;
