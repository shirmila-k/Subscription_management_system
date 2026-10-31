import React, { useState } from 'react';

interface BarChartProps {
  data: Array<{ label: string; value: number; secondaryLabel?: string }>;
  height?: number;
  color?: string;
  hoverColor?: string;
  formatValue?: (val: number) => string;
  emptyMessage?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 220,
  color = '#6D286F',
  hoverColor = '#84418A',
  formatValue = (v) => `₹${v.toLocaleString()}`,
  emptyMessage = 'No comparison records found for this period.',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center border border-dashed border-[#EAE5EC] rounded-xl text-[#817986] text-xs p-6 bg-[#FAF9FB]"
        style={{ height }}
      >
        <span className="material-symbols-outlined text-[32px] text-[#A69FA9] mb-1">bar_chart</span>
        <p className="font-medium">{emptyMessage}</p>
        <span className="text-[11px] text-[#A69FA9] mt-0.5">Recorded metrics will populate this chart dynamically</span>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = 500;
  const padding = { top: 25, right: 15, bottom: 35, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const barWidth = Math.min(42, Math.max(16, (innerWidth / data.length) * 0.6));
  const step = innerWidth / data.length;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ minHeight: height }}>
        {/* Horizontal Baseline */}
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={padding.left + innerWidth}
          y2={padding.top + innerHeight}
          stroke="#EAE5EC"
          strokeWidth="1"
        />

        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * innerHeight;
          const x = padding.left + i * step + (step - barWidth) / 2;
          const y = padding.top + innerHeight - barHeight;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Bar Rect */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)}
                rx="4"
                fill={isHovered ? hoverColor : color}
                className="transition-all duration-150"
              />

              {/* Value Text Above Bar */}
              {isHovered && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-[#27212B]"
                >
                  {formatValue(d.value)}
                </text>
              )}

              {/* X Axis Label */}
              <text
                x={x + barWidth / 2}
                y={padding.top + innerHeight + 16}
                textAnchor="middle"
                className="text-[9px] fill-[#817986] font-medium"
              >
                {d.label.length > 10 ? `${d.label.slice(0, 9)}…` : d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip Card */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="absolute z-20 pointer-events-none bg-[#27212B] text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 text-xs animate-fade-in"
          style={{
            left: `${((padding.left + hoveredIdx * step + step / 2) / width) * 100}%`,
            top: '15%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-[10px] text-[#A69FA9] font-medium">{data[hoveredIdx].label}</div>
          <div className="font-bold text-sm tracking-tight text-white mt-0.5">
            {formatValue(data[hoveredIdx].value)}
          </div>
          {data[hoveredIdx].secondaryLabel && (
            <div className="text-[10px] text-[#D8B4E2] mt-0.5">{data[hoveredIdx].secondaryLabel}</div>
          )}
        </div>
      )}
    </div>
  );
};
