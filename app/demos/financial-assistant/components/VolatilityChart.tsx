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
import { TrendingUp, TrendingDown, AlertCircle, RotateCcw, AlertTriangle, Activity } from 'lucide-react';

// Register ChartJS components if not already registered
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

interface VolatilityChartProps {
  symbol?: string; 
  data?: any;
  title?: string;
  height?: number;
  showHistoricalVol?: boolean;
  showImpliedVol?: boolean;
  showVix?: boolean;
  timeRange?: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y';
}

// Type for chart datasets
type ChartDatasetType = ChartDataset<ChartType, number[]>;

// Helper function to calculate bollinger bands (volatility indicator)
const calculateBollingerBands = (data: number[], period: number = 20, multiplier: number = 2) => {
  const result = {
    middle: [] as number[],
    upper: [] as number[],
    lower: [] as number[],
  };

  // We need at least period number of data points
  if (data.length < period) {
    return result;
  }

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      // Not enough data points yet
      result.middle.push(0);
      result.upper.push(0);
      result.lower.push(0);
      continue;
    }

    // Calculate SMA for this period
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    const sma = sum / period;
    result.middle.push(sma);

    // Calculate standard deviation
    let sumSquaredDiff = 0;
    for (let j = 0; j < period; j++) {
      sumSquaredDiff += Math.pow(data[i - j] - sma, 2);
    }
    const stdDev = Math.sqrt(sumSquaredDiff / period);

    // Calculate upper and lower bands
    result.upper.push(sma + (multiplier * stdDev));
    result.lower.push(sma - (multiplier * stdDev));
  }

  return result;
};

// Generate sample volatility data
const generateVolatilityData = (days = 30, baseVol = 20) => {
  const dates = [];
  const prices = [];
  const impliedVol = [];
  const historicalVol = [];
  const vix = [];
  
  let price = 100 + Math.random() * 20;
  let iv = baseVol + Math.random() * 5;
  let hv = baseVol - 2 + Math.random() * 5;
  let vixValue = baseVol + Math.random() * 8;
  
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(now.getDate() - (days - i - 1));
    dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    // Generate price with some correlation to volatility
    const priceChange = (Math.random() - 0.5) * (hv / 10);
    price += priceChange;
    price = Math.max(price, 50);
    prices.push(price);
    
    // Generate implied volatility (IV) - tends to rise when prices fall
    const ivChange = (Math.random() - 0.5) * 1.5 + (priceChange < 0 ? 0.3 : -0.1);
    iv += ivChange;
    iv = Math.max(iv, 10);
    iv = Math.min(iv, 45);
    impliedVol.push(iv);
    
    // Generate historical volatility (HV) - more stable than IV
    const hvChange = (Math.random() - 0.5) * 0.8;
    hv += hvChange;
    hv = Math.max(hv, 5);
    hv = Math.min(hv, 40);
    historicalVol.push(hv);
    
    // Generate VIX data with correlation to IV but more pronounced moves
    const vixChange = (Math.random() - 0.5) * 2 + (ivChange * 1.5);
    vixValue += vixChange;
    vixValue = Math.max(vixValue, 9);
    vixValue = Math.min(vixValue, 45);
    vix.push(vixValue);
  }
  
  // Calculate Bollinger Bands
  const bands = calculateBollingerBands(prices);
  
  return { dates, prices, impliedVol, historicalVol, vix, bands };
};

