import React from 'react';

const ChatBubble = ({ message, isUser }) => {
  return (
    <div
      className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

export default ChatBubble;