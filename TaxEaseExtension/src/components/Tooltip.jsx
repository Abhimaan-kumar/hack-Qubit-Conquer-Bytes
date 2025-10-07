import React from 'react';

const Tooltip = ({ fieldName, position }) => {
  // Get tooltip text based on field name
  const getTooltipText = (name) => {
    const tooltips = {
      pan: "Enter your PAN number (e.g., AAAAA1111A)",
      name: "Enter your full name as per PAN card",
      salary: "Enter your annual salary before tax deductions",
      age: "Enter your age as of 31st March of the financial year",
      regime: "Choose between Old and New tax regime",
      deduction: "Enter deductions under Section 80C (max ₹1.5 lakh)",
      hra: "Enter HRA exemption amount if applicable",
      homeLoan: "Enter home loan interest paid if applicable",
    };

    // Find matching tooltip (partial match)
    const lowerName = name.toLowerCase();
    for (const [key, value] of Object.entries(tooltips)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }

    return "Enter the required information for tax filing";
  };

  return (
    <div
      className="fixed bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-300 text-yellow-900 text-sm rounded-xl py-3 px-4 shadow-xl z-50 max-w-sm neumorphic"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 50}px`,
      }}
    >
      <div className="font-semibold text-yellow-800 mb-1">💡 Tip</div>
      <div className="leading-relaxed">{getTooltipText(fieldName)}</div>
      <div className="absolute bottom-0 left-6 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-yellow-200 transform translate-y-full"></div>
    </div>
  );
};

export default Tooltip;