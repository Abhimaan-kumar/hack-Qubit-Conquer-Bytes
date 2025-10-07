/**
 * AIService - Handles communication with AI backend
 */

class AIService {
  constructor() {
    this.apiUrl = 'http://localhost:3001'; // Change to your backend URL
    this.socket = null;
    this.requestCache = new Map();
  }

  /**
   * Initialize socket connection
   */
  initSocket(socketInstance) {
    this.socket = socketInstance;
    console.log('[AIService] Socket initialized');
  }

  /**
   * Send query to AI
   */
  async sendQuery(context, userQuery = '') {
    try {
      const payload = {
        ...context,
        user_query: userQuery,
        timestamp: new Date().toISOString(),
      };

      // Check cache first
      const cacheKey = JSON.stringify(payload);
      if (this.requestCache.has(cacheKey)) {
        const cached = this.requestCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
          console.log('[AIService] Returning cached response');
          return cached.response;
        }
      }

      // Send via socket if available
      if (this.socket?.connected) {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('AI request timeout'));
          }, 30000); // 30 second timeout

          this.socket.emit('ai-query', payload, (response) => {
            clearTimeout(timeout);
            
            // Cache response
            this.requestCache.set(cacheKey, {
              response,
              timestamp: Date.now(),
            });
            
            resolve(response);
          });
        });
      }

      // Fallback to HTTP request
      const response = await fetch(`${this.apiUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache response
      this.requestCache.set(cacheKey, {
        response: data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error('[AIService] Error sending query:', error);
      
      // Return fallback response
      return this.getFallbackResponse(context, userQuery);
    }
  }

  /**
   * Upload and process document
   */
  async uploadDocument(file) {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', 'form16');

      const response = await fetch(`${this.apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[AIService] Error uploading document:', error);
      
      // Return mock parsed data for demo
      return this.getMockDocumentData();
    }
  }

  /**
   * Get tax calculation
   */
  async calculateTax(incomeData, deductions, regime) {
    try {
      const response = await fetch(`${this.apiUrl}/api/calculate-tax`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          income: incomeData,
          deductions,
          regime,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[AIService] Error calculating tax:', error);
      
      // Return mock calculation
      return this.getMockTaxCalculation(incomeData, deductions, regime);
    }
  }

  /**
   * Get field explanation
   */
  async explainField(fieldContext) {
    try {
      const context = {
        field_context: fieldContext,
        task: 'Explain this field and provide guidance',
      };

      return await this.sendQuery(context, `Explain ${fieldContext.field_label}`);
    } catch (error) {
      console.error('[AIService] Error explaining field:', error);
      return this.getFallbackExplanation(fieldContext);
    }
  }

  /**
   * Get autofill suggestion
   */
  async getSuggestion(fieldContext, documentData) {
    try {
      const context = {
        field_context: fieldContext,
        document_context: documentData,
        task: 'Suggest value for this field based on document data',
      };

      return await this.sendQuery(context, `Suggest value for ${fieldContext.field_label}`);
    } catch (error) {
      console.error('[AIService] Error getting suggestion:', error);
      return null;
    }
  }

  /**
   * Fallback response when AI is unavailable
   */
  getFallbackResponse(context, userQuery) {
    const fieldLabel = context.field_context?.field_label || '';
    
    return {
      message: `I understand you're asking about "${userQuery}". While I'm currently offline, here are some general tips:\n\n` +
               `For ${fieldLabel}:\n` +
               `• Ensure you enter accurate values\n` +
               `• Refer to your Form-16 or salary slips\n` +
               `• Consult the ITR portal help section for detailed guidance\n\n` +
               `I'll provide more personalized assistance once the connection is restored.`,
      suggestions: [],
      impact: null,
      source: 'fallback',
    };
  }

  /**
   * Fallback field explanation
   */
  getFallbackExplanation(fieldContext) {
    const explanations = {
      'salary': 'Enter your total annual salary including basic pay, allowances, and bonuses.',
      'hra': 'House Rent Allowance - Enter the HRA received from your employer. You can claim exemption based on actual rent paid.',
      '80c': 'Deductions under Section 80C include investments in PPF, ELSS, life insurance premiums, etc. Maximum limit is ₹1.5 lakh.',
      '80d': 'Health insurance premium paid for self, family, and parents. Deduction up to ₹25,000 (₹50,000 for senior citizens).',
      'pan': 'Enter your 10-digit Permanent Account Number (PAN) in the format: AAAAA9999A',
    };

    const label = fieldContext.field_label?.toLowerCase() || '';
    
    for (const [key, explanation] of Object.entries(explanations)) {
      if (label.includes(key)) {
        return {
          message: explanation,
          suggestions: [],
          source: 'fallback',
        };
      }
    }

    return {
      message: 'Please enter the required information for this field. Refer to your tax documents for accurate values.',
      suggestions: [],
      source: 'fallback',
    };
  }

  /**
   * Mock document data for demo
   */
  getMockDocumentData() {
    return {
      success: true,
      data: {
        employee_name: 'John Doe',
        pan: 'AAAAA1234A',
        gross_salary: 800000,
        basic_salary: 500000,
        hra: 120000,
        special_allowance: 180000,
        standard_deduction: 50000,
        professional_tax: 2400,
        tds_deducted: 45000,
        deductions: {
          '80C': 150000,
          '80D': 25000,
        },
        employer_name: 'ABC Corporation Ltd',
        financial_year: '2024-25',
      },
      message: 'Document parsed successfully (demo mode)',
    };
  }

  /**
   * Mock tax calculation
   */
  getMockTaxCalculation(incomeData, deductions, regime) {
    const grossIncome = parseFloat(incomeData.gross_salary || 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    
    const oldRegimeTax = this.calculateOldRegime(grossIncome, totalDeductions);
    const newRegimeTax = this.calculateNewRegime(grossIncome);
    
    const savings = Math.abs(oldRegimeTax - newRegimeTax);
    const recommended = oldRegimeTax < newRegimeTax ? 'old' : 'new';

    return {
      old_regime: {
        gross_income: grossIncome,
        total_deductions: totalDeductions,
        taxable_income: Math.max(0, grossIncome - totalDeductions - 50000),
        tax: oldRegimeTax,
      },
      new_regime: {
        gross_income: grossIncome,
        total_deductions: 0,
        taxable_income: Math.max(0, grossIncome - 75000),
        tax: newRegimeTax,
      },
      recommended_regime: recommended,
      savings: savings,
      recommendation: `You can save ₹${savings.toFixed(0)} by choosing the ${recommended} regime.`,
    };
  }

  /**
   * Calculate old regime tax
   */
  calculateOldRegime(income, deductions) {
    const taxableIncome = Math.max(0, income - deductions - 50000);
    let tax = 0;

    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 12500 + (taxableIncome - 500000) * 0.2;
    } else {
      tax = 112500 + (taxableIncome - 1000000) * 0.3;
    }

    return tax * 1.04; // Add 4% cess
  }

  /**
   * Calculate new regime tax
   */
  calculateNewRegime(income) {
    const taxableIncome = Math.max(0, income - 75000);
    let tax = 0;

    if (taxableIncome <= 300000) {
      tax = 0;
    } else if (taxableIncome <= 700000) {
      tax = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 20000 + (taxableIncome - 700000) * 0.1;
    } else if (taxableIncome <= 1200000) {
      tax = 50000 + (taxableIncome - 1000000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      tax = 80000 + (taxableIncome - 1200000) * 0.2;
    } else {
      tax = 140000 + (taxableIncome - 1500000) * 0.3;
    }

    return tax * 1.04; // Add 4% cess
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.requestCache.clear();
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
