import React, { useState, useCallback, useEffect } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Download, Calculator, RefreshCcw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { translations } from '../data/translations'
import { extractForm16Data, formatCurrency } from '../utils/taxCalculations'
import apiClient from '../utils/api'

const DocumentUpload = ({ language }) => {
  const t = translations[language]
  const [uploadedFile, setUploadedFile] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [documents, setDocuments] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)

  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true)
    try {
      const res = await apiClient.getDocuments()
      setDocuments(res?.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setDocsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])
  
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])
  
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])
  
  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }
  
  const handleFileUpload = useCallback(async (file) => {
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size should be less than 10MB')
      return
    }
    
    setLoading(true)
    setUploadedFile(file)
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('documentType', 'form16')
      formData.append('financialYear', 'FY2024-25')

      const res = await apiClient.uploadDocument(formData)
      toast.success(t.uploadSuccess)

      // Optionally kick off processing
      if (res?.data?._id) {
        await apiClient.processDocument(res.data._id)
      }

      // For UI demo, keep extractedData via mock until backend processing callback is implemented
      const text = await extractTextFromPDF()
      const data = extractForm16Data(text)
      setExtractedData(data)
    } catch (error) {
      toast.error(t.uploadError)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [t.uploadSuccess, t.uploadError])
  
  // Mock PDF text extraction (in real app, use pdf-lib or similar)
  const extractTextFromPDF = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock extracted text from a sample Form 16
        const mockText = `
          FORM NO. 16
          [See rule 31(1)(a)]
          Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source from salary
          
          Name of the Employee: ABHISHEK JYOTI
          PAN of the Employee: FGHSJ9027A
          
          Name/Address of the Employer: CCPC PUBLICATIONS INDIA PRIVATE LIMITED
          TAN of the Employer: DELC05025E
          
          Assessment Year: 2025-26
          
          PART B
          Details of salary paid and any tax deducted
          
          1. Gross Salary: Rs. 657944
          2. Less: Allowance to the extent exempt under section 10: Rs. 0
          3. Balance (1-2): Rs. 657944
          4. Less: Deductions under section 16
             (a) Standard deduction under section 16(ia): Rs. 50000
             (b) Entertainment allowance under section 16(ii): Rs. 0
             (c) Tax on employment under section 16(iii): Rs. 0
          5. Total amount of deductions under section 16: Rs. 50000
          6. Income chargeable under the head 'Salaries' (3-5): Rs. 607944
          7. Add: Any other income reported by the employee: Rs. 0
          8. Gross total income (6+7): Rs. 607944
          9. Less: Deductions under Chapter VI-A: Rs. 25000
          10. Total income (8-9): Rs. 582944
          11. Tax on total income: Rs. 14147
          12. Less: Relief under section 89 (attach details): Rs. 0
          13. Net tax payable (11-12): Rs. 14147
          14. Less: Tax deducted at source: Rs. 14147
          15. Tax payable / (refundable): Rs. 0
        `
        resolve(mockText)
      }, 2000)
    })
  }
  
  const handleEditData = (field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: field.includes('Salary') || field.includes('Deduction') || field.includes('Income') || field.includes('Tax')
        ? parseInt(value) || 0
        : value
    }))
  }
  
  const resetUpload = () => {
    setUploadedFile(null)
    setExtractedData(null)
    setLoading(false)
  }

  const handleProcess = async (id) => {
    try {
      await apiClient.processDocument(id)
      toast.success('Processing started')
      fetchDocuments()
    } catch (e) {
      toast.error('Failed to start processing')
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiClient.request(`/documents/${id}`, { method: 'DELETE' })
      toast.success('Document deleted')
      fetchDocuments()
    } catch (e) {
      toast.error('Failed to delete document')
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <Upload className="h-10 w-10 text-blue-600 mr-3" />
          {t.upload}
        </h1>
        <p className="text-xl text-gray-600">
          Upload your Form 16 PDF for automatic data extraction
        </p>
      </div>
      
      {!uploadedFile ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="bg-blue-100 p-4 rounded-full inline-block">
                <FileText className="h-12 w-12 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t.dragDropText}
                </h3>
                <p className="text-gray-600">
                  Supports PDF files up to 10MB
                </p>
              </div>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200">
                Choose File
              </button>
            </div>
          </div>
          
          {/* Privacy Notice */}
          <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800 mb-1">
                  {t.privacyTitle}
                </h4>
                <p className="text-green-700 text-sm">
                  {t.privacyText}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{uploadedFile.name}</h3>
                  <p className="text-sm text-gray-600">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={resetUpload}
                className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
              >
                Remove
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Processing Document...
              </h3>
              <p className="text-gray-600">
                Extracting data from your Form 16
              </p>
            </div>
          ) : extractedData ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Extracted Data
                </h2>
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Successfully Extracted</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">
                    Personal Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Name
                    </label>
                    <input
                      type="text"
                      value={extractedData.employeeName || ''}
                      onChange={(e) => handleEditData('employeeName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={extractedData.pan || ''}
                      onChange={(e) => handleEditData('pan', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                      maxLength={10}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assessment Year
                    </label>
                    <input
                      type="text"
                      value={extractedData.assessmentYear || '2025-26'}
                      onChange={(e) => handleEditData('assessmentYear', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Financial Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">
                    Financial Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gross Salary (₹)
                    </label>
                    <input
                      type="number"
                      value={extractedData.grossSalary || 0}
                      onChange={(e) => handleEditData('grossSalary', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Standard Deduction (₹)
                    </label>
                    <input
                      type="number"
                      value={extractedData.standardDeduction || 50000}
                      onChange={(e) => handleEditData('standardDeduction', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Deductions (₹)
                    </label>
                    <input
                      type="number"
                      value={extractedData.totalDeductions || 0}
                      onChange={(e) => handleEditData('totalDeductions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Deducted (₹)
                    </label>
                    <input
                      type="number"
                      value={extractedData.taxDeducted || 0}
                      onChange={(e) => handleEditData('taxDeducted', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-4">Summary</h3>
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Gross Salary</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(extractedData.grossSalary || 0)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(extractedData.totalDeductions || 0)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Tax Deducted</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(extractedData.taxDeducted || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculate Tax
                </button>
                <button className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center">
                  <Download className="h-5 w-5 mr-2" />
                  Export Data
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Extraction Failed
              </h3>
              <p className="text-gray-600 mb-4">
                Unable to extract data from the uploaded document
              </p>
              <button
                onClick={resetUpload}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                Try Another File
              </button>
            </div>
          )}
        </div>
      )}

      {/* Documents List */}
      <div className="mt-10 bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Documents</h2>
          <button onClick={fetchDocuments} className="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 flex items-center">
            <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
          </button>
        </div>
        {docsLoading ? (
          <div className="text-gray-600">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-gray-600">No documents uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">File</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">FY</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc._id} className="border-t">
                    <td className="py-2 pr-4">{doc.originalName}</td>
                    <td className="py-2 pr-4 capitalize">{doc.documentType}</td>
                    <td className="py-2 pr-4">{doc.financialYear}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${doc.processingStatus === 'completed' ? 'bg-green-100 text-green-700' : doc.processingStatus === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                        {doc.processingStatus}
                      </span>
                    </td>
                    <td className="py-2 pr-4 space-x-2">
                      <button onClick={() => handleProcess(doc._id)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Process</button>
                      <a href={`${apiClient.baseURL}/documents/${doc._id}/download`} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">Download</a>
                      <button onClick={() => handleDelete(doc._id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center"><Trash2 className="h-3 w-3 mr-1" />Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentUpload