import React, { useState, useRef, useEffect } from 'react';

// Interfaces
interface LineChartData {
  date: string;
  count: number;
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
    return <div className="empty-state">No timeline data available</div>;
  }

  // Calculate scales
  const maxVal = Math.max(...data.map(d => d.count), 5); // default at least 5 max
  const minVal = 0;
  
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
    const y = height - padding.bottom - ((d.count - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
    return { x, y, ...d };
  });

  // Build path
  let pathD = '';
  let areaD = '';
  
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    areaD = `M ${points[0].x} ${height - padding.bottom}`;
    
    for (let i = 1; i < points.length; i++) {
      // Draw straight line for simplicity and accuracy
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // Complete area path
    areaD += pathD.substring(1);
    areaD += ` L ${points[points.length - 1].x} ${height - padding.bottom} Z`;
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
    
    // Find closest point
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
      y: points[closestIdx].y - 40
    });
  };

  return (
    <div ref={containerRef} className="chart-container">
      {hoverIndex !== null && points[hoverIndex] && (
        <div 
          className="chart-tooltip"
          style={{
            opacity: 1,
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translateX(-50%)',
            transition: 'left 0.1s ease, top 0.1s ease'
          }}
        >
          <strong>{points[hoverIndex].count} Leads</strong>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{points[hoverIndex].date}</div>
        </div>
      )}

      <svg 
        className="svg-chart" 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
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
              fill="var(--text-muted)" 
              fontSize="10" 
              textAnchor="end"
            >
              {line.val}
            </text>
          </g>
        ))}

        {/* X Axis labels (every 2-3 dates to avoid overcrowding) */}
        {points.map((p, idx) => {
          if (idx % (data.length > 10 ? 3 : 2) !== 0) return null;
          return (
            <text
              key={idx}
              x={p.x}
              y={height - 10}
              fill="var(--text-muted)"
              fontSize="10"
              textAnchor="middle"
            >
              {p.date}
            </text>
          );
        })}

        {/* Shaded Area */}
        {areaD && (
          <path d={areaD} fill="url(#chartGlow)" />
        )}

        {/* Main line */}
        {pathD && (
          <path 
            d={pathD} 
            fill="none" 
            stroke="var(--primary)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {/* Points */}
        {points.map((p, idx) => (
          <circle 
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === idx ? 6 : 3}
            fill={hoverIndex === idx ? 'var(--primary)' : 'var(--background)'}
            stroke="var(--primary)"
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'r 0.1s ease' }}
          />
        ))}
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
    return <div className="empty-state">No status data available</div>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = 180;
  const radius = 65;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Base circle background */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.02)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
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
                strokeLinecap="round"
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
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Leads</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px 24px', 
        width: '100%', 
        padding: '0 16px',
        boxSizing: 'border-box' 
      }}>
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-left">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground flex-1 truncate">{item.label}</span>
            <span className="font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
