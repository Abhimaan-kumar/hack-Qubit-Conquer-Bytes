import React from 'react';

const Tooltip = ({ field, position, onAutofill, onExplain }) => {
  if (!field) return null;

  // Get tooltip text based on field data
  const getTooltipText = (fieldData) => {
    // If AI explanation is available, use it
    if (fieldData.aiExplanation) {
      return fieldData.aiExplanation;
    }

    // Fallback explanations
    const tooltips = {
      pan: 'Enter your PAN number (e.g., AAAAA1111A). This is a unique 10-character alphanumeric identifier.',
      name: 'Enter your full name exactly as per PAN card. No abbreviations.',
      salary: 'Enter your gross annual salary including basic pay, allowances, and bonuses before any deductions.',
      basic_salary: 'Basic salary is the fixed component of your salary before any additions or deductions.',
      hra: 'House Rent Allowance (HRA) is the amount your employer pays towards your rent. You can claim exemption.',
      age: 'Enter your age as of 31st March of the assessment year.',
      regime: 'Old regime allows deductions but has higher tax rates. New regime has lower rates but limited deductions.',
      '80c': 'Section 80C allows deductions up to ₹1.5 lakh for investments in PPF, ELSS, LIC, etc.',
      '80d': 'Health insurance premium deduction: ₹25,000 for self/family, ₹50,000 for senior citizens.',
      homeLoan: 'Interest paid on home loan is deductible under Section 24(b) up to ₹2 lakh.',
    };

    const label = fieldData.label?.toLowerCase() || '';
    for (const [key, content] of Object.entries(tooltips)) {
      if (label.includes(key)) {
        return content;
      }
    }

    return 'Enter accurate information for this field. Refer to your tax documents for the correct value.';
  };

  const hasSuggestion = field.suggestedValue !== null && field.suggestedValue !== undefined;

  return (
    <div
      className="fixed bg-white border-2 border-blue-400 text-gray-800 text-sm rounded-xl shadow-2xl z-[10000] max-w-md neumorphic animate-fadeIn"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 10}px`,
        transform: 'translateY(-100%)',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-xl">
        <div className="font-semibold text-sm">
          💡 {field.label || 'Field Guidance'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Explanation */}
        <div className="text-sm leading-relaxed text-gray-700">
          {getTooltipText(field)}
        </div>

        {/* Current Value */}
        {field.value && (
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Current Value</div>
            <div className="text-sm font-semibold text-gray-800">{field.value}</div>
          </div>
        )}

        {/* Suggested Value */}
        {hasSuggestion && (
          <div className="bg-green-50 rounded-lg p-2 border-2 border-green-400">
            <div className="text-xs text-green-700 font-medium mb-1">✨ AI Suggestion</div>
            <div className="text-sm font-semibold text-green-800 mb-2">{field.suggestedValue}</div>
            {onAutofill && (
              <button
                onClick={() => onAutofill(field.id, field.suggestedValue)}
                className="w-full bg-green-600 text-white text-xs px-3 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                ✓ Use This Value
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {onExplain && (
            <button
              onClick={() => onExplain(field.id)}
              className="flex-1 bg-blue-100 text-blue-700 text-xs px-3 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors"
            >
              🤔 Explain More
            </button>
          )}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('taxease:open-chat', {
                detail: { fieldId: field.id },
              }));
            }}
            className="flex-1 bg-purple-100 text-purple-700 text-xs px-3 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors"
          >
            💬 Ask AI
          </button>
        </div>
      </div>

      {/* Arrow */}
      <div
        className="absolute left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"
        style={{
          bottom: '-8px',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
        }}
      ></div>
    </div>
  );
};

export default Tooltip;