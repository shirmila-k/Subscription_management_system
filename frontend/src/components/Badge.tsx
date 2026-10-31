import React from 'react';
import { StatusBadge } from './StatusBadge';

interface BadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '', size = 'md' }) => {
  return <StatusBadge status={status} className={className} size={size} />;
};

export default Badge;
