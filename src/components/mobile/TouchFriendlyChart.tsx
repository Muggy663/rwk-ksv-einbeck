"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import '@/styles/mobile/responsive-tables.css';

type ChartType = 'line' | 'bar' | 'pie';

interface ChartConfig {
  margin?: {
    top: number;
    right: number;
    left: number;
    bottom: number;
  };
  yAxisDomain?: [string | number, string | number];
  strokeWidth?: number;
  activeDot?: {
    r: number;
    strokeWidth: number;
  };
  legendWrapperStyle?: React.CSSProperties;
  barSize?: number;
  cx?: string;
  cy?: string;
  outerRadius?: number;
  labelLine?: boolean;
  label?: (props: any) => string;
  xAxisDataKey?: string;
  legendFormatter?: (value: string) => string;
  tooltipFormatter?: (value: any, name: string) => [any, string];
}

interface TouchFriendlyChartProps {
  type?: ChartType;
  data: any[];
  dataKey: string | string[];
  colors?: string[];
  config?: ChartConfig;
  className?: string;
}

export function TouchFriendlyChart({
  type = 'line',
  data = [],
  dataKey,
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'],
  config = {},
  className,
  ...props
}: TouchFriendlyChartProps & React.HTMLAttributes<HTMLDivElement>) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [touchActive, setTouchActive] = useState<boolean>(false);
  const [chartHeight, setChartHeight] = useState<number>(400);

  // Passe die Höhe des Diagramms an die Bildschirmgröße an
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setChartHeight(300);
      } else {
        setChartHeight(400);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Verbesserte Touch-Interaktionen
  const handleTouchStart = () => setTouchActive(true);
  const handleTouchEnd = () => setTouchActive(false);

  // Standardkonfiguration für verschiedene Diagrammtypen
  const defaultConfig: Record<ChartType, ChartConfig> = {
    line: {
      margin: { top: 10, right: 30, left: 0, bottom: 10 },
      yAxisDomain: ['dataMin - 5', 'dataMax + 5'],
      strokeWidth: 2,
      activeDot: { r: 6, strokeWidth: 1 },
      legendWrapperStyle: { paddingTop: 10 }
    },
    bar: {
      margin: { top: 10, right: 30, left: 0, bottom: 10 },
      yAxisDomain: ['dataMin - 5', 'dataMax + 5'],
      barSize: 20,
      legendWrapperStyle: { paddingTop: 10 }
    },
    pie: {
      cx: "50%",
      cy: "50%",
      outerRadius: 100,
      labelLine: false,
      label: ({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`
    }
  };

  // Kombiniere Standard- und benutzerdefinierte Konfiguration
  const mergedConfig = {
    ...defaultConfig[type],
    ...config
  };

  // Rendere das entsprechende Diagramm basierend auf dem Typ
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            margin={mergedConfig.margin}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={config.xAxisDataKey || 'name'} 
              tick={{ fontSize: 12 }}
              height={30}
            />
            <YAxis 
              domain={mergedConfig.yAxisDomain} 
              tick={{ fontSize: 12 }}
              width={40}
            />
            <Tooltip 
              wrapperStyle={{ zIndex: 1000 }} 
              contentStyle={{ fontSize: 12 }}
              formatter={config.tooltipFormatter}
            />
            <Legend 
              wrapperStyle={mergedConfig.legendWrapperStyle} 
              iconSize={10}
              iconType="circle"
              formatter={config.legendFormatter}
            />
            {Array.isArray(dataKey) ? (
              dataKey.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={mergedConfig.strokeWidth}
                  activeDot={mergedConfig.activeDot}
                  connectNulls
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={mergedConfig.strokeWidth}
                activeDot={mergedConfig.activeDot}
                connectNulls
              />
            )}
          </LineChart>
        );
      
      case 'bar':
        return (
          <BarChart
            data={data}
            margin={mergedConfig.margin}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={config.xAxisDataKey || 'name'} 
              tick={{ fontSize: 12 }}
              height={30}
            />
            <YAxis 
              domain={mergedConfig.yAxisDomain} 
              tick={{ fontSize: 12 }}
              width={40}
            />
            <Tooltip 
              wrapperStyle={{ zIndex: 1000 }} 
              contentStyle={{ fontSize: 12 }}
              formatter={config.tooltipFormatter}
            />
            <Legend 
              wrapperStyle={mergedConfig.legendWrapperStyle} 
              iconSize={10}
              iconType="circle"
              formatter={config.legendFormatter}
            />
            {Array.isArray(dataKey) ? (
              dataKey.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  barSize={mergedConfig.barSize}
                />
              ))
            ) : (
              <Bar
                dataKey={dataKey as string}
                fill={colors[0]}
                barSize={mergedConfig.barSize}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            )}
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx={mergedConfig.cx}
              cy={mergedConfig.cy}
              labelLine={mergedConfig.labelLine}
              outerRadius={mergedConfig.outerRadius}
              fill="#8884d8"
              dataKey={dataKey as string}
              label={mergedConfig.label}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              wrapperStyle={{ zIndex: 1000 }} 
              contentStyle={{ fontSize: 12 }}
              formatter={config.tooltipFormatter}
            />
            <Legend 
              iconSize={10}
              iconType="circle"
              formatter={config.legendFormatter}
            />
          </PieChart>
        );
      
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div 
      ref={chartRef}
      className={cn(
        'touch-friendly-chart',
        touchActive && 'touch-active',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
