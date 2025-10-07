import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/ChatBubble';
import Tooltip from '../components/Tooltip';

const ChatOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your TaxEase AI Assistant. How can I help you today?",
      isUser: false,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Toggle chat overlay visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Handle sending messages
  const handleSend = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      isUser: true,
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response after delay
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: getMockAIResponse(inputValue),
        isUser: false,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  // Mock AI responses
  const getMockAIResponse = (input) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('pan')) {
      return "Please enter your PAN number in the format: AAAAA1111A";
    } else if (lowerInput.includes('name')) {
      return "Enter your full name as it appears on your PAN card.";
    } else if (lowerInput.includes('salary')) {
      return "Enter your annual salary before tax deductions.";
    } else if (lowerInput.includes('deduction') || lowerInput.includes('80c')) {
      return "You can claim up to ₹1.5 lakh under Section 80C for investments.";
    } else if (lowerInput.includes('regime')) {
      return "Choose between the Old Tax Regime (with exemptions) and New Tax Regime (lower rates, fewer exemptions).";
    } else if (lowerInput.includes('form-16') || lowerInput.includes('upload')) {
      return "You can upload your Form-16 or payslip to automatically extract income details.";
    } else {
      return "I'm here to help with your income tax filing. You can ask about PAN, salary, deductions, tax regimes, and more!";
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulate file processing
      setIsTyping(true);
      setTimeout(() => {
        const summaryMessage = {
          id: messages.length + 1,
          text: "📄 Detected Salary: ₹10,25,000 | Regime: New | Deductions: ₹75,000",
          isUser: false,
        };
        setMessages([...messages, summaryMessage]);
        setIsTyping(false);
      }, 2000);
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your TaxEase AI Assistant. How can I help you today?",
        isUser: false,
      },
    ]);
  };

  // End session and clear data
  const handleEndSession = () => {
    handleClearChat();
    setIsOpen(false);
  };

  // Handle key press for sending messages
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simulate field focus for tooltip demo
  useEffect(() => {
    const handleFieldFocus = (e) => {
      const fieldName = e.target.name || e.target.id;
      if (fieldName) {
        setActiveTooltip(fieldName);
      }
    };

    const handleFieldBlur = () => {
      setActiveTooltip(null);
    };

    // In a real extension, we would attach these to actual form fields
    // For demo purposes, we're simulating this behavior
    document.addEventListener('focusin', handleFieldFocus, true);
    document.addEventListener('focusout', handleFieldBlur, true);

    return () => {
      document.removeEventListener('focusin', handleFieldFocus, true);
      document.removeEventListener('focusout', handleFieldBlur, true);
    };
  }, []);

  return (
    <div>
      {/* Tooltip for form fields */}
      {activeTooltip && (
        <Tooltip 
          fieldName={activeTooltip}
          position={{ x: 100, y: 100 }}
        />
      )}

      {/* Floating chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50 hover:bg-blue-700 transition-colors"
          >
            💬
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed bottom-6 right-6 w-96 h-[500px] rounded-lg shadow-xl z-50 flex flex-col ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            }`}
          >
            {/* Chat header */}
            <div
              className={`flex items-center justify-between p-4 rounded-t-lg ${
                darkMode ? 'bg-gray-700' : 'bg-blue-600 text-white'
              }`}
            >
              <div className="flex items-center">
                <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                  🇮🇳
                </div>
                <h2 className="font-bold">TaxEase AI Assistant</h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  Privacy Mode ON
                </span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1 rounded-full hover:bg-opacity-20 hover:bg-white"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1 rounded-full hover:bg-opacity-20 hover:bg-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className={`flex-1 overflow-y-auto p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message.text}
                  isUser={message.isUser}
                />
              ))}
              {isTyping && (
                <div className="flex justify-start mb-3">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* File upload and controls */}
            <div className={`p-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500">
                  <input
                    type="file"
                    id="file-upload-overlay"
                    className="hidden"
                    accept=".txt,.json"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="file-upload-overlay"
                    className="cursor-pointer hover:text-blue-600"
                  >
                    📄 Upload Form-16
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleClearChat}
                    className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="text-xs px-2 py-1 rounded hover:bg-red-200"
                  >
                    End Session
                  </button>
                </div>
              </div>

              {/* Input area */}
              <div className="flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your tax query..."
                  className={`flex-1 rounded-l-lg p-2 text-sm focus:outline-none ${
                    darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                  }`}
                />
                <button
                  onClick={handleSend}
                  disabled={inputValue.trim() === ''}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatOverlay;