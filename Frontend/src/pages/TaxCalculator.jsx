import React, { useState } from 'react'
import { Calculator, Info, TrendingUp, TrendingDown, HelpCircle, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { translations } from '../data/translations'
import { compareTaxRegimes, formatCurrency, validatePAN } from '../utils/taxCalculations'
import apiClient from '../utils/api'
import CalculatorGuide from '../components/CalculatorGuide'

const taxFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  pan: z.string().refine(validatePAN, 'Invalid PAN format'),
  grossSalary: z.coerce.number().min(0, 'Salary must be positive'),
  section80C: z.coerce.number().min(0).max(150000, 'Max limit is ₹1,50,000'),
  section80D: z.coerce.number().min(0).max(25000, 'Max limit is ₹25,000'),
  homeLoanInterest: z.coerce.number().min(0).max(200000, 'Max limit is ₹2,00,000'),
  otherDeductions: z.coerce.number().min(0, 'Must be positive'),
})

const TaxCalculator = ({ language }) => {
  const t = translations[language]
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      name: '',
      pan: '',
      grossSalary: 0,
      section80C: 0,
      section80D: 0,
      homeLoanInterest: 0,
      otherDeductions: 0,
    }
  })
  
  // Load sample data
  const loadSampleData = () => {
    setValue('name', 'Sample User')
    setValue('pan', 'ABCDE1234F')
    setValue('grossSalary', 800000)
    setValue('section80C', 150000)
    setValue('section80D', 25000)
    setValue('homeLoanInterest', 0)
    setValue('otherDeductions', 0)
    toast.success('Sample data loaded! Click Calculate to see results')
  }
  

  
  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      const deductions = {
        section80C: data.section80C,
        section80D: data.section80D,
        homeLoanInterest: data.homeLoanInterest,
        otherDeductions: data.otherDeductions,
      }
      
      // Prepare payload for API calls
      const payload = {
        income: {
          salary: data.grossSalary,
          houseProperty: 0,
          business: 0,
          capitalGains: 0,
          otherSources: 0
        },
        deductions: {
          section80c: data.section80C,
          section80d: data.section80D,
          section24b: data.homeLoanInterest,
          hra: 0,
          lta: 0,
          standardDeduction: 50000,
          other: data.otherDeductions
        },
        taxPaid: {
          tds: 0,
          advanceTax: 0,
          selfAssessment: 0
        },
        financialYear: 'FY2024-25'
      }

      // Try enhanced API first
      try {
        const enhancedRes = await apiClient.compareEnhancedRegimes(payload)
        if (enhancedRes?.success && enhancedRes?.data) {
          const r = enhancedRes.data
          setResults({
            recommended: r.recommendedRegime,
            savings: r.savings,
            savingsPercentage: ((r.savings / Math.max(r.oldRegime.totalTax, r.newRegime.totalTax)) * 100).toFixed(2),
            rebateMessage: r.rebateMessage,
            oldRegime: {
              taxableIncome: r.oldRegime.taxableIncome,
              tax: r.oldRegime.tax,
              cess: r.oldRegime.cess,
              totalTax: r.oldRegime.totalTax
            },
            newRegime: {
              taxableIncome: r.newRegime.taxableIncome,
              tax: r.newRegime.tax,
              cess: r.newRegime.cess,
              totalTax: r.newRegime.totalTax,
              totalTaxBeforeRebate: r.newRegime.totalTaxBeforeRebate,
              rebate87A: r.newRegime.rebate87A,
              qualifiesForRebate: r.newRegime.qualifiesForRebate
            }
          })
          toast.success('Tax calculation completed with enhanced engine!')
          return
        }
      } catch (enhancedError) {
        console.warn('Enhanced API failed, trying fallback:', enhancedError)
      }

      // Fallback to existing API if authenticated
      if (apiClient.token) {
        try {
          const res = await apiClient.compareTaxRegimes(payload)
          const r = res?.data
          if (r) {
            setResults({
              recommended: r.recommendedRegime,
              savings: r.savings,
              savingsPercentage: r.oldRegime.taxableIncome > 0 ? ((r.oldRegime.totalTax - r.newRegime.totalTax) / (r.oldRegime.totalTax || 1) * 100).toFixed(2) : 0,
              oldRegime: {
                taxableIncome: r.oldRegime.taxableIncome,
                tax: r.oldRegime.totalTax - (r.oldRegime.totalTax * 0.04),
                cess: r.oldRegime.totalTax * 0.04,
                totalTax: r.oldRegime.totalTax
              },
              newRegime: {
                taxableIncome: r.newRegime.taxableIncome,
                tax: r.newRegime.totalTax - (r.newRegime.totalTax * 0.04),
                cess: r.newRegime.totalTax * 0.04,
                totalTax: r.newRegime.totalTax
              }
            })
            toast.success('Tax calculation completed!')
            return
          }
        } catch (apiError) {
          console.warn('API calculation failed, using local:', apiError)
        }
      }

      // Final fallback to local calculation
      const comparison = compareTaxRegimes(data.grossSalary, deductions)
      setResults(comparison)
      toast.success('Tax calculation completed locally!')
      
    } catch (error) {
      toast.error('Error calculating tax')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    reset()
    setResults(null)
    toast.success('Form reset successfully')
  }
  
  const InfoTooltip = ({ text }) => (
    <div className="group relative inline-block ml-1">
      <Info className="h-4 w-4 text-gray-400 cursor-help" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  )
  
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <Calculator className="h-10 w-10 text-blue-600 mr-3" />
          {t.calculator}
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Calculate your income tax for both old and new regimes
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <HelpCircle className="h-5 w-5 mr-2" />
            How to Use This Calculator
          </button>
          <button
            onClick={loadSampleData}
            className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Zap className="h-5 w-5 mr-2" />
            Try with Sample Data
          </button>
        </div>
      </div>
      
      {showGuide && <CalculatorGuide onClose={() => setShowGuide(false)} language={language} />}
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Enter Your Details
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                {t.personalInfo}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.name} *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.pan} *
                  <InfoTooltip text="Format: ABCDE1234F" />
                </label>
                <input
                  type="text"
                  {...register('pan')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                {errors.pan && (
                  <p className="text-red-500 text-sm mt-1">{errors.pan.message}</p>
                )}
              </div>
            </div>
            
            {/* Income Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                {t.incomeDetails}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.grossSalary} (₹) *
                  <InfoTooltip text="Total salary before any deductions" />
                </label>
                <input
                  type="number"
                  {...register('grossSalary')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="600000"
                />
                {errors.grossSalary && (
                  <p className="text-red-500 text-sm mt-1">{errors.grossSalary.message}</p>
                )}
              </div>
            </div>
            
            {/* Deductions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                {t.deductionsSection}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.section80C} (₹)
                  <InfoTooltip text="PPF, ELSS, Life Insurance, etc. Max: ₹1,50,000" />
                </label>
                <input
                  type="number"
                  {...register('section80C')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  max={150000}
                />
                {errors.section80C && (
                  <p className="text-red-500 text-sm mt-1">{errors.section80C.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.section80D} (₹)
                  <InfoTooltip text="Health Insurance Premium. Max: ₹25,000" />
                </label>
                <input
                  type="number"
                  {...register('section80D')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  max={25000}
                />
                {errors.section80D && (
                  <p className="text-red-500 text-sm mt-1">{errors.section80D.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.homeLoanInterest} (₹)
                  <InfoTooltip text="Home Loan Interest under Section 24(b). Max: ₹2,00,000" />
                </label>
                <input
                  type="number"
                  {...register('homeLoanInterest')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  max={200000}
                />
                {errors.homeLoanInterest && (
                  <p className="text-red-500 text-sm mt-1">{errors.homeLoanInterest.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Deductions (₹)
                  <InfoTooltip text="Other applicable deductions" />
                </label>
                <input
                  type="number"
                  {...register('otherDeductions')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                {errors.otherDeductions && (
                  <p className="text-red-500 text-sm mt-1">{errors.otherDeductions.message}</p>
                )}
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Calculating...' : t.calculate}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200"
              >
                {t.reset}
              </button>
            </div>
          </form>
        </div>
        
        {/* Results */}
        <div className="space-y-6">
          {results ? (
            <>
              {/* Recommendation Card */}
              <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                results.recommended === 'new' ? 'border-green-500' : 'border-blue-500'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {t.recommended}
                  </h3>
                  {results.recommended === 'new' ? (
                    <TrendingDown className="h-6 w-6 text-green-500" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <p className="text-2xl font-bold mb-2">
                  {results.recommended === 'new' ? t.newRegime : t.oldRegime}
                </p>
                <p className="text-gray-600 mb-2">
                  You save {formatCurrency(results.savings)} ({results.savingsPercentage}%)
                </p>
                {/* Show rebate message if applicable */}
                {results.rebateMessage && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    {results.rebateMessage}
                  </div>
                )}
              </div>
              
              {/* Comparison Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Old Regime */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                    {t.oldRegime}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxable Income:</span>
                      <span className="font-semibold">{formatCurrency(results.oldRegime.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Tax:</span>
                      <span className="font-semibold">{formatCurrency(results.oldRegime.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cess (4%):</span>
                      <span className="font-semibold">{formatCurrency(results.oldRegime.cess)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Total Tax:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(results.oldRegime.totalTax)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* New Regime */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                    {t.newRegime}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxable Income:</span>
                      <span className="font-semibold">{formatCurrency(results.newRegime.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Tax:</span>
                      <span className="font-semibold">{formatCurrency(results.newRegime.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cess (4%):</span>
                      <span className="font-semibold">{formatCurrency(results.newRegime.cess)}</span>
                    </div>
                    {results.newRegime.totalTaxBeforeRebate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax Before Rebate:</span>
                        <span className="font-semibold">{formatCurrency(results.newRegime.totalTaxBeforeRebate)}</span>
                      </div>
                    )}
                    {results.newRegime.rebate87A > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Section 87A Rebate:</span>
                        <span className="font-semibold text-green-600">-{formatCurrency(results.newRegime.rebate87A)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Final Tax:</span>
                        <span className="font-bold text-green-600">{formatCurrency(results.newRegime.totalTax)}</span>
                      </div>
                    </div>
                    
                    {/* Rebate Qualification Message */}
                    {results.newRegime.qualifiesForRebate && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">🎉</span>
                          <div>
                            <p className="text-sm font-semibold text-green-800">Section 87A Rebate Applied!</p>
                            <p className="text-xs text-green-700">
                              Full rebate available since taxable income ≤ ₹7,00,000
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Ready to Calculate
              </h3>
              <p className="text-gray-600">
                Fill in your details to see your tax calculation and regime comparison
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaxCalculator