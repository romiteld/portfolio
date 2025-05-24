'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartDataset,
  ChartType
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

interface StockChartProps {
  symbol?: string;
  data?: any;
  title?: string;
  height?: number;
  showVolume?: boolean;
  showVix?: boolean;
  comparisonData?: any;
  timeRange?: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y';
}

// Type for chart datasets that can handle multiple chart types
type ChartDatasetType = ChartDataset<ChartType, number[]>;

// Default sample data
const generateSampleData = (days = 30, trend: 'up' | 'down' | 'volatile' = 'volatile') => {
  const prices = [];
  const dates = [];
  const volumes = [];
  
  let price = 100 + Math.random() * 20;
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(now.getDate() - (days - i - 1));
    dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    // Generate different price patterns based on trend
    let volatility = 0;
    if (trend === 'up') {
      volatility = (Math.random() - 0.3) * 3; // Upward trend
    } else if (trend === 'down') {
      volatility = (Math.random() - 0.7) * 3; // Downward trend
    } else {
      volatility = (Math.random() - 0.5) * 5; // Volatile
    }
    
    price += volatility;
    price = Math.max(price, 50); // Ensure price doesn't go too low
    prices.push(price);
    
    // Generate realistic volume
    const volume = Math.floor((500000 + Math.random() * 1500000) * (1 + Math.abs(volatility) / 10));
    volumes.push(volume);
  }
  
  return { prices, dates, volumes };
};

const generateVixData = (days = 30) => {
  const vixValues = [];
  let vix = 15 + Math.random() * 10;
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 3;
    vix += change;
    vix = Math.max(vix, 9); // VIX typically doesn't go below 9
    vix = Math.min(vix, 50); // For sample data, cap at 50
    vixValues.push(vix);
  }
  
  return vixValues;
};

