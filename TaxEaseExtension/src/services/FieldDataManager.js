/**
 * FieldDataManager - Manages form field data, context, and state
 * Maintains in-memory map of fields, values, and deductions
 */

class FieldDataManager {
  constructor() {
    this.fields = new Map();
    this.deductions = new Map();
    this.regime = 'new'; // 'old' or 'new'
    this.listeners = new Set();
    this.documentData = null;
  }

  /**
   * Register a form field
   */
  registerField(fieldId, fieldData) {
    this.fields.set(fieldId, {
      id: fieldId,
      label: fieldData.label || '',
      type: fieldData.type || 'text',
      value: fieldData.value || '',
      category: fieldData.category || 'general',
      relatedFields: fieldData.relatedFields || [],
      suggestedValue: null,
      aiExplanation: null,
      lastUpdated: Date.now(),
    });
    this.notifyListeners('field-registered', fieldId);
  }

  /**
   * Update field value
   */
  updateFieldValue(fieldId, value) {
    const field = this.fields.get(fieldId);
    if (field) {
      field.value = value;
      field.lastUpdated = Date.now();
      this.fields.set(fieldId, field);
      this.notifyListeners('field-updated', { fieldId, value });
    }
  }

  /**
   * Get field data
   */
  getField(fieldId) {
    return this.fields.get(fieldId);
  }

  /**
   * Get all fields
   */
  getAllFields() {
    return Array.from(this.fields.values());
  }

  /**
   * Get fields by category
   */
  getFieldsByCategory(category) {
    return Array.from(this.fields.values()).filter(
      (field) => field.category === category
    );
  }

  /**
   * Set deduction value
   */
  setDeduction(section, amount) {
    this.deductions.set(section, {
      section,
      amount: parseFloat(amount) || 0,
      lastUpdated: Date.now(),
    });
    this.notifyListeners('deduction-updated', { section, amount });
  }

  /**
   * Get deduction
   */
  getDeduction(section) {
    return this.deductions.get(section);
  }

  /**
   * Get all deductions
   */
  getAllDeductions() {
    return Object.fromEntries(this.deductions);
  }

  /**
   * Set tax regime
   */
  setTaxRegime(regime) {
    this.regime = regime;
    this.notifyListeners('regime-changed', regime);
  }

  /**
   * Get tax regime
   */
  getTaxRegime() {
    return this.regime;
  }

  /**
   * Set AI suggestion for a field
   */
  setSuggestion(fieldId, suggestion) {
    const field = this.fields.get(fieldId);
    if (field) {
      field.suggestedValue = suggestion.value;
      field.aiExplanation = suggestion.explanation;
      this.fields.set(fieldId, field);
      this.notifyListeners('suggestion-updated', { fieldId, suggestion });
    }
  }

  /**
   * Store parsed document data
   */
  setDocumentData(data) {
    this.documentData = {
      ...data,
      uploadedAt: Date.now(),
    };
    this.notifyListeners('document-uploaded', data);
  }

  /**
   * Get document data
   */
  getDocumentData() {
    return this.documentData;
  }

  /**
   * Build context for AI agent
   */
  buildAIContext(fieldId, userQuery) {
    const field = this.fields.get(fieldId);
    const relatedFields = {};
    
    if (field && field.relatedFields.length > 0) {
      field.relatedFields.forEach((relatedId) => {
        const relatedField = this.fields.get(relatedId);
        if (relatedField) {
          relatedFields[relatedField.label] = relatedField.value;
        }
      });
    }

    return {
      user_query: userQuery,
      field_context: {
        field_label: field?.label || '',
        current_value: field?.value || '',
        field_type: field?.type || '',
        related_fields: relatedFields,
        deductions_claimed: this.getAllDeductions(),
        tax_regime: this.regime,
      },
      document_context: this.documentData,
      all_fields: this.getAllFieldsForContext(),
      user_preferences: {
        explanation_style: 'simple, step-by-step',
        language: 'English',
      },
      task: 'Provide clear, personalized explanation, show impact on total tax, suggest autofill or adjustment if needed.',
    };
  }

  /**
   * Get all fields formatted for AI context
   */
  getAllFieldsForContext() {
    const fieldsObj = {};
    this.fields.forEach((field, id) => {
      fieldsObj[field.label || id] = field.value;
    });
    return fieldsObj;
  }

  /**
   * Calculate tax comparison
   */
  calculateTaxComparison() {
    const income = this.getTotalIncome();
    const deductions = this.getTotalDeductions();

    return {
      old_regime: this.calculateOldRegimeTax(income, deductions),
      new_regime: this.calculateNewRegimeTax(income),
      recommended_regime: null, // Will be set after calculation
      savings: 0,
    };
  }

  /**
   * Get total income from fields
   */
  getTotalIncome() {
    let total = 0;
    const incomeFields = ['basic_salary', 'hra', 'other_allowances', 'bonus'];
    
    incomeFields.forEach((fieldKey) => {
      this.fields.forEach((field) => {
        if (field.label.toLowerCase().includes(fieldKey.replace('_', ' '))) {
          total += parseFloat(field.value) || 0;
        }
      });
    });

    return total;
  }

  /**
   * Get total deductions
   */
  getTotalDeductions() {
    let total = 0;
    this.deductions.forEach((deduction) => {
      total += deduction.amount;
    });
    return total;
  }

  /**
   * Calculate tax under old regime
   */
  calculateOldRegimeTax(income, deductions) {
    const taxableIncome = Math.max(0, income - deductions - 50000); // Standard deduction
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

    // Add 4% cess
    return tax * 1.04;
  }

  /**
   * Calculate tax under new regime
   */
  calculateNewRegimeTax(income) {
    const taxableIncome = Math.max(0, income - 75000); // Higher standard deduction in new regime
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

    // Add 4% cess
    return tax * 1.04;
  }

  /**
   * Add listener for data changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  /**
   * Clear all data (for session end)
   */
  clearAll() {
    this.fields.clear();
    this.deductions.clear();
    this.regime = 'new';
    this.documentData = null;
    this.notifyListeners('data-cleared', null);
  }

  /**
   * Export data for debugging (non-sensitive)
   */
  exportData() {
    return {
      fieldCount: this.fields.size,
      deductionCount: this.deductions.size,
      regime: this.regime,
      hasDocument: !!this.documentData,
    };
  }
}

// Create singleton instance
const fieldDataManager = new FieldDataManager();

export default fieldDataManager;
