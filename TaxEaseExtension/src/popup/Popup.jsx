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
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center">
          <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2">
            🇮🇳
          </div>
          <h1 className="text-lg font-bold">TaxEase AI Assistant</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-md font-semibold mb-2">Assistant Controls</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleStartAssistant}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex-1 transition-colors"
            >
              Start Assistant
            </button>
            <button
              onClick={handleStopAssistant}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex-1 transition-colors"
            >
              Stop Assistant
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-md font-semibold mb-2">Document Upload</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.json"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-800"
            >
              Upload Form-16 / Payslip
            </label>
            {fileUploaded && (
              <p className="mt-2 text-green-600 text-sm">
                File uploaded successfully!
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-md font-semibold mb-2">Connection Status</h2>
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                connectionStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <span>{connectionStatus}</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-md font-semibold mb-2">Demo Chat</h2>
          <div className="bg-gray-100 rounded-lg p-3 h-40 overflow-y-auto">
            <ChatBubble
              message="Hello! I'm your TaxEase AI Assistant. How can I help you today?"
              isUser={false}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 p-3 text-center text-sm text-gray-600 border-t">
        <PrivacyNotice />
      </div>
    </div>
  );
};

export default Popup;