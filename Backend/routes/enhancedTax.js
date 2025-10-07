import express from 'express';
import { protect } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { computeTax, validateTaxInput } from '../utils/enhancedTaxCalculator.js';

const router = express.Router();

// Note: Routes are public for tax calculations, no authentication required
// This allows anonymous users to use the tax calculator

// @desc    Enhanced tax calculation and comparison
// @route   POST /api/enhanced-tax/calculate
// @access  Public
router.post('/calculate', catchAsync(async (req, res, next) => {
  // Validate input
  const validationErrors = validateTaxInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: validationErrors
    });
  }

  // Compute tax
  const result = computeTax(req.body);

  res.status(200).json({
    success: true,
    data: result
  });
}));

// @desc    Compare tax regimes (old vs new)
// @route   POST /api/enhanced-tax/compare-regimes
// @access  Public
router.post('/compare-regimes', catchAsync(async (req, res, next) => {
  const { income = {}, deductions = {}, grossSalary } = req.body;

  // Support both nested (income.salary) and flat (grossSalary) formats
  const totalSalary = grossSalary || income.salary || 0;
  const totalIncome = totalSalary + (income.houseProperty || 0) + (income.business || 0) + (income.otherSources || 0);

  // Handle capital gains separately
  const capitalGainsList = [];
  if (income.capitalGains > 0) {
    capitalGainsList.push({
      type: 'ltcg',
      asset: 'equity',
      amount: income.capitalGains
    });
  }

  // Extract common deductions with support for both naming conventions
  const payload = {
    grossSalary: totalIncome,
    standardDeduction: deductions.standardDeduction || 50000, // Standard for FY 2024-25
    chapter6ADeductions: (deductions.section80c || 0) + (deductions.section80d || 0) + (deductions.other || 0),
    otherDeductions: deductions.section24b || deductions.homeLoanInterest || 0,
    employerNPS: deductions.employerNPS || 0,
    interestSavings: deductions.interestSavings || 0,
    interestFD: deductions.interestFD || 0,
    isSenior: deductions.isSenior || false,
    capitalGains: capitalGainsList,
    hasVDA: deductions.hasVDA || false
  };

  const result = computeTax(payload);

  // Simplified response for quick comparison
  res.status(200).json({
    success: true,
    data: {
      taxableIncome: {
        old: result.taxable.taxableOld,
        new: result.taxable.taxableNew
      },
      finalTax: {
        old: result.oldRegime.finalTaxPayable,
        new: result.newRegime.finalTaxPayable
      },
      savings: result.comparison.savings,
      recommended: result.comparison.recommended,
      savingsPercentage: result.comparison.savingsPercentage,
      rebateApplied: {
        old: result.oldRegime.rebate,
        new: result.newRegime.rebate,
        qualifiesOld: result.oldRegime.qualifiesForRebate,
        qualifiesNew: result.newRegime.qualifiesForRebate
      },
      itrForm: result.itrForm,
      rebateMessage: result.comparison.rebateMessage
    }
  });
}));

// @desc    Calculate tax from Form-16 data
// @route   POST /api/enhanced-tax/from-form16
// @access  Public
router.post('/from-form16', catchAsync(async (req, res, next) => {
  const { extractedData } = req.body;

  if (!extractedData) {
    return res.status(400).json({
      success: false,
      message: 'Extracted data is required'
    });
  }

  // Map Form-16 data to tax calculator format
  const payload = {
    grossSalary: extractedData.income?.salary || 0,
    standardDeduction: extractedData.income?.standardDeduction || 50000,
    chapter6ADeductions: extractedData.deductions?.total || 0,
    otherDeductions: 0,
    employerNPS: 0,
    interestSavings: 0,
    interestFD: 0,
    isSenior: false,
    capitalGains: [],
    hasVDA: false
  };

  const result = computeTax(payload);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Tax calculated from Form-16 data'
  });
}));

// @desc    Get tax optimization suggestions
// @route   POST /api/enhanced-tax/suggestions
// @access  Public
router.post('/suggestions', catchAsync(async (req, res, next) => {
  const { grossSalary, currentDeductions = {} } = req.body;

  const suggestions = [];

  // Section 80C suggestion
  const current80C = currentDeductions.section80c || 0;
  if (current80C < 150000) {
    const potential80C = Math.min(150000, grossSalary * 0.15); // Suggest up to 15% of salary
    const potentialSaving = (potential80C - current80C) * 0.30; // Assuming 30% tax bracket

    suggestions.push({
      section: '80C',
      title: 'Section 80C Investments',
      description: 'PPF, ELSS, Life Insurance, Home Loan Principal',
      currentAmount: current80C,
      suggestedAmount: potential80C,
      maxLimit: 150000,
      potentialSaving: Math.round(potentialSaving),
      instruments: ['PPF', 'ELSS Mutual Funds', 'Life Insurance Premium', 'Home Loan Principal', 'NSC', 'Tax Saving FD']
    });
  }

  // Section 80D suggestion
  const current80D = currentDeductions.section80d || 0;
  if (current80D < 25000) {
    const potential80D = 25000;
    const potentialSaving = (potential80D - current80D) * 0.30;

    suggestions.push({
      section: '80D',
      title: 'Health Insurance Premium',
      description: 'Medical insurance for self, family, and parents',
      currentAmount: current80D,
      suggestedAmount: potential80D,
      maxLimit: 25000,
      potentialSaving: Math.round(potentialSaving),
      instruments: ['Health Insurance Premium', 'Preventive Health Check-up']
    });
  }

  // NPS suggestion
  const currentNPS = currentDeductions.nps || 0;
  if (currentNPS < 50000) {
    const potentialNPS = 50000;
    const potentialSaving = (potentialNPS - currentNPS) * 0.30;

    suggestions.push({
      section: '80CCD(1B)',
      title: 'National Pension System',
      description: 'Additional NPS investment (over and above 80C limit)',
      currentAmount: currentNPS,
      suggestedAmount: potentialNPS,
      maxLimit: 50000,
      potentialSaving: Math.round(potentialSaving),
      instruments: ['NPS Contribution']
    });
  }

  res.status(200).json({
    success: true,
    data: {
      suggestions,
      totalPotentialSaving: suggestions.reduce((sum, s) => sum + s.potentialSaving, 0),
      message: suggestions.length > 0 
        ? `You can potentially save ₹${suggestions.reduce((sum, s) => sum + s.potentialSaving, 0).toLocaleString()} in taxes`
        : 'You are already maximizing your tax deductions!'
    }
  });
}));

export default router;