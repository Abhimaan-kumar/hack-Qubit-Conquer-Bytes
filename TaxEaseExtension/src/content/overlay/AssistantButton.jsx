import React from 'react';
import { motion } from 'framer-motion';

/**
 * Floating Assistant Button Component
 * Appears when chat overlay is closed
 */
const AssistantButton = ({ onClick, unreadCount = 0 }) => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="taxease-assistant-button"
      aria-label="Open TaxEase Assistant"
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
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4), 0 4px 16px rgba(118, 75, 162, 0.3)',
        zIndex: 2147483646, // Very high z-index to stay on top
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: '32px', lineHeight: 1 }}>💬</span>
      
      {/* Unread badge */}
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="taxease-unread-badge"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}
      
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
  );
};

export default AssistantButton;
