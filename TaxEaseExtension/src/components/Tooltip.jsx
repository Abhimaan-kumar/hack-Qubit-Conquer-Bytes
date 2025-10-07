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
      className="fixed bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs rounded py-1 px-2 shadow-lg z-50 max-w-xs"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 40}px`,
      }}
    >
      <div className="font-medium">{getTooltipText(fieldName)}</div>
      <div className="absolute bottom-0 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-yellow-100 transform translate-y-full"></div>
    </div>
  );
};

export default Tooltip;