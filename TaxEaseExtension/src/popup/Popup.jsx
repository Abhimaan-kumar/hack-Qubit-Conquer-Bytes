import React, { useState } from 'react';
import ChatBubble from '../components/ChatBubble';
import PrivacyNotice from '../components/PrivacyNotice';

const Popup = () => {
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleStartAssistant = () => {
    setIsAssistantActive(true);
    setConnectionStatus('Connected');
  };

  const handleStopAssistant = () => {
    setIsAssistantActive(false);
    setConnectionStatus('Disconnected');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileUploaded(true);
      // Mock file processing
      console.log('File uploaded:', file.name);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-white neumorphic-inset">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg shadow-lg">
        <div className="flex items-center">
          <div className="bg-white text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3 shadow-md neumorphic">
            🇮🇳
          </div>
          <h1 className="text-xl font-bold">TaxEase AI Assistant</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="mb-6 neumorphic p-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-800">Assistant Controls</h2>
          <div className="flex space-x-3">
            <button
              onClick={handleStartAssistant}
              className="neumorphic-button bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex-1 font-medium transition-all"
            >
              ▶️ Start Assistant
            </button>
            <button
              onClick={handleStopAssistant}
              className="neumorphic-button bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex-1 font-medium transition-all"
            >
              ⏹️ Stop Assistant
            </button>
          </div>
        </div>

        <div className="mb-6 neumorphic p-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-800">Document Upload</h2>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50 hover:bg-blue-100 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.json"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium text-lg"
            >
              📎 Upload Form-16 / Payslip
            </label>
            {fileUploaded && (
              <p className="mt-3 text-green-600 text-sm font-medium">
                ✅ File uploaded successfully!
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 neumorphic p-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-800">Connection Status</h2>
          <div className="flex items-center">
            <div
              className={`w-4 h-4 rounded-full mr-3 shadow-md ${
                connectionStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <span className="font-medium">{connectionStatus}</span>
          </div>
        </div>

        <div className="mb-6 neumorphic p-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-800">Demo Chat</h2>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 h-40 overflow-y-auto custom-scrollbar neumorphic-inset">
            <ChatBubble
              message="Hello! I'm your TaxEase AI Assistant. How can I help you today?"
              isUser={false}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 text-center text-sm text-gray-600 border-t shadow-inner">
        <PrivacyNotice />
      </div>
    </div>
  );
};

export default Popup;