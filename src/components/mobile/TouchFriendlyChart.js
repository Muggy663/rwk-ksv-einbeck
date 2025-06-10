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

/**
 * TouchFriendlyChart - Eine Wrapper-Komponente für Recharts-Diagramme mit verbesserten Touch-Interaktionen
 * 
 * @param {Object} props
 * @param {string} props.type - Diagrammtyp: 'line', 'bar', 'pie'
 * @param {Array} props.data - Daten für das Diagramm
 * @param {string} props.dataKey - Hauptdatenfeld für das Diagramm
 * @param {Array} props.colors - Farben für die Diagrammelemente
 * @param {Object} props.config - Zusätzliche Konfigurationsoptionen
 * @param {string} props.className - Zusätzliche CSS-Klassen
 */
export function TouchFriendlyChart({
  type = 'line',
  data = [],
  dataKey,
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'],
  config = {},
  className,
  ...props
}) {
  const chartRef = useRef(null);
  const [touchActive, setTouchActive] = useState(false);
  const [chartHeight, setChartHeight] = useState(400);

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
  const defaultConfig = {
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
      label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`
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
            />
            <Legend 
              wrapperStyle={mergedConfig.legendWrapperStyle} 
              iconSize={10}
              iconType="circle"
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
            />
            <Legend 
              wrapperStyle={mergedConfig.legendWrapperStyle} 
              iconSize={10}
              iconType="circle"
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
                dataKey={dataKey}
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
              dataKey={dataKey}
              label={mergedConfig.label}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              wrapperStyle={{ zIndex: 1000 }} 
              contentStyle={{ fontSize: 12 }}
            />
            <Legend 
              iconSize={10}
              iconType="circle"
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