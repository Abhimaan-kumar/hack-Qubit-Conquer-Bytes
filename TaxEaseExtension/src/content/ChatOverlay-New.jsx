import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import ChatBubble from '../components/ChatBubble';
import Tooltip from '../components/Tooltip';
import TaxComparisonCard from '../components/TaxComparisonCard';
import DocumentUpload from '../components/DocumentUpload';
import fieldDataManager from '../services/FieldDataManager';
import formScanner from '../services/FormScanner';
import aiService from '../services/AIService';

const ChatOverlay = () => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'upload', 'comparison'
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Welcome to TaxEase AI Assistant! I'll help you file your ITR with ease.\n\n📄 Upload your Form-16\n💬 Ask me anything about tax filing\n💰 Compare Old vs New tax regime",
      isUser: false,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Tooltip state
  const [activeField, setActiveField] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Position and drag state
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 450, 
    y: 20 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Tax comparison state
  const [taxComparison, setTaxComparison] = useState(null);
  
  // Document upload state
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  // Refs
  const socketRef = useRef(null);
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);

  /**
   * Initialize services
   */
  useEffect(() => {
    console.log('[TaxEase] Initializing extension...');
    
    // Initialize form scanner
    formScanner.init();
    
    // Initialize socket connection
    initializeSocket();
    
    // Listen to field data changes
    const unsubscribe = fieldDataManager.addListener(handleDataChange);
    
    // Listen to custom events
    window.addEventListener('taxease:field-focus', handleFieldFocus);
    window.addEventListener('taxease:field-blur', handleFieldBlur);
    window.addEventListener('taxease:autofill', handleAutofill);
    window.addEventListener('taxease:open-chat', handleOpenChat);
    
    // Calculate initial tax comparison
    updateTaxComparison();
    
    console.log('[TaxEase] Extension initialized');
    
    return () => {
      formScanner.destroy();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      unsubscribe();
      window.removeEventListener('taxease:field-focus', handleFieldFocus);
      window.removeEventListener('taxease:field-blur', handleFieldBlur);
      window.removeEventListener('taxease:autofill', handleAutofill);
      window.removeEventListener('taxease:open-chat', handleOpenChat);
    };
  }, []);

  /**
   * Initialize socket connection
   */
  const initializeSocket = () => {
    try {
      socketRef.current = io('http://localhost:3001', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on('connect', () => {
        console.log('[TaxEase] Connected to server');
        setConnectionStatus('Connected');
        aiService.initSocket(socketRef.current);
      });

      socketRef.current.on('ai-response', (data) => {
        setIsTyping(false);
        addMessage(data.message || data.response, false);
      });

      socketRef.current.on('disconnect', () => {
        console.log('[TaxEase] Disconnected from server');
        setConnectionStatus('Offline');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('[TaxEase] Connection error:', error);
        setConnectionStatus('Connection Error');
      });
    } catch (error) {
      console.error('[TaxEase] Failed to initialize socket:', error);
      setConnectionStatus('Offline Mode');
    }
  };

  /**
   * Handle field data changes
   */
  const handleDataChange = (event, data) => {
    console.log('[TaxEase] Data change:', event, data);
    
    if (event === 'field-updated' || event === 'deduction-updated') {
      // Recalculate tax comparison
      updateTaxComparison();
    }
  };

  /**
   * Handle field focus
   */
  const handleFieldFocus = (e) => {
    const { field, element } = e.detail;
    
    if (field && element) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setActiveField(field);
    }
  };

  /**
   * Handle field blur
   */
  const handleFieldBlur = () => {
    // Delay hiding tooltip to allow interaction
    setTimeout(() => {
      setActiveField(null);
    }, 200);
  };

  /**
   * Handle autofill
   */
  const handleAutofill = async (e) => {
    const { mappings } = e.detail;
    
    console.log('[TaxEase] Autofilling fields:', mappings);
    
    // Find and fill fields
    for (const [key, value] of Object.entries(mappings)) {
      const fields = fieldDataManager.getAllFields();
      const field = fields.find(f => 
        f.label.toLowerCase().includes(key.toLowerCase()) ||
        f.id.toLowerCase().includes(key.toLowerCase())
      );
      
      if (field && field.element) {
        field.element.value = value;
        field.element.dispatchEvent(new Event('input', { bubbles: true }));
        field.element.dispatchEvent(new Event('change', { bubbles: true }));
        fieldDataManager.updateFieldValue(field.id, value);
      }
    }
    
    addMessage('✅ Fields autofilled successfully!', false);
    updateTaxComparison();
  };

  /**
   * Handle open chat from tooltip
   */
  const handleOpenChat = (e) => {
    const { fieldId } = e.detail;
    setIsOpen(true);
    setActiveTab('chat');
    
    const field = fieldDataManager.getField(fieldId);
    if (field) {
      setInputValue(`Explain ${field.label}`);
    }
  };

  /**
   * Update tax comparison
   */
  const updateTaxComparison = async () => {
    try {
      const income = fieldDataManager.getTotalIncome();
      const deductions = fieldDataManager.getAllDeductions();
      const regime = fieldDataManager.getTaxRegime();
      
      const comparison = await aiService.calculateTax(
        { gross_salary: income },
        deductions,
        regime
      );
      
      setTaxComparison(comparison);
    } catch (error) {
      console.error('[TaxEase] Error calculating tax:', error);
    }
  };

  /**
   * Add message to chat
   */
  const addMessage = (text, isUser) => {
    const newMessage = {
      id: messages.length + 1,
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  /**
   * Handle sending messages
   */
  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const userQuery = inputValue.trim();
    addMessage(userQuery, true);
    setInputValue('');
    setIsTyping(true);

    try {
      // Get active field context if available
      const activeFieldData = activeField || formScanner.getActiveField();
      const fieldId = activeFieldData?.id;
      
      const context = fieldDataManager.buildAIContext(fieldId, userQuery);
      const response = await aiService.sendQuery(context, userQuery);
      
      setIsTyping(false);
      addMessage(response.message || response, false);
      
      // If response includes suggestions, update field
      if (response.suggestions && fieldId) {
        fieldDataManager.setSuggestion(fieldId, {
          value: response.suggestions[0]?.value,
          explanation: response.suggestions[0]?.explanation,
        });
      }
    } catch (error) {
      console.error('[TaxEase] Error sending message:', error);
      setIsTyping(false);
      addMessage('Sorry, I encountered an error. Please try again.', false);
    }
  };

  /**
   * Handle document upload
   */
  const handleDocumentUpload = async (file) => {
    setIsUploadingDoc(true);
    addMessage(`📄 Uploading ${file.name}...`, false);
    
    try {
      const result = await aiService.uploadDocument(file);
      
      if (result.success && result.data) {
        fieldDataManager.setDocumentData(result.data);
        setIsUploadingDoc(false);
        addMessage(
          `✅ Document processed successfully!\n\n` +
          `Found data for:\n` +
          `• Name: ${result.data.employee_name}\n` +
          `• PAN: ${result.data.pan}\n` +
          `• Gross Salary: ₹${result.data.gross_salary?.toLocaleString()}\n\n` +
          `You can now autofill fields from the Upload tab.`,
          false
        );
        setActiveTab('upload');
        return result;
      }
    } catch (error) {
      console.error('[TaxEase] Error uploading document:', error);
      setIsUploadingDoc(false);
      addMessage('❌ Error processing document. Please try again.', false);
    }
  };

  /**
   * Handle autofill from tooltip
   */
  const handleTooltipAutofill = (fieldId, value) => {
    const field = fieldDataManager.getField(fieldId);
    if (field && field.element) {
      field.element.value = value;
      field.element.dispatchEvent(new Event('input', { bubbles: true }));
      field.element.dispatchEvent(new Event('change', { bubbles: true }));
      fieldDataManager.updateFieldValue(fieldId, value);
      addMessage(`✅ Autofilled "${field.label}" with suggested value.`, false);
      updateTaxComparison();
    }
  };

  /**
   * Handle explain from tooltip
   */
  const handleTooltipExplain = async (fieldId) => {
    setIsOpen(true);
    setActiveTab('chat');
    
    const field = fieldDataManager.getField(fieldId);
    if (field) {
      setIsTyping(true);
      const context = { field_context: field };
      const response = await aiService.explainField(context);
      setIsTyping(false);
      addMessage(response.message, false);
    }
  };

  /**
   * Handle regime selection
   */
  const handleRegimeSelect = (regime) => {
    fieldDataManager.setTaxRegime(regime);
    addMessage(`✅ Tax regime set to ${regime === 'old' ? 'Old' : 'New'} regime.`, false);
    updateTaxComparison();
  };

  /**
   * Drag handlers
   */
  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const rect = chatRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && chatRef.current) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const maxX = Math.max(0, window.innerWidth - 430);
      const maxY = Math.max(0, window.innerHeight - 600);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  /**
   * Auto-scroll to bottom
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Clear session data
   */
  const handleEndSession = () => {
    if (confirm('Are you sure you want to end the session? All data will be cleared.')) {
      fieldDataManager.clearAll();
      setMessages([
        {
          id: 1,
          text: "Session ended. All data cleared for privacy.",
          isUser: false,
        },
      ]);
      setTaxComparison(null);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Tooltip for active field */}
      <AnimatePresence>
        {activeField && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Tooltip
              field={activeField}
              position={tooltipPosition}
              onAutofill={handleTooltipAutofill}
              onExplain={handleTooltipExplain}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl z-[9999] hover:from-blue-700 hover:to-blue-800 transition-all neumorphic-button group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">💬</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {messages.filter(m => !m.isUser).length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              zIndex: 9999,
            }}
            className={`w-[420px] h-[580px] rounded-2xl shadow-2xl flex flex-col neumorphic ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            } ${isDragging ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
          >
            {/* Header */}
            <div
              className={`drag-handle flex items-center justify-between p-4 rounded-t-2xl select-none cursor-grab ${
                darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="bg-white text-blue-600 rounded-full w-10 h-10 flex items-center justify-center shadow-md neumorphic">
                  🇮🇳
                </div>
                <div>
                  <h2 className="font-bold text-lg">TaxEase AI</h2>
                  <div className="text-xs opacity-90">{connectionStatus}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-medium">
                  🔒 Private
                </span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full hover:bg-opacity-20 hover:bg-white transition-all"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-opacity-20 hover:bg-white transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className={`flex border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              {[
                { id: 'chat', label: '💬 Chat', icon: '💬' },
                { id: 'upload', label: '📄 Upload', icon: '📄' },
                { id: 'comparison', label: '💰 Tax', icon: '💰' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? darkMode
                        ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                        : 'bg-white text-blue-600 border-b-2 border-blue-600'
                      : darkMode
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.icon} {tab.label.split(' ')[1]}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col">
                  <div
                    className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${
                      darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'
                    }`}
                  >
                    {messages.map((message) => (
                      <ChatBubble
                        key={message.id}
                        message={message.text}
                        isUser={message.isUser}
                      />
                    ))}
                    {isTyping && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md neumorphic">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                    <div className="flex space-x-2 mb-2">
                      <button
                        onClick={() => addMessage('Explain the current field', true) && handleSend()}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Explain field
                      </button>
                      <button
                        onClick={handleEndSession}
                        className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                      >
                        End Session
                      </button>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about tax filing..."
                        className={`flex-1 rounded-l-xl p-3 text-sm focus:outline-none ${
                          darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                        }`}
                      />
                      <button
                        onClick={handleSend}
                        disabled={inputValue.trim() === ''}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-r-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all"
                      >
                        📤
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className={`h-full overflow-y-auto p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <DocumentUpload
                    onUpload={handleDocumentUpload}
                    isLoading={isUploadingDoc}
                  />
                </div>
              )}

              {/* Tax Comparison Tab */}
              {activeTab === 'comparison' && (
                <div className={`h-full overflow-y-auto p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <TaxComparisonCard
                    comparison={taxComparison}
                    onRegimeSelect={handleRegimeSelect}
                  />
                  
                  <div className="text-xs text-center text-gray-500 mt-4">
                    Tax calculation updates automatically as you fill forms
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatOverlay;
