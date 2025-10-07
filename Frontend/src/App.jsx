import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import TaxCalculator from './pages/TaxCalculator'
import DocumentUpload from './pages/DocumentUpload'
import ChatAssistant from './pages/ChatAssistant'
import TaxComparison from './pages/TaxComparison'
import DeductionGuide from './pages/DeductionGuide'

function App() {
  const [language, setLanguage] = useState('en')

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar language={language} setLanguage={setLanguage} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home language={language} />} />
            <Route path="/calculator" element={<TaxCalculator language={language} />} />
            <Route path="/upload" element={<DocumentUpload language={language} />} />
            <Route path="/assistant" element={<ChatAssistant language={language} />} />
            <Route path="/comparison" element={<TaxComparison language={language} />} />
            <Route path="/deductions" element={<DeductionGuide language={language} />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
