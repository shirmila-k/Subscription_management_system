import React from 'react';

interface PageHeaderProps {
  title: string;
  badge?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  badge,
  description,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-2xl font-bold text-[#1f1924] tracking-tight">{title}</h1>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#f5eaf9] text-[#6D286F] text-xs font-semibold">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-sm text-[#81737e]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
};
