'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface CostTrackerProps {
  totalCost: number;
}

export function CostTracker({ totalCost }: CostTrackerProps) {
  const budget = 1.00; // $1 demo budget
  const percentage = (totalCost / budget) * 100;
  const remaining = Math.max(budget - totalCost, 0);

  const getStatusColor = () => {
    if (percentage < 50) return 'from-green-500 to-emerald-500';
    if (percentage < 80) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getStatusText = () => {
    if (percentage < 50) return 'Healthy budget';
    if (percentage < 80) return 'Monitor usage';
    return 'Budget warning';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${getStatusColor()}`}>
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Cost Tracker</h3>
        </div>
        {percentage > 80 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Used</span>
          <span className="text-white font-semibold">${totalCost.toFixed(4)}</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${getStatusColor()} relative`}
          >
            {/* Animated shimmer effect */}
            <motion.div
              animate={{ x: ['0%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </motion.div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500">{percentage.toFixed(1)}% of budget</span>
          <span className="text-gray-500">${budget.toFixed(2)} total</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Remaining</span>
          </div>
          <div className="text-lg font-semibold text-white">${remaining.toFixed(4)}</div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getStatusColor()}`} />
            <span className="text-xs text-gray-400">Status</span>
          </div>
          <div className="text-lg font-semibold text-white">{getStatusText()}</div>
        </div>
      </div>

      {/* Cost breakdown */}
      {totalCost > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-gray-700"
        >
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Costs</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Vision Analysis</span>
              <span className="text-gray-400">~$0.0010</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Object Detection</span>
              <span className="text-gray-400">~$0.0015</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Image Generation</span>
              <span className="text-gray-400">~$0.0200</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}