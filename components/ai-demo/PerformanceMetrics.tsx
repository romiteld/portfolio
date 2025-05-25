'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, Zap } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
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
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceMetricsProps {
  data: Array<{
    mode: string;
    provider: string;
    time: number;
    timestamp: Date;
  }>;
}

export function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  // Prepare chart data
  const chartData = {
    labels: data.map((_, i) => `Request ${i + 1}`),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: data.map(d => d.time),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(147, 51, 234, 0.5)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)'
        }
      }
    }
  };

  // Calculate stats
  const avgTime = data.reduce((sum, d) => sum + d.time, 0) / data.length;
  const minTime = Math.min(...data.map(d => d.time));
  const maxTime = Math.max(...data.map(d => d.time));

  // Provider performance
  const providerStats = data.reduce((acc, d) => {
    if (!acc[d.provider]) {
      acc[d.provider] = { count: 0, totalTime: 0 };
    }
    acc[d.provider].count++;
    acc[d.provider].totalTime += d.time;
    return acc;
  }, {} as Record<string, { count: number; totalTime: number }>);

  const providerData = {
    labels: Object.keys(providerStats),
    datasets: [
      {
        label: 'Avg Response Time',
        data: Object.values(providerStats).map(s => s.totalTime / s.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(147, 51, 234)'
        ],
        borderWidth: 2
      }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-6"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
        <h3 className="text-lg sm:text-xl font-bold text-white">Performance Metrics</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-400 text-xs sm:text-sm">Average Time</span>
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{avgTime.toFixed(0)}ms</div>
          <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">Per request</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-400 text-xs sm:text-sm">Fastest</span>
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{minTime}ms</div>
          <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">Best performance</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-400 text-xs sm:text-sm">Total Requests</span>
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{data.length}</div>
          <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">Processed</div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/30 rounded-xl p-3 sm:p-4 border border-gray-700"
        >
          <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Response Time Trend</h4>
          <div className="h-40 sm:h-48">
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/30 rounded-xl p-3 sm:p-4 border border-gray-700"
        >
          <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Provider Performance</h4>
          <div className="h-40 sm:h-48">
            <Bar data={providerData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Performance tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/30"
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-white font-semibold mb-1 text-sm sm:text-base">Performance Tip</h5>
            <p className="text-gray-300 text-xs sm:text-sm">
              {avgTime < 1000 
                ? "Excellent performance! Response times are optimal."
                : avgTime < 2000
                ? "Good performance. Consider caching for frequently accessed content."
                : "Response times could be improved. Try using smaller images or simpler prompts."}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}