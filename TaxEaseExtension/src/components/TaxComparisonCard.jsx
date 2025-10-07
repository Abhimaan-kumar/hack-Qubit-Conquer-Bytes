import React from 'react';
import { motion } from 'framer-motion';

const TaxComparisonCard = ({ comparison, onRegimeSelect }) => {
  if (!comparison) {
    return null;
  }

  const { old_regime, new_regime, recommended_regime, savings } = comparison;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRecommendationColor = (regime) => {
    if (regime === recommended_regime) {
      return 'border-green-500 bg-green-50';
    }
    return 'border-gray-300 bg-white';
  };

  const getRecommendationBadge = (regime) => {
    if (regime === recommended_regime) {
      return (
        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
          ⭐ RECOMMENDED
        </span>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-4 mb-4 neumorphic"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800">
          💰 Tax Comparison
        </h3>
        <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
          Live Calculation
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Old Regime */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => onRegimeSelect?.('old')}
          className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${getRecommendationColor('old')}`}
        >
          {getRecommendationBadge('old')}
          
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Old Regime
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Gross Income</span>
              <span className="font-medium">{formatCurrency(old_regime?.gross_income || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deductions</span>
              <span className="font-medium text-green-600">-{formatCurrency(old_regime?.total_deductions || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Std. Deduction</span>
              <span className="font-medium text-green-600">-₹50,000</span>
            </div>
            <div className="border-t border-gray-200 pt-1 mt-1"></div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Taxable Income</span>
              <span className="font-semibold">{formatCurrency(old_regime?.taxable_income || 0)}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t-2 border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-800">Total Tax</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(old_regime?.tax || 0)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* New Regime */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => onRegimeSelect?.('new')}
          className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${getRecommendationColor('new')}`}
        >
          {getRecommendationBadge('new')}
          
          <div className="text-sm font-semibold text-gray-700 mb-2">
            New Regime
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Gross Income</span>
              <span className="font-medium">{formatCurrency(new_regime?.gross_income || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deductions</span>
              <span className="font-medium text-gray-400">₹0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Std. Deduction</span>
              <span className="font-medium text-green-600">-₹75,000</span>
            </div>
            <div className="border-t border-gray-200 pt-1 mt-1"></div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Taxable Income</span>
              <span className="font-semibold">{formatCurrency(new_regime?.taxable_income || 0)}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t-2 border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-800">Total Tax</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(new_regime?.tax || 0)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Savings Banner */}
      {savings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-3 text-center"
        >
          <div className="text-xs font-medium mb-1">💡 Potential Savings</div>
          <div className="text-2xl font-bold">{formatCurrency(savings)}</div>
          <div className="text-xs mt-1 opacity-90">
            by choosing {recommended_regime === 'old' ? 'Old' : 'New'} Regime
          </div>
        </motion.div>
      )}

      {/* Quick Info */}
      <div className="mt-3 text-xs text-gray-600 bg-blue-50 rounded-lg p-2">
        <div className="flex items-start space-x-2">
          <span>ℹ️</span>
          <div>
            <strong>Tip:</strong> Old regime allows deductions (80C, 80D, etc.) while New regime has lower tax rates but no deductions.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaxComparisonCard;
