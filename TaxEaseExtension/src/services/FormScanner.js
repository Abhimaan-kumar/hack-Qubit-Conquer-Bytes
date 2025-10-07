/**
 * FormScanner - Scans and monitors form fields on the ITR portal
 * Tracks field changes and sends updates to FieldDataManager
 */

import fieldDataManager from './FieldDataManager';

class FormScanner {
  constructor() {
    this.observers = [];
    this.scannedFields = new Set();
    this.activeField = null;
    this.scanInterval = null;
  }

  /**
   * Initialize form scanning
   */
  init() {
    console.log('[FormScanner] Initializing form scanner...');
    
    // Initial scan
    this.scanAllForms();
    
    // Set up mutation observer for dynamic forms
    this.setupMutationObserver();
    
    // Set up field focus/change listeners
    this.setupFieldListeners();
    
    // Periodic scan for new fields (every 2 seconds)
    this.scanInterval = setInterval(() => {
      this.scanAllForms();
    }, 2000);

    console.log('[FormScanner] Form scanner initialized');
  }

  /**
   * Scan all forms on the page
   */
  scanAllForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach((form, index) => {
      this.scanForm(form, index);
    });

    // Also scan fields outside forms
    this.scanStandaloneFields();
  }

  /**
   * Scan a specific form
   */
  scanForm(form, formIndex) {
    const fields = form.querySelectorAll('input, select, textarea');
    
    fields.forEach((field) => {
      this.registerField(field, formIndex);
    });
  }

  /**
   * Scan standalone fields (not in forms)
   */
  scanStandaloneFields() {
    const standaloneFields = document.querySelectorAll('input:not(form input), select:not(form select), textarea:not(form textarea)');
    
    standaloneFields.forEach((field) => {
      this.registerField(field, -1);
    });
  }

  /**
   * Register a field with FieldDataManager
   */
  registerField(field, formIndex) {
    const fieldId = this.getFieldId(field, formIndex);
    
    // Skip if already registered
    if (this.scannedFields.has(fieldId)) {
      return;
    }

    const fieldData = this.extractFieldData(field);
    
    // Register with FieldDataManager
    fieldDataManager.registerField(fieldId, fieldData);
    
    // Mark as scanned
    this.scannedFields.add(fieldId);
    
    // Highlight field for debugging (optional)
    this.highlightField(field);
  }

  /**
   * Extract field data
   */
  extractFieldData(field) {
    const label = this.getFieldLabel(field);
    const type = field.type || field.tagName.toLowerCase();
    const value = this.getFieldValue(field);
    const category = this.categorizeField(label, type);
    const relatedFields = this.findRelatedFields(field, category);

    return {
      label,
      type,
      value,
      category,
      relatedFields,
      element: field,
    };
  }

  /**
   * Get field ID
   */
  getFieldId(field, formIndex) {
    return field.id || 
           field.name || 
           `field_${formIndex}_${field.type}_${Date.now()}`;
  }

  /**
   * Get field label
   */
  getFieldLabel(field) {
    // Try to find label element
    const labelElement = field.labels?.[0] || 
                        document.querySelector(`label[for="${field.id}"]`);
    
    if (labelElement) {
      return labelElement.textContent.trim();
    }

    // Try to find label from parent
    const parent = field.closest('div, td, li');
    if (parent) {
      const text = parent.textContent.trim();
      if (text.length < 100) {
        return text.replace(field.value, '').trim();
      }
    }

    // Use placeholder or name as fallback
    return field.placeholder || field.name || field.id || 'Unknown Field';
  }

  /**
   * Get field value
   */
  getFieldValue(field) {
    if (field.type === 'checkbox' || field.type === 'radio') {
      return field.checked;
    }
    return field.value;
  }

  /**
   * Categorize field based on label and type
   */
  categorizeField(label, type) {
    const lowerLabel = label.toLowerCase();

    // Income categories
    if (lowerLabel.includes('salary') || lowerLabel.includes('income')) {
      return 'income';
    }
    if (lowerLabel.includes('hra') || lowerLabel.includes('house rent')) {
      return 'hra';
    }
    if (lowerLabel.includes('bonus') || lowerLabel.includes('allowance')) {
      return 'income';
    }

    // Deduction categories
    if (lowerLabel.includes('80c') || 
        lowerLabel.includes('ppf') || 
        lowerLabel.includes('elss') ||
        lowerLabel.includes('life insurance')) {
      return 'deduction_80c';
    }
    if (lowerLabel.includes('80d') || lowerLabel.includes('health insurance')) {
      return 'deduction_80d';
    }
    if (lowerLabel.includes('home loan') || lowerLabel.includes('housing loan')) {
      return 'deduction_24b';
    }

    // Tax regime
    if (lowerLabel.includes('regime') || lowerLabel.includes('tax option')) {
      return 'tax_regime';
    }

    // Personal info
    if (lowerLabel.includes('pan') || lowerLabel.includes('name') || lowerLabel.includes('age')) {
      return 'personal_info';
    }

    return 'general';
  }

  /**
   * Find related fields
   */
  findRelatedFields(field, category) {
    const related = [];

    // HRA related fields
    if (category === 'hra') {
      related.push('basic_salary', 'rent_paid', 'city_type');
    }

    // 80C related fields
    if (category === 'deduction_80c') {
      related.push('ppf', 'elss', 'life_insurance', 'tuition_fees');
    }

    return related;
  }

  /**
   * Setup mutation observer for dynamic content
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const fields = node.querySelectorAll?.('input, select, textarea');
              fields?.forEach((field) => {
                this.registerField(field, -1);
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  /**
   * Setup field listeners
   */
  setupFieldListeners() {
    // Focus event
    document.addEventListener('focusin', (e) => {
      const field = e.target;
      if (this.isFormField(field)) {
        this.handleFieldFocus(field);
      }
    }, true);

    // Blur event
    document.addEventListener('focusout', (e) => {
      const field = e.target;
      if (this.isFormField(field)) {
        this.handleFieldBlur(field);
      }
    }, true);

    // Change event
    document.addEventListener('change', (e) => {
      const field = e.target;
      if (this.isFormField(field)) {
        this.handleFieldChange(field);
      }
    }, true);

    // Input event (real-time)
    document.addEventListener('input', (e) => {
      const field = e.target;
      if (this.isFormField(field)) {
        this.handleFieldInput(field);
      }
    }, true);
  }

  /**
   * Check if element is a form field
   */
  isFormField(element) {
    return element.matches('input, select, textarea');
  }

  /**
   * Handle field focus
   */
  handleFieldFocus(field) {
    this.activeField = field;
    const fieldId = this.getFieldId(field, -1);
    
    // Notify about active field
    window.dispatchEvent(new CustomEvent('taxease:field-focus', {
      detail: {
        fieldId,
        field: fieldDataManager.getField(fieldId),
        element: field,
      },
    }));
  }

  /**
   * Handle field blur
   */
  handleFieldBlur(field) {
    if (this.activeField === field) {
      this.activeField = null;
    }

    window.dispatchEvent(new CustomEvent('taxease:field-blur', {
      detail: {
        fieldId: this.getFieldId(field, -1),
      },
    }));
  }

  /**
   * Handle field change
   */
  handleFieldChange(field) {
    const fieldId = this.getFieldId(field, -1);
    const value = this.getFieldValue(field);
    
    // Update FieldDataManager
    fieldDataManager.updateFieldValue(fieldId, value);
    
    // Notify about change
    window.dispatchEvent(new CustomEvent('taxease:field-change', {
      detail: {
        fieldId,
        value,
        field: fieldDataManager.getField(fieldId),
      },
    }));
  }

  /**
   * Handle field input (real-time)
   */
  handleFieldInput(field) {
    const fieldId = this.getFieldId(field, -1);
    const value = this.getFieldValue(field);
    
    // Update FieldDataManager
    fieldDataManager.updateFieldValue(fieldId, value);
  }

  /**
   * Highlight field (for debugging)
   */
  highlightField(field) {
    if (!field || field.dataset.taxeaseScanned) return;
    
    field.dataset.taxeaseScanned = 'true';
    // Optional: Add visual indicator
    // field.style.outline = '2px solid rgba(59, 130, 246, 0.3)';
  }

  /**
   * Get active field
   */
  getActiveField() {
    return this.activeField;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
    
    this.scannedFields.clear();
    console.log('[FormScanner] Form scanner destroyed');
  }
}

// Create singleton instance
const formScanner = new FormScanner();

export default formScanner;
