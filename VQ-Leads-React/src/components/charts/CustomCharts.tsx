import React, { useState, useRef, useEffect } from 'react';

// Interfaces
interface LineChartData {
  date: string;
  count: number;
  convertedCount?: number;
}

interface LineChartProps {
  data: LineChartData[];
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width || 500);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return <div className="text-center text-xs text-muted-foreground py-10">No timeline data available</div>;
  }

  // Calculate scales
  const maxVal = Math.max(...data.map(d => Math.max(d.count, d.convertedCount || 0)), 5);
  const minVal = 0;
  
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
    const y1 = height - padding.bottom - ((d.count - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
    const y2 = height - padding.bottom - (((d.convertedCount || 0) - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
    return { x, y1, y2, ...d };
  });

  // Build path for Line 1 (Total Leads) - Green
  let pathD1 = '';
  let areaD1 = '';
  if (points.length > 0) {
    pathD1 = `M ${points[0].x} ${points[0].y1}`;
    areaD1 = `M ${points[0].x} ${height - padding.bottom}`;
    for (let i = 1; i < points.length; i++) {
      pathD1 += ` L ${points[i].x} ${points[i].y1}`;
    }
    areaD1 += pathD1.substring(1);
    areaD1 += ` L ${points[points.length - 1].x} ${height - padding.bottom} Z`;
  }

  // Build path for Line 2 (Converted Leads) - Blue
  let pathD2 = '';
  let areaD2 = '';
  if (points.length > 0) {
    pathD2 = `M ${points[0].x} ${points[0].y2}`;
    areaD2 = `M ${points[0].x} ${height - padding.bottom}`;
    for (let i = 1; i < points.length; i++) {
      pathD2 += ` L ${points[i].x} ${points[i].y2}`;
    }
    areaD2 += pathD2.substring(1);
    areaD2 += ` L ${points[points.length - 1].x} ${height - padding.bottom} Z`;
  }

  // Draw grid lines
  const gridLines = [];
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const yVal = minVal + (i / yTicks) * (maxVal - minVal);
    const y = height - padding.bottom - (i / yTicks) * (height - padding.top - padding.bottom);
    gridLines.push({ y, val: Math.round(yVal) });
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    let closestIdx = 0;
    let minDiff = Infinity;
    
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
    setTooltipPos({
      x: points[closestIdx].x + rect.left - containerRef.current.getBoundingClientRect().left,
      y: Math.min(points[closestIdx].y1, points[closestIdx].y2) - 50
    });
  };

  return (
    <div ref={containerRef} className="relative w-full h-[220px]">
      {hoverIndex !== null && points[hoverIndex] && (
        <div 
          className="absolute z-10 bg-card/95 border border-border px-3 py-2 rounded-lg shadow-lg pointer-events-none text-left min-w-[120px]"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translateX(-50%)',
            transition: 'left 0.1s ease, top 0.1s ease'
          }}
        >
          <div className="text-[10px] font-bold text-muted-foreground mb-1">{points[hoverIndex].date}</div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1 text-[#10b981] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Total:
            </span>
            <span className="font-bold text-foreground">{points[hoverIndex].count}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs mt-0.5">
            <span className="flex items-center gap-1 text-[#3b82f6] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> Converted:
            </span>
            <span className="font-bold text-foreground">{points[hoverIndex].convertedCount || 0}</span>
          </div>
        </div>
      )}

      <svg 
        className="w-full h-full overflow-visible" 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="totalGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="convertedGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line 
              x1={padding.left} 
              y1={line.y} 
              x2={width - padding.right} 
              y2={line.y} 
              stroke="var(--border)" 
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text 
              x={padding.left - 10} 
              y={line.y + 4} 
              fill="var(--muted-foreground)" 
              fontSize="10" 
              textAnchor="end"
              className="font-medium font-sans"
            >
              {line.val}
            </text>
          </g>
        ))}

        {/* X Axis labels */}
        {points.map((p, idx) => {
          if (idx % (data.length > 10 ? 3 : 2) !== 0) return null;
          return (
            <text
              key={idx}
              x={p.x}
              y={height - 5}
              fill="var(--muted-foreground)"
              fontSize="10"
              textAnchor="middle"
              className="font-medium font-sans"
            >
              {p.date}
            </text>
          );
        })}

        {/* Shaded Areas */}
        {areaD1 && <path d={areaD1} fill="url(#totalGlow)" />}
        {areaD2 && <path d={areaD2} fill="url(#convertedGlow)" />}

        {/* Lines */}
        {pathD1 && (
          <path 
            d={pathD1} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}
        {pathD2 && (
          <path 
            d={pathD2} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {/* Points indicator on hover */}
        {hoverIndex !== null && points[hoverIndex] && (
          <>
            <circle 
              cx={points[hoverIndex].x}
              cy={points[hoverIndex].y1}
              r="6"
              fill="#10b981"
              stroke="#090a0f"
              strokeWidth="2"
            />
            <circle 
              cx={points[hoverIndex].x}
              cy={points[hoverIndex].y2}
              r="5"
              fill="#3b82f6"
              stroke="#090a0f"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
    </div>
  );
};


// Donut Chart
interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
}

export const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return <div className="text-center text-xs text-muted-foreground py-10">No source data available</div>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = 180;
  const radius = 62;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-row items-center justify-between gap-6 w-full p-2">
      <div className="relative" style={{ width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.02)"
            strokeWidth={strokeWidth}
          />
          {data.map((item, idx) => {
            if (item.value === 0) return null;
            const percentage = item.value / total;
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percentage;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            );
          })}
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <span className="text-2xl font-bold text-foreground">{total}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total</span>
        </div>
      </div>

      {/* Legend on the Right */}
      <div className="flex flex-col gap-2.5 flex-1 pr-2">
        {data.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={idx} className="flex items-center justify-between text-xs w-full">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground font-semibold truncate max-w-[80px]">{item.label}</span>
              </div>
              <span className="font-bold text-foreground">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Bar Chart
interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartItem[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return <div className="text-center text-xs text-muted-foreground py-10">No data available</div>;
  }

  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2 h-[200px] pt-2 px-1">
      {data.map((item, idx) => {
        const heightPct = (item.value / maxVal) * 100;
        const color = item.color || '#3b82f6';
        return (
          <div key={idx} className="flex flex-col items-center flex-1 gap-2 min-w-0">
            <span className="text-[10px] font-bold text-foreground tabular-nums">
              {item.value >= 1000 ? `${(item.value / 1000).toFixed(0)}k` : item.value}
            </span>
            <div className="w-full flex justify-center items-end h-[130px]">
              <div
                className="w-full max-w-[36px] rounded-t-lg transition-all duration-500 shadow-lg"
                style={{
                  height: `${Math.max(heightPct, 4)}%`,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
                  boxShadow: `0 4px 14px ${color}33`,
                }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground font-semibold text-center truncate w-full">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** Mini sparkline for KPI cards */
export const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#3b82f6' }) => {
  const pts = data.length ? data : [0, 0, 0, 0];
  const max = Math.max(...pts, 1);
  const w = 64;
  const h = 28;
  const path = pts.map((v, i) => {
    const x = (i / Math.max(pts.length - 1, 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="opacity-80">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

interface TrendPoint { date: string; count: number; revenue?: number }

export const RevenueLeadsTrendChart: React.FC<{ data: TrendPoint[] }> = ({ data }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(600);
  const h = 220;
  const pad = { t: 16, r: 16, b: 28, l: 40 };

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(e => setWidth(e[0].contentRect.width || 600));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!data?.length) return <div className="py-16 text-center text-xs text-muted-foreground">No trend data</div>;

  const maxLeads = Math.max(...data.map(d => d.count), 5);
  const maxRev = Math.max(...data.map(d => d.revenue || 0), 1000);
  const pts = data.map((d, i) => {
    const x = pad.l + (i / Math.max(data.length - 1, 1)) * (width - pad.l - pad.r);
    const yL = h - pad.b - (d.count / maxLeads) * (h - pad.t - pad.b);
    const yR = h - pad.b - ((d.revenue || 0) / maxRev) * (h - pad.t - pad.b);
    return { x, yL, yR, ...d };
  });

  const line = (key: 'yL' | 'yR') => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p[key]}`).join(' ');

  return (
    <div ref={ref} className="w-full">
      <div className="mb-3 flex gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Revenue (USD)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Leads</span>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = h - pad.b - t * (h - pad.t - pad.b);
          return <line key={i} x1={pad.l} y1={y} x2={width - pad.r} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />;
        })}
        <path d={line('yR')} fill="none" stroke="#3b82f6" strokeWidth="2" />
        <path d={line('yL')} fill="none" stroke="#22c55e" strokeWidth="2" />
        {pts.filter((_, i) => i % 5 === 0).map((p, i) => (
          <text key={i} x={p.x} y={h - 6} fill="#94a3b8" fontSize="9" textAnchor="middle">{p.date}</text>
        ))}
      </svg>
    </div>
  );
};

interface FunnelItem { label: string; value: number; color: string }

export const PipelineFunnelChart: React.FC<{ data: FunnelItem[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-2">
      {data.map(item => {
        const pct = Math.round((item.value / total) * 100);
        const w = 35 + pct * 0.65;
        return (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-right text-xs text-slate-500">{item.label}</span>
            <div className="flex flex-1 items-center">
              <div
                className="flex h-8 items-center justify-end rounded-md px-2 text-xs font-semibold text-white"
                style={{ width: `${w}%`, minWidth: '45%', backgroundColor: item.color }}
              >
                {item.value} ({pct}%)
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface HBarItem { label: string; value: number; color?: string }

export const SourceBarChart: React.FC<{ data: HBarItem[] }> = ({ data }) => {
  if (!data.length) return <div className="py-8 text-center text-xs text-muted-foreground">No sources</div>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#06b6d4'];
  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: item.color || colors[i % colors.length] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
