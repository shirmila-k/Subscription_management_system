import React, { useState } from 'react';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  holeRadiusPercent?: number;
  centerTitle?: string;
  centerSubtitle?: string;
  emptyMessage?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 220,
  holeRadiusPercent = 0.65,
  centerTitle,
  centerSubtitle = 'Total',
  emptyMessage = 'No distribution data available.',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center border border-dashed border-[#EAE5EC] rounded-xl text-[#817986] text-xs p-6 bg-[#FAF9FB]"
        style={{ minHeight: size }}
      >
        <span className="material-symbols-outlined text-[32px] text-[#A69FA9] mb-1">donut_large</span>
        <p className="font-medium">{emptyMessage}</p>
        <span className="text-[11px] text-[#A69FA9] mt-0.5">Recorded metrics will populate this chart dynamically</span>
      </div>
    );
  }

  const radius = size / 2;
  const innerRadius = radius * holeRadiusPercent;

  let cumulativeAngle = 0;
  const slices = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const angle = (d.value / total) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = radius + radius * Math.cos(startRad);
      const y1 = radius + radius * Math.sin(startRad);
      const x2 = radius + radius * Math.cos(endRad);
      const y2 = radius + radius * Math.sin(endRad);

      const ix1 = radius + innerRadius * Math.cos(startRad);
      const iy1 = radius + innerRadius * Math.sin(startRad);
      const ix2 = radius + innerRadius * Math.cos(endRad);
      const iy2 = radius + innerRadius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData =
        angle >= 359.99
          ? `M ${radius} 0 A ${radius} ${radius} 0 1 0 ${radius} ${2 * radius} A ${radius} ${radius} 0 1 0 ${radius} 0 M ${radius} ${radius - innerRadius} A ${innerRadius} ${innerRadius} 0 1 1 ${radius} ${radius + innerRadius} A ${innerRadius} ${innerRadius} 0 1 1 ${radius} ${radius - innerRadius} Z`
          : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

      const percent = Math.round((d.value / total) * 1000) / 10;

      return {
        ...d,
        index: i,
        pathData,
        percent,
      };
    });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
      {/* SVG Donut Circle */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.index;
            return (
              <path
                key={slice.index}
                d={slice.pathData}
                fill={slice.color}
                className="cursor-pointer transition-opacity duration-150"
                style={{
                  opacity: hoveredIdx === null || isHovered ? 1 : 0.45,
                  transformOrigin: 'center',
                }}
                onMouseEnter={() => setHoveredIdx(slice.index)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-xl font-bold text-[#27212B] tracking-tight">
            {hoveredIdx !== null ? slices[hoveredIdx]?.value : centerTitle ?? total}
          </span>
          <span className="text-[10px] font-semibold text-[#817986] uppercase tracking-wider">
            {hoveredIdx !== null ? slices[hoveredIdx]?.label : centerSubtitle}
          </span>
        </div>
      </div>

      {/* Legend with Counts and Percentages */}
      <div className="flex flex-col gap-2 w-full text-xs">
        {slices.map((slice) => {
          const isHovered = hoveredIdx === slice.index;
          return (
            <div
              key={slice.index}
              className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                isHovered ? 'bg-[#F3EAF5]' : 'hover:bg-[#FAF9FB]'
              }`}
              onMouseEnter={() => setHoveredIdx(slice.index)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="font-medium text-[#27212B]">{slice.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#27212B]">{slice.value.toLocaleString()}</span>
                <span className="text-[11px] text-[#817986] font-mono w-10 text-right">{slice.percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
