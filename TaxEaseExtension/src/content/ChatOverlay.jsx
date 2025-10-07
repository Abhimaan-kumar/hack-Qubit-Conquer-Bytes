import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/ChatBubble';
import Tooltip from '../components/Tooltip';

// Import socket.io-client
import { io } from 'socket.io-client';

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
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 550 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const socketRef = useRef(null);
  const chatRef = useRef(null);

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

    // Send message via socket.io
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('user-message', {
          message: inputValue,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Fallback: simulate response if no socket connection
        setTimeout(() => {
          const fallbackResponse = {
            id: messages.length + 1,
            text: "I'm currently offline. Please check your connection and try again.",
            isUser: false,
          };
          setMessages((prev) => [...prev, fallbackResponse]);
          setIsTyping(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsTyping(true);
      
      try {
        // Send file via socket.io
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('file-upload', {
                fileName: file.name,
                fileData: event.target.result,
                fileType: file.type,
                timestamp: new Date().toISOString(),
              });
            } else {
              // Fallback: simulate file processing if no socket connection
              setTimeout(() => {
                const fallbackResponse = {
                  id: messages.length + 1,
                  text: "📄 File uploaded successfully! Processing is currently offline.",
                  isUser: false,
                };
                setMessages((prev) => [...prev, fallbackResponse]);
                setIsTyping(false);
              }, 1500);
            }
          } catch (error) {
            console.error('Error processing file:', error);
            setIsTyping(false);
          }
        };
        reader.onerror = () => {
          console.error('Error reading file');
          setIsTyping(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error handling file upload:', error);
        setIsTyping(false);
      }
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

  // Initialize socket connection
  useEffect(() => {
    if (!io) {
      console.warn('Socket.io not available, running in offline mode');
      setConnectionStatus('Offline Mode');
      return;
    }

    try {
      // Connect to your socket.io server
      socketRef.current = io('http://localhost:3001'); // Change this to your server URL

      socketRef.current.on('connect', () => {
        console.log('Connected to server');
        setConnectionStatus('Connected');
      });

      socketRef.current.on('ai-response', (data) => {
        setIsTyping(false);
        const aiResponse = {
          id: messages.length + 1,
          text: data.message,
          isUser: false,
        };
        setMessages((prev) => [...prev, aiResponse]);
      });

      socketRef.current.on('file-processed', (data) => {
        setIsTyping(false);
        const fileResponse = {
          id: messages.length + 1,
          text: `📄 ${data.summary}`,
          isUser: false,
        };
        setMessages((prev) => [...prev, fileResponse]);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnectionStatus('Disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionStatus('Connection Error');
      });
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      setConnectionStatus('Socket Error');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Drag functionality
  const handleMouseDown = (e) => {
    try {
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
    } catch (error) {
      console.error('Error in handleMouseDown:', error);
      setIsDragging(false);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && chatRef.current) {
      try {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep chat within viewport bounds
        const maxX = Math.max(0, window.innerWidth - 400);
        const maxY = Math.max(0, window.innerHeight - 520);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      } catch (error) {
        console.error('Error in handleMouseMove:', error);
        setIsDragging(false);
      }
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
            className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl z-50 hover:from-blue-700 hover:to-blue-800 transition-all neumorphic-button"
          >
            💬
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              zIndex: 50,
            }}
            className={`w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col neumorphic cursor-move ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
          >
            {/* Chat header */}
            <div
              className={`drag-handle flex items-center justify-between p-4 rounded-t-2xl select-none ${
                darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              }`}
            >
              <div className="flex items-center">
                <div className="bg-white text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3 shadow-md neumorphic">
                  🇮🇳
                </div>
                <h2 className="font-bold text-lg">TaxEase AI Assistant</h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-medium shadow-md">
                  🔒 Privacy Mode ON
                </span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full hover:bg-opacity-20 hover:bg-white transition-all neumorphic-button"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-opacity-20 hover:bg-white transition-all neumorphic-button"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'} neumorphic-inset`}>
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
            </div>

            {/* File upload and controls */}
            <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'} neumorphic-inset`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  <input
                    type="file"
                    id="file-upload-overlay"
                    className="hidden"
                    accept=".txt,.json"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="file-upload-overlay"
                    className="cursor-pointer hover:text-blue-600 font-medium transition-colors"
                  >
                    📄 Upload Form-16
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleClearChat}
                    className="text-sm px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors neumorphic-button"
                  >
                    🗑️ Clear
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="text-sm px-3 py-1 rounded-lg hover:bg-red-200 transition-colors neumorphic-button"
                  >
                    🚪 End Session
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
                  className={`flex-1 rounded-l-xl p-3 text-sm focus:outline-none neumorphic-inset ${
                    darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                  }`}
                />
                <button
                  onClick={handleSend}
                  disabled={inputValue.trim() === ''}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-r-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all neumorphic-button"
                >
                  📤 Send
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