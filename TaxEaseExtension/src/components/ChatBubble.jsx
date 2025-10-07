import React from 'react';

const ChatBubble = ({ message, isUser }) => {
  return (
    <div
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md ${
          isUser
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md neumorphic-button'
            : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-bl-md neumorphic'
        }`}
      >
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

export default ChatBubble;