import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentUpload = ({ onUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    // Validate file
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPG, PNG)');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    
    // Call onUpload callback
    if (onUpload) {
      const result = await onUpload(file);
      if (result?.data) {
        setParsedData(result.data);
      }
    }
  };

  const handleAutofill = (fieldMappings) => {
    // Dispatch event to autofill fields
    window.dispatchEvent(new CustomEvent('taxease:autofill', {
      detail: { mappings: fieldMappings },
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <input
          type="file"
          id="document-upload"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={isLoading}
        />

        {!uploadedFile && !isLoading && (
          <label htmlFor="document-upload" className="cursor-pointer">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">
                  Upload Form-16 or Salary Slip
                </div>
                <div className="text-sm text-gray-500">
                  Drag & drop or click to browse
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Supports PDF, JPG, PNG (max 10MB)
                </div>
              </div>
            </div>
          </label>
        )}

        {isLoading && (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="font-medium text-gray-700">
              Processing document...
            </div>
            <div className="text-sm text-gray-500">
              Extracting data with AI-powered OCR
            </div>
          </div>
        )}

        {uploadedFile && !isLoading && !parsedData && (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <div className="font-semibold text-gray-700">
                {uploadedFile.name}
              </div>
              <div className="text-sm text-gray-500">
                {(uploadedFile.size / 1024).toFixed(0)} KB
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parsed Data Display */}
      <AnimatePresence>
        {parsedData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border-2 border-green-500 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✨</span>
                  <div>
                    <div className="font-bold">Data Extracted Successfully!</div>
                    <div className="text-xs opacity-90">Review and autofill</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const mappings = {
                      pan: parsedData.pan,
                      gross_salary: parsedData.gross_salary,
                      basic_salary: parsedData.basic_salary,
                      hra: parsedData.hra,
                      ...parsedData.deductions,
                    };
                    handleAutofill(mappings);
                  }}
                  className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  🚀 Autofill All
                </button>
              </div>
            </div>

            {/* Data Summary */}
            <div className="p-4 space-y-3">
              {/* Personal Info */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Personal Information
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <DataItem label="Name" value={parsedData.employee_name} />
                  <DataItem label="PAN" value={parsedData.pan} />
                  <DataItem label="Employer" value={parsedData.employer_name} />
                  <DataItem label="FY" value={parsedData.financial_year} />
                </div>
              </div>

              {/* Income Breakdown */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Income Breakdown
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <DataItem label="Gross Salary" value={formatCurrency(parsedData.gross_salary)} highlight />
                  <DataItem label="Basic Salary" value={formatCurrency(parsedData.basic_salary)} />
                  <DataItem label="HRA" value={formatCurrency(parsedData.hra)} />
                  <DataItem label="Special Allowance" value={formatCurrency(parsedData.special_allowance)} />
                </div>
              </div>

              {/* Deductions */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Deductions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {parsedData.deductions && Object.entries(parsedData.deductions).map(([key, value]) => (
                    <DataItem
                      key={key}
                      label={`Section ${key}`}
                      value={formatCurrency(value)}
                      isDeduction
                    />
                  ))}
                  <DataItem label="Standard Deduction" value={formatCurrency(parsedData.standard_deduction)} isDeduction />
                  <DataItem label="Professional Tax" value={formatCurrency(parsedData.professional_tax)} isDeduction />
                </div>
              </div>

              {/* TDS */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Tax Deducted at Source
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">TDS Deducted</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(parsedData.tds_deducted)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 p-3 flex space-x-2">
              <button
                onClick={() => {
                  setParsedData(null);
                  setUploadedFile(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Upload Another
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('taxease:show-parsed-data', {
                    detail: { data: parsedData },
                  }));
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Notice */}
      <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
        <div className="flex items-start space-x-2">
          <span>🔒</span>
          <div>
            <strong>Privacy:</strong> Your document is processed locally and temporarily. No data is permanently stored or shared.
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for data items
const DataItem = ({ label, value, highlight, isDeduction }) => (
  <div className={`bg-gray-50 rounded-lg p-2 ${highlight ? 'border-2 border-blue-500' : ''}`}>
    <div className="text-xs text-gray-500">{label}</div>
    <div className={`text-sm font-semibold ${isDeduction ? 'text-green-600' : 'text-gray-800'}`}>
      {isDeduction && '-'}{value}
    </div>
  </div>
);

export default DocumentUpload;