export default function VolatilityChart({
  symbol = 'SAMPLE',
  data,
  title,
  height = 350,
  showHistoricalVol = true,
  showImpliedVol = true,
  showVix = false,
  timeRange = '3m'
}: VolatilityChartProps) {
  const [chartData, setChartData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(timeRange);
  const [volatilityRegime, setVolatilityRegime] = useState<'low' | 'normal' | 'high' | 'extreme'>('normal');
  const chartRef = useRef<ChartJS>(null);
  
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Create tooltip container for external tooltips
    if (typeof document !== 'undefined') {
      let tooltipEl = document.getElementById('chartjs-tooltip');
      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip';
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
        const tooltipEl = document.getElementById('chartjs-tooltip');
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
        console.error("Error processing volatility data:", err);
        setError("Failed to process volatility data");
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
        case '1y': days = 252; break; // Trading days in a year
        case '5y': days = 252 * 5; break;
        default: days = 90;
      }
      
      // Generate volatility data with base volatility dependent on the symbol
      let baseVol = 20; // Default
      if (symbol?.includes('LOW-VOL')) {
        baseVol = 10;
        setVolatilityRegime('low');
      } else if (symbol?.includes('HIGH-VOL')) {
        baseVol = 30;
        setVolatilityRegime('high');
      } else if (symbol?.includes('EXTREME-VOL')) {
        baseVol = 40;
        setVolatilityRegime('extreme');
      } else {
        setVolatilityRegime('normal');
      }
      
      const volData = generateVolatilityData(days, baseVol);
      
      // Prepare data for Chart.js
      const formattedData: {
        labels: string[],
        datasets: ChartDatasetType[]
      } = {
        labels: volData.dates,
        datasets: [
          {
            type: 'line',
            label: `${symbol} Price`,
            data: volData.prices,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.2,
            pointRadius: days > 60 ? 0 : 2,
            pointHoverRadius: 5,
            borderWidth: 2,
            yAxisID: 'y',
            order: 1
          }
        ]
      };
      
      // Add Bollinger Bands
      if (volData.bands.middle.length > 0) {
        formattedData.datasets.push({
          type: 'line',
          label: 'Upper Band (2σ)',
          data: volData.bands.upper,
          borderColor: 'rgba(156, 163, 175, 0.6)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.4,
          yAxisID: 'y',
          order: 3
        });
        
        formattedData.datasets.push({
          type: 'line',
          label: 'Lower Band (2σ)',
          data: volData.bands.lower,
          borderColor: 'rgba(156, 163, 175, 0.6)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.4,
          yAxisID: 'y',
          order: 3
        });
      }
      
      // Add Implied Volatility if requested
      if (showImpliedVol) {
        formattedData.datasets.push({
          type: 'line',
          label: 'Implied Volatility (%)',
          data: volData.impliedVol,
          borderColor: 'rgb(146, 64, 213)',
          backgroundColor: 'rgba(146, 64, 213, 0.05)',
          borderWidth: 2,
          pointRadius: days > 60 ? 0 : 2,
          tension: 0.2,
          yAxisID: 'y1',
          order: 2
        });
      }
      
      // Add Historical Volatility if requested
      if (showHistoricalVol) {
        formattedData.datasets.push({
          type: 'line',
          label: 'Historical Volatility (%)',
          data: volData.historicalVol,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          borderWidth: 2,
          pointRadius: days > 60 ? 0 : 2,
          tension: 0.2,
          yAxisID: 'y1',
          order: 2
        });
      }
      
      // Add VIX data if requested
      if (showVix) {
        formattedData.datasets.push({
          type: 'line',
          label: 'VIX Index',
          data: volData.vix,
          borderColor: 'rgb(220, 53, 69)',
          backgroundColor: 'rgba(220, 53, 69, 0.05)',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          yAxisID: 'y1',
          tension: 0.2,
          order: 2
        });
      }
      
      setChartData(formattedData);
      setIsLoading(false);
    }
  }, [symbol, data, showHistoricalVol, showImpliedVol, showVix, selectedTimeRange]);
  
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
          const tooltipEl = document.getElementById('chartjs-tooltip');
          
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
              if (dataset.yAxisID === 'y') {
                formattedValue = `$${Number(value).toFixed(2)}`;
              } else if (dataset.yAxisID === 'y1') {
                formattedValue = `${Number(value).toFixed(1)}%`;
              } else {
                formattedValue = `${Number(value).toFixed(2)}`;
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
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Price ($)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y1: (showHistoricalVol || showImpliedVol || showVix) ? {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Volatility (%)'
        },
        min: 0,
        max: volatilityRegime === 'extreme' ? 60 : 
             volatilityRegime === 'high' ? 40 : 
             volatilityRegime === 'low' ? 20 : 30,
        grid: {
          drawOnChartArea: false,
        }
      } : undefined
    }
  };

  const timeRangeButtons = [
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' }
  ];

  const volatilityOptions = [
    { label: 'Historical', value: 'historical', checked: showHistoricalVol },
    { label: 'Implied', value: 'implied', checked: showImpliedVol },
    { label: 'VIX', value: 'vix', checked: showVix }
  ];

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  const toggleVolatility = (type: 'historical' | 'implied' | 'vix') => {
    switch (type) {
      case 'historical':
        return { showHistoricalVol: !showHistoricalVol, showImpliedVol, showVix };
      case 'implied':
        return { showHistoricalVol, showImpliedVol: !showImpliedVol, showVix };
      case 'vix':
        return { showHistoricalVol, showImpliedVol, showVix: !showVix };
    }
  };

  if (isLoading) {
    return (
      <div className="h-[350px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading volatility data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[350px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-full h-full flex flex-col">
      <div className="flex flex-col h-full">
        {title && (
          <div className="mb-2">
            <h3 className="text-lg font-semibold truncate max-w-full">
              {title}
            </h3>
            
            <div className={`mt-1 mb-2 px-2 py-1 rounded inline-flex items-center gap-1 whitespace-nowrap w-fit
              ${volatilityRegime === 'low' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
                volatilityRegime === 'normal' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                volatilityRegime === 'high' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
              <Activity size={14} />
              {volatilityRegime.charAt(0).toUpperCase() + volatilityRegime.slice(1)} Volatility
            </div>
          </div>
        )}
        
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
        
        {title && (
          <div className="flex items-center justify-start gap-4 text-sm mb-2 flex-wrap">
            {volatilityOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={option.checked}
                  onChange={() => {
                    const newProps = toggleVolatility(option.value as any);
                    // @ts-ignore
                    setChartData((prev) => ({...prev})); // Force rerender
                  }}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                {option.label} Volatility
              </label>
            ))}
          </div>
        )}
        
        <div className="flex-grow relative" style={{ minHeight: `${height - 100}px` }}>
          {chartData && (
            <Line
              data={chartData}
              options={chartOptions}
              height={height - 100}
              ref={(ref) => {
                if (ref) {
                  // @ts-ignore - React-ChartJS-2 typing issue
                  chartRef.current = ref;
                }
              }}
            />
          )}
        </div>
        
        <div className="mt-auto pt-2">
          <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="mr-2">Zoom: Use mouse wheel or pinch. Pan: Click and drag.</div>
            <div className="text-right">
              <div>Bollinger Bands: Price ±2 standard deviations</div>
              <div>Wider bands indicate higher volatility</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 