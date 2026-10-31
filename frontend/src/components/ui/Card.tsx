import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[#EAE5EC] shadow-[0_1px_3px_0_rgba(39,33,43,0.04)] overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="p-5 pb-3 border-b border-[#EAE5EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-[#27212B] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-xs text-[#817986] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export default Card;
