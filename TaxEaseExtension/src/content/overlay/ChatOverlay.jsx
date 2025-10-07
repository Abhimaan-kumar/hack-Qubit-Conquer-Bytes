import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../../components/ChatBubble';
import DraggableWrapper from './DraggableWrapper';
import storageService from '../../services/storageService';
import { io } from 'socket.io-client';

/**
 * Enhanced ChatOverlay Component
 * Features:
 * - Draggable and resizable
 * - Persistent position, size, and state
 * - Minimize/maximize with smooth animations
 * - No auto-close on outside click
 * - Session persistence across page navigation
 */
const ChatOverlay = () => {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your TaxEase AI Assistant. How can I help you with your tax filing today?",
      isUser: false,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  // Position and Size
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 450, 
    y: window.innerHeight - 650 
  });
  const [size, setSize] = useState({ 
    width: 400, 
    height: 600 
  });

  // Refs
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load saved state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        // Load position
        const savedPosition = await storageService.getOverlayPosition();
        if (savedPosition) {
          // Ensure position is within viewport
          const maxX = Math.max(0, window.innerWidth - 400);
          const maxY = Math.max(0, window.innerHeight - 600);
          setPosition({
            x: Math.max(0, Math.min(savedPosition.x, maxX)),
            y: Math.max(0, Math.min(savedPosition.y, maxY)),
          });
        }

        // Load size
        const savedSize = await storageService.getOverlaySize();
        if (savedSize) {
          setSize(savedSize);
        }

        // Load open state
        const savedIsOpen = await storageService.getIsOpen();
        setIsOpen(savedIsOpen);

        // Load minimized state
        const savedIsMinimized = await storageService.getIsMinimized();
        setIsMinimized(savedIsMinimized);

        // Load dark mode
        const savedDarkMode = await storageService.getDarkMode();
        setDarkMode(savedDarkMode);

        // Load messages
        const savedMessages = await storageService.getMessages();
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages);
        }

        // Load or create session ID
        let sessionId = await storageService.getSessionId();
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await storageService.saveSessionId(sessionId);
        }
        sessionIdRef.current = sessionId;
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    };

    loadSavedState();
  }, []);

  // Save state when it changes
  useEffect(() => {
    storageService.saveOverlayPosition(position);
  }, [position]);

  useEffect(() => {
    storageService.saveOverlaySize(size);
  }, [size]);

  useEffect(() => {
    storageService.saveIsOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    storageService.saveIsMinimized(isMinimized);
  }, [isMinimized]);

  useEffect(() => {
    storageService.saveDarkMode(darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (messages.length > 1) { // Don't save just the welcome message
      storageService.saveMessages(messages);
    }
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    if (!io) {
      console.warn('Socket.io not available, running in offline mode');
      setConnectionStatus('Offline Mode');
      return;
    }

    try {
      // Connect to your socket.io server
      socketRef.current = io('http://localhost:3001', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on('connect', () => {
        console.log('[TaxEase] Connected to server');
        setConnectionStatus('Connected');
        
        // Send session ID to server
        if (sessionIdRef.current) {
          socketRef.current.emit('session-init', {
            sessionId: sessionIdRef.current,
          });
        }
      });

      socketRef.current.on('ai-response', (data) => {
        setIsTyping(false);
        const aiResponse = {
          id: Date.now(),
          text: data.message,
          isUser: false,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      });

      socketRef.current.on('file-processed', (data) => {
        setIsTyping(false);
        const fileResponse = {
          id: Date.now(),
          text: `📄 ${data.summary}`,
          isUser: false,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fileResponse]);
      });

      socketRef.current.on('disconnect', () => {
        console.log('[TaxEase] Disconnected from server');
        setConnectionStatus('Disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('[TaxEase] Socket connection error:', error);
        setConnectionStatus('Connection Error');
      });

      socketRef.current.on('reconnecting', (attemptNumber) => {
        setConnectionStatus(`Reconnecting... (${attemptNumber})`);
      });
    } catch (error) {
      console.error('[TaxEase] Failed to initialize socket connection:', error);
      setConnectionStatus('Socket Error');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Toggle chat overlay
  const toggleChat = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      setIsMinimized(false);
    }
  };

  // Toggle minimize
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Handle sending messages
  const handleSend = () => {
    if (inputValue.trim() === '') return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Send message via socket.io
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('user-message', {
          sessionId: sessionIdRef.current,
          message: inputValue,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Fallback response
        setTimeout(() => {
          const fallbackResponse = {
            id: Date.now(),
            text: "I'm currently offline. Please check your connection and try again.",
            isUser: false,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, fallbackResponse]);
          setIsTyping(false);
        }, 1000);
      }
    } catch (error) {
      console.error('[TaxEase] Error sending message:', error);
      setIsTyping(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsTyping(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('file-upload', {
              sessionId: sessionIdRef.current,
              fileName: file.name,
              fileData: event.target.result,
              fileType: file.type,
              timestamp: new Date().toISOString(),
            });
          } else {
            setTimeout(() => {
              const fallbackResponse = {
                id: Date.now(),
                text: `📄 File "${file.name}" uploaded successfully! Processing is currently offline.`,
                isUser: false,
                timestamp: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, fallbackResponse]);
              setIsTyping(false);
            }, 1500);
          }
        } catch (error) {
          console.error('[TaxEase] Error processing file:', error);
          setIsTyping(false);
        }
      };
      reader.onerror = () => {
        console.error('[TaxEase] Error reading file');
        setIsTyping(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      text: "Hello! I'm your TaxEase AI Assistant. How can I help you with your tax filing today?",
      isUser: false,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  };

  // End session
  const handleEndSession = async () => {
    handleClearChat();
    setIsOpen(false);
    await storageService.clearAll();
    // Generate new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionIdRef.current = newSessionId;
    await storageService.saveSessionId(newSessionId);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Assistant Button (shown when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleChat}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              zIndex: 2147483646,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
            aria-label="Open TaxEase Assistant"
          >
            💬
            {/* Pulse animation */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                zIndex: -1,
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Overlay (shown when open) */}
      <AnimatePresence>
        {isOpen && (
          <DraggableWrapper
            position={position}
            onPositionChange={setPosition}
            size={size}
            onSizeChange={setSize}
            isMinimized={isMinimized}
            isDraggingState={isDragging}
            onDraggingChange={setIsDragging}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2), 0 12px 24px rgba(0, 0, 0, 0.15)',
                background: darkMode ? '#1f2937' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div
                className="drag-handle"
                style={{
                  padding: '16px',
                  background: darkMode 
                    ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    🇮🇳
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                      TaxEase AI Assistant
                    </h2>
                    <p style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>
                      {connectionStatus}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      background: '#10b981',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: '600',
                    }}
                  >
                    🔒 Privacy ON
                  </span>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                    }}
                    title={darkMode ? 'Light mode' : 'Dark mode'}
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                  <button
                    onClick={toggleMinimize}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                    }}
                    title={isMinimized ? 'Maximize' : 'Minimize'}
                  >
                    {isMinimized ? '🔼' : '🔽'}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Messages Area (hidden when minimized) */}
              {!isMinimized && (
                <>
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '16px',
                      background: darkMode 
                        ? 'linear-gradient(to bottom, #111827, #1f2937)'
                        : 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
                    }}
                    className="custom-scrollbar"
                  >
                    {messages.map((message) => (
                      <ChatBubble
                        key={message.id}
                        message={message.text}
                        isUser={message.isUser}
                      />
                    ))}
                    {isTyping && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                        <div
                          style={{
                            background: darkMode ? '#374151' : '#e5e7eb',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            borderBottomLeftRadius: '4px',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: darkMode ? '#9ca3af' : '#6b7280',
                                animation: 'bounce 1.4s infinite',
                              }}
                            />
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: darkMode ? '#9ca3af' : '#6b7280',
                                animation: 'bounce 1.4s infinite 0.2s',
                              }}
                            />
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: darkMode ? '#9ca3af' : '#6b7280',
                                animation: 'bounce 1.4s infinite 0.4s',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Controls */}
                  <div
                    style={{
                      padding: '12px',
                      background: darkMode ? '#374151' : '#f3f4f6',
                      borderTop: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <label
                        htmlFor="file-upload-taxease"
                        style={{
                          cursor: 'pointer',
                          color: '#667eea',
                          fontWeight: '500',
                        }}
                      >
                        📄 Upload Form-16
                      </label>
                      <input
                        type="file"
                        id="file-upload-taxease"
                        style={{ display: 'none' }}
                        accept=".pdf,.txt,.json"
                        onChange={handleFileUpload}
                      />
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={handleClearChat}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: darkMode ? '#9ca3af' : '#6b7280',
                            fontSize: '12px',
                          }}
                        >
                          🗑️ Clear
                        </button>
                        <button
                          onClick={handleEndSession}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            fontSize: '12px',
                          }}
                        >
                          🚪 End Session
                        </button>
                      </div>
                    </div>

                    {/* Input */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your tax query..."
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '12px',
                          border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                          background: darkMode ? '#1f2937' : 'white',
                          color: darkMode ? 'white' : '#111827',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={inputValue.trim() === ''}
                        style={{
                          padding: '12px 24px',
                          borderRadius: '12px',
                          border: 'none',
                          background: inputValue.trim() === ''
                            ? darkMode ? '#4b5563' : '#d1d5db'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          cursor: inputValue.trim() === '' ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                        }}
                      >
                        📤
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </DraggableWrapper>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }

        .taxease-resize-handle:hover {
          opacity: 1 !important;
          transform: scale(1.2);
        }
      `}</style>
    </>
  );
};

export default ChatOverlay;