export default function StockChart({
  symbol = 'SAMPLE',
  data,
  title,
  height = 300,
  showVolume = false,
  showVix = false,
  comparisonData,
  timeRange = '1m'
}: StockChartProps) {
  const [chartData, setChartData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(timeRange);
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    setIsLoading(true);
      setError(null);
      
    // Create tooltip container for external tooltips
    if (typeof document !== 'undefined') {
      let tooltipEl = document.getElementById('chartjs-tooltip-stock');
      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip-stock';
        tooltipEl.style.background = 'rgba(0, 0, 0, 0.8)';
        tooltipEl.style.borderRadius = '3px';
        tooltipEl.style.color = 'white';
        tooltipEl.style.opacity = '0';
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.zIndex = '100';
        tooltipEl.style.transition = 'all .1s ease';
        tooltipEl.style.padding = '10px';
        tooltipEl.style.fontSize = '12px';
        tooltipEl.style.maxWidth = '250px';
        tooltipEl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.25)';
        document.body.appendChild(tooltipEl);
      }
    }
    
    // Clean up tooltip when component unmounts
    return () => {
      if (typeof document !== 'undefined') {
        const tooltipEl = document.getElementById('chartjs-tooltip-stock');
        if (tooltipEl) {
          tooltipEl.remove();
        }
      }
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // If real data is provided, use it
    if (data) {
      try {
        // Process the real data
        setChartData(data);
      } catch (err) {
        console.error("Error processing chart data:", err);
        setError("Failed to process chart data");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Generate sample data based on time range
      let days;
      switch (selectedTimeRange) {
        case '1d': days = 1; break;
        case '5d': days = 5; break;
        case '1m': days = 30; break;
        case '3m': days = 90; break;
        case '6m': days = 180; break; 
        case '1y': days = 365; break;
        case '5y': days = 365 * 5; break;
        default: days = 30;
      }
      
      // Generate sample data with different patterns
      const trend = symbol?.includes('DEMO-UP') ? 'up' : 
                    symbol?.includes('DEMO-DOWN') ? 'down' : 'volatile';
      
      const sampleData = generateSampleData(days, trend);
      const vixData = showVix ? generateVixData(days) : null;
      
      // Prepare data for Chart.js
      const formattedData: {
        labels: string[],
        datasets: ChartDatasetType[]
      } = {
        labels: sampleData.dates,
        datasets: [
          {
            type: 'line',
            label: symbol || 'Stock Price',
            data: sampleData.prices,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.2,
            pointRadius: days > 60 ? 0 : 2,
            pointHoverRadius: 5,
            borderWidth: 2,
            yAxisID: 'y'
          }
        ]
      };
      
      // Add volume if requested
      if (showVolume) {
        formattedData.datasets.push({
          type: 'bar',
          label: 'Volume',
          data: sampleData.volumes,
          backgroundColor: 'rgba(128, 128, 128, 0.3)',
          borderColor: 'rgba(128, 128, 128, 0.5)',
          borderWidth: 1,
          yAxisID: 'y1',
          order: 2
        });
      }
      
      // Add VIX data if requested
      if (showVix && vixData) {
        formattedData.datasets.push({
          type: 'line',
          label: 'VIX Index',
          data: vixData,
          borderColor: 'rgb(220, 53, 69)',
          backgroundColor: 'rgba(220, 53, 69, 0.05)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          yAxisID: 'y2',
          tension: 0.2
        });
      }
      
      // Add comparison data if provided
      if (comparisonData) {
        formattedData.datasets.push({
          type: 'line',
          label: comparisonData.symbol || 'Comparison',
          data: comparisonData.prices || sampleData.prices.map(p => p * (0.8 + Math.random() * 0.4)),
          borderColor: 'rgb(96, 165, 250)',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          yAxisID: 'y',
          tension: 0.1
        });
      }
      
      setChartData(formattedData);
      setIsLoading(false);
    }
  }, [symbol, data, showVolume, showVix, comparisonData, selectedTimeRange]);
  
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6
        }
      },
      tooltip: {
        enabled: false, // Disable built-in tooltips
        external: function(context) {
          // Tooltip Element
          const {chart, tooltip} = context;
          const tooltipEl = document.getElementById('chartjs-tooltip-stock');
          
          if (!tooltipEl) return;
          
          // Hide if no tooltip
          if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
          }
          
          // Set Text
          if (tooltip.body) {
            const titleLines = tooltip.title || [];
            const bodyLines = tooltip.body.map(b => b.lines);
            
            let innerHtml = '<div>';
            
            // Title
            innerHtml += '<div class="tooltip-title" style="font-weight:bold;margin-bottom:5px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:2px;">';
            titleLines.forEach(title => {
              innerHtml += title;
            });
            innerHtml += '</div>';
            
            // Body
            innerHtml += '<div class="tooltip-body">';
            
            // Properly format values based on dataset type
            tooltip.dataPoints.forEach((dataPoint, i) => {
              const colors = tooltip.labelColors[i];
              const style = `background:${colors.backgroundColor};border:2px solid ${colors.borderColor};display:inline-block;width:8px;height:8px;margin-right:6px;border-radius:50%`;
              
              // Get the dataset and value
              const dataset = chart.data.datasets[dataPoint.datasetIndex] as any;
              const value = dataPoint.raw;
              const label = dataset.label || '';
              
              // Format differently based on the axis
              let formattedValue = '';
              if (dataset.yAxisID === 'y1') {
                formattedValue = Number(value).toLocaleString();
              } else {
                formattedValue = `$${Number(value).toFixed(2)}`;
              }
              
              innerHtml += `<div style="display:flex;align-items:center;margin:3px 0;"><span style="${style}"></span><span>${label}: ${formattedValue}</span></div>`;
            });
            
            innerHtml += '</div>';
            innerHtml += '</div>';
            
            tooltipEl.innerHTML = innerHtml;
          }
          
          // Position tooltip completely above the chart canvas
          const position = chart.canvas.getBoundingClientRect();
          const chartTop = position.top + window.pageYOffset;
          const chartLeft = position.left + window.pageXOffset;
          
          tooltipEl.style.opacity = '1';
          tooltipEl.style.position = 'absolute';
          // Center the tooltip horizontally relative to the chart
          tooltipEl.style.left = chartLeft + chart.width / 2 - tooltipEl.offsetWidth / 2 + 'px';
          // Position the tooltip above the chart canvas, accounting for its height and adding padding
          tooltipEl.style.top = chartTop - tooltipEl.offsetHeight - 10 + 'px';
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
        },
        zoom: {
          wheel: { 
            enabled: true 
          },
          pinch: { 
            enabled: true 
          },
          mode: 'xy',
        },
        limits: {
          y: {min: 'original', max: 'original', minRange: 1}
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        position: 'left',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y1: showVolume ? {
        position: 'right',
        grid: {
          display: false,
        },
        ticks: {
          callback: function(value: any) {
            if (Number(value) >= 1000000) {
              return Number(value / 1000000).toFixed(1) + 'M';
            }
            if (Number(value) >= 1000) {
              return Number(value / 1000).toFixed(1) + 'K';
            }
            return value;
          }
        }
      } : undefined,
      y2: showVix ? {
        position: 'right',
        grid: {
          display: false,
        },
        min: 0,
        max: 50,
        title: {
          display: true,
          text: 'VIX'
        }
      } : undefined
    }
  };

  const timeRangeButtons = [
    { label: '1D', value: '1d' },
    { label: '1W', value: '5d' },
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' }
  ];

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const isPriceUp = chartData && 
    chartData.datasets[0].data[0] < chartData.datasets[0].data[chartData.datasets[0].data.length - 1];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-full h-full flex flex-col">
      <div className="flex flex-col h-full">
        <div className="mb-2">
          <h3 className="text-lg font-semibold truncate max-w-full">
            {title || (symbol ? `${symbol} Chart` : 'Market Chart')}
          </h3>
          
          {isPriceUp !== undefined && (
            <div className={`mt-1 mb-2 px-2 py-1 rounded inline-flex items-center gap-1 whitespace-nowrap w-fit ${
              isPriceUp 
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isPriceUp 
                ? <><TrendingUp size={14} /> Up</> 
                : <><TrendingDown size={14} /> Down</>}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end mb-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded mr-2">
              <button
                onClick={() => resetZoom()}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            
            <div className="flex gap-1 text-xs">
              {timeRangeButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setSelectedTimeRange(btn.value)}
                  className={`px-2 py-1 rounded ${
                    selectedTimeRange === btn.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                  aria-label={`Set time range to ${btn.label}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-grow relative" style={{ minHeight: `${height - 50}px` }}>
          {chartData && (
            <Line
              data={chartData}
              options={chartOptions}
              height={height - 50}
              ref={(ref) => {
                if (ref) {
                  // @ts-expect-error - React-ChartJS-2 typing issue
                  chartRef.current = ref;
                }
              }}
            />
          )}
        </div>
        
        <div className="mt-auto pt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Zoom: Use mouse wheel or pinch. Pan: Click and drag.
          </div>
        </div>
      </div>
    </div>
  );
} 