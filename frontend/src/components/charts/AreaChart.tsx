import React, { useState } from 'react';

interface AreaChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  fillColor?: string;
  formatValue?: (val: number) => string;
  emptyMessage?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 240,
  color = '#6D286F',
  fillColor = '#84418A',
  formatValue = (v) => `₹${v.toLocaleString()}`,
  emptyMessage = 'No trend data available for this period.',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center border border-dashed border-[#EAE5EC] rounded-xl text-[#817986] text-xs p-8 bg-[#FAF9FB]"
        style={{ height }}
      >
        <span className="material-symbols-outlined text-[32px] text-[#A69FA9] mb-1">show_chart</span>
        <p className="font-medium">{emptyMessage}</p>
        <span className="text-[11px] text-[#A69FA9] mt-0.5">Recorded metrics will populate this chart dynamically</span>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 35, left: 55 };
  const width = 600;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  // Round up max value nicely for grid
  const yMax = Math.ceil(maxValue * 1.15);

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * innerWidth;
    const y = padding.top + innerHeight - (d.value / yMax) * innerHeight;
    return { x, y, ...d };
  });

  // SVG Area path
  const linePath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${
    padding.top + innerHeight
  } Z`;

  // Grid levels (4 ticks)
  const yTicks = [0, yMax * 0.33, yMax * 0.66, yMax];

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ minHeight: height }}
      >
        <defs>
          <linearGradient id={`areaGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {yTicks.map((tick, i) => {
          const y = padding.top + innerHeight - (tick / yMax) * innerHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke="#EAE5EC"
                strokeDasharray={i === 0 ? 'none' : '3 3'}
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-[#817986] font-mono"
              >
                {formatValue(Math.round(tick))}
              </text>
            </g>
          );
        })}

        {/* Filled Area */}
        <path d={areaPath} fill={`url(#areaGrad-${color.replace('#', '')})`} />

        {/* Trend Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points & hover zones */}
        {points.map((p, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible large hover hit target */}
              <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

              {/* Visible Circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 5 : 3}
                fill={isHovered ? '#FFFFFF' : color}
                stroke={color}
                strokeWidth={isHovered ? 3 : 1.5}
                className="transition-all duration-150"
              />

              {/* X Axis Labels */}
              {(data.length <= 12 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
                <text
                  x={p.x}
                  y={padding.top + innerHeight + 18}
                  textAnchor="middle"
                  className="text-[9px] fill-[#817986] font-medium"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Crosshair on hover */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <line
            x1={points[hoveredIndex].x}
            y1={padding.top}
            x2={points[hoveredIndex].x}
            y2={padding.top + innerHeight}
            stroke={color}
            strokeDasharray="2 2"
            strokeWidth="1"
            className="pointer-events-none opacity-60"
          />
        )}
      </svg>

      {/* Interactive Tooltip Card */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute z-20 pointer-events-none bg-[#27212B] text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 text-xs animate-fade-in"
          style={{
            left: `${(points[hoveredIndex].x / width) * 100}%`,
            top: `${(points[hoveredIndex].y / height) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="text-[10px] text-[#A69FA9] font-medium">{points[hoveredIndex].label}</div>
          <div className="font-bold text-sm tracking-tight text-white mt-0.5">
            {formatValue(points[hoveredIndex].value)}
          </div>
        </div>
      )}
    </div>
  );
};
