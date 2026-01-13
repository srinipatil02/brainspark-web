// =============================================================================
// CHART RENDERER COMPONENT
// =============================================================================
// FILE: src/components/shared/ChartRenderer.tsx
// DOMAIN: Shared infrastructure
// PURPOSE: Render data visualizations using Recharts
// USED BY: QuestionVisual for chart-based questions

'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartConfig } from '@/types';

interface ChartRendererProps {
  config: ChartConfig;
  width?: number;
  height?: number;
  className?: string;
}

// Default color palette
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/**
 * ChartRenderer - Renders data visualizations using Recharts
 *
 * Supports:
 * - Bar charts
 * - Line charts
 * - Pie charts
 * - Scatter plots
 * - Area charts
 */
export function ChartRenderer({
  config,
  width = 400,
  height = 300,
  className = '',
}: ChartRendererProps) {
  const { type, data, options } = config;

  // Transform data for Recharts format
  const chartData = data.labels?.map((label, index) => {
    const dataPoint: Record<string, string | number> = { name: label };
    data.datasets.forEach((dataset, datasetIndex) => {
      dataPoint[dataset.label || `series${datasetIndex}`] = dataset.data[index];
    });
    return dataPoint;
  }) || data.datasets[0]?.data.map((value, index) => ({
    name: `Item ${index + 1}`,
    value,
  }));

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            {options?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey="name"
              label={options?.xAxisLabel ? { value: options.xAxisLabel, position: 'bottom' } : undefined}
            />
            <YAxis
              label={options?.yAxisLabel ? { value: options.yAxisLabel, angle: -90, position: 'left' } : undefined}
            />
            <Tooltip />
            {options?.showLegend !== false && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Bar
                key={index}
                dataKey={dataset.label || `series${index}`}
                fill={Array.isArray(dataset.backgroundColor)
                  ? undefined
                  : (dataset.backgroundColor as string) || COLORS[index % COLORS.length]}
              >
                {Array.isArray(dataset.backgroundColor) &&
                  chartData.map((_, cellIndex) => (
                    <Cell
                      key={`cell-${cellIndex}`}
                      fill={(dataset.backgroundColor as string[])[cellIndex] || COLORS[cellIndex % COLORS.length]}
                    />
                  ))}
              </Bar>
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={chartData}>
            {options?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey="name"
              label={options?.xAxisLabel ? { value: options.xAxisLabel, position: 'bottom' } : undefined}
            />
            <YAxis
              label={options?.yAxisLabel ? { value: options.yAxisLabel, angle: -90, position: 'left' } : undefined}
            />
            <Tooltip />
            {options?.showLegend !== false && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={dataset.label || `series${index}`}
                stroke={dataset.borderColor || COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: dataset.borderColor || COLORS[index % COLORS.length] }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData}>
            {options?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey="name"
              label={options?.xAxisLabel ? { value: options.xAxisLabel, position: 'bottom' } : undefined}
            />
            <YAxis
              label={options?.yAxisLabel ? { value: options.yAxisLabel, angle: -90, position: 'left' } : undefined}
            />
            <Tooltip />
            {options?.showLegend !== false && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Area
                key={index}
                type="monotone"
                dataKey={dataset.label || `series${index}`}
                stroke={dataset.borderColor || COLORS[index % COLORS.length]}
                fill={(dataset.backgroundColor as string) || COLORS[index % COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        const pieData = chartData.map((item, index) => ({
          name: item.name,
          value: data.datasets[0]?.data[index] || 0,
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={Math.min(width, height) / 3}
              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    Array.isArray(data.datasets[0]?.backgroundColor)
                      ? (data.datasets[0].backgroundColor as string[])[index]
                      : COLORS[index % COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip />
            {options?.showLegend !== false && <Legend />}
          </PieChart>
        );

      case 'scatter':
        // For scatter, assume data is in {x, y} format
        const scatterData = data.datasets[0]?.data.map((y, index) => ({
          x: index,
          y,
        }));
        return (
          <ScatterChart>
            {options?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey="x"
              type="number"
              label={options?.xAxisLabel ? { value: options.xAxisLabel, position: 'bottom' } : undefined}
            />
            <YAxis
              dataKey="y"
              type="number"
              label={options?.yAxisLabel ? { value: options.yAxisLabel, angle: -90, position: 'left' } : undefined}
            />
            <Tooltip />
            <Scatter
              data={scatterData}
              fill={data.datasets[0]?.backgroundColor as string || COLORS[0]}
            />
          </ScatterChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Unsupported chart type: {type}
          </div>
        );
    }
  };

  return (
    <div className={`chart-renderer ${className}`}>
      {options?.title && (
        <h4 className="text-center text-sm font-medium text-gray-700 mb-2">
          {options.title}
        </h4>
      )}
      <ResponsiveContainer width={width} height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

export default ChartRenderer;
