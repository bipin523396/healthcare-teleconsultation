import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Mic, AlertCircle, Trash2 } from 'lucide-react';

interface AIAgentBarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

// Mock responses for when the backend is unavailable
const mockResponses = [
  "I can help you schedule an appointment with a doctor.",
  "Your vital signs look normal based on your last check-up.",
  "I recommend drinking plenty of water and getting rest for those symptoms.",
  "Would you like me to show you some breathing exercises that might help?",
  "I can provide information about your medication schedule.",
  "Your insurance should cover that procedure, but I recommend verifying with your provider.",
  "Let me check your appointment history for you.",
  "I can help you find a specialist in your area.",
  "Your test results from last week look good. No concerning indicators.",
  "Would you like me to remind you about your upcoming appointments?"
];

const AIAgentBar: React.FC<AIAgentBarProps> = ({ isOpen = false, onToggle }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'ai', content: string}>>([{
    type: 'ai', content: 'Hello! I\'m your healthcare AI assistant. How can I help you today?'
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if backend is available on component mount and load chat history
  useEffect(() => {
    checkBackendAvailability();
    loadChatHistory();
  }, []);
  
  // Scroll to bottom of chat when history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkBackendAvailability = async () => {
    try {
      // Try to connect to the Synergy AI backend
      const response = await fetch('http://localhost:5001/api/health-check', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(2000)
      });
      setIsBackendAvailable(response.ok);
    } catch (error) {
      console.log('Synergy AI backend is not available:', error);
      setIsBackendAvailable(false);
    }
  };

  const loadChatHistory = async () => {
    if (!isBackendAvailable) return;
    
    try {
      const response = await fetch('http://localhost:5001/api/chat-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.history?.length > 0) {
          setChatHistory(data.history);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const clearChatHistory = async () => {
    if (!isBackendAvailable) {
      setChatHistory([{ type: 'ai', content: 'Hello! How can I help you today?' }]);
      return;
    }
    
    try {
      await fetch('http://localhost:5001/api/clear-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(3000)
      });
      setChatHistory([{ type: 'ai', content: 'Chat history cleared. How can I help you today?' }]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      setChatHistory([{ type: 'ai', content: 'Chat history cleared. How can I help you today?' }]);
    }
  };

  const getMockResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('appointment')) {
      return "I can help you schedule an appointment. What day works best for you?";
    } else if (lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
      return "Your medication schedule shows you should take your next dose at 8:00 PM.";
    } else if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
      return "I'm sorry to hear you're in pain. Have you taken any medication for it? If it persists, you should contact your doctor.";
    } else if (lowerMessage.includes('doctor')) {
      return "Dr. Smith is available next Tuesday. Would you like me to book an appointment?";
    } else {
      return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() === '') return;
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'user', content: message }]);
    
    // Set loading state
    setIsLoading(true);
    
    // Store the message before clearing the input
    const userMessage = message;
    setMessage('');
    
    if (!isBackendAvailable) {
      // Use mock response if backend is unavailable
      setTimeout(() => {
        const mockResponse = getMockResponse(userMessage);
        setChatHistory(prev => [...prev, { type: 'ai', content: mockResponse }]);
        setIsLoading(false);
      }, 1000);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5001/api/ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ message: userMessage }),
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.response || 'Sorry, I couldn\'t process your request.';
      
      setChatHistory(prev => [...prev, { type: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Error communicating with Synergy AI backend:', error);
      setIsBackendAvailable(false);
      const mockResponse = getMockResponse(userMessage);
      setChatHistory(prev => [...prev, { type: 'ai', content: mockResponse + ' (Offline Mode)' }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const startVoiceInput = async () => {
    setIsListening(true);
    
    if (!isBackendAvailable) {
      // Mock voice input if backend is unavailable
      setTimeout(() => {
        setMessage("How can I schedule an appointment?");
        setIsListening(false);
      }, 2000);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5001/api/voice-input', {
        method: 'POST',
        signal: AbortSignal.timeout(8000)
      });
      
      const data = await response.json();
      if (data.success && data.text) {
        setMessage(data.text);
      } else {
        setMessage("How can I schedule an appointment?");
      }
    } catch (error) {
      console.error('Error with voice input:', error);
      setIsBackendAvailable(false);
      setMessage("How can I schedule an appointment?");
    } finally {
      setIsListening(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-50 flex flex-col ${isOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Bot className="h-5 w-5 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        {!isBackendAvailable && (
          <div className="flex items-center text-amber-500 text-xs mr-2">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Offline Mode</span>
          </div>
        )}
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((chat, index) => (
          <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${chat.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {chat.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-800">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <div className="flex justify-between mb-2">
          <button 
            onClick={clearChatHistory} 
            className="flex items-center text-xs text-gray-500 hover:text-gray-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear History
          </button>
          {isBackendAvailable ? (
            <span className="text-xs text-green-500">Connected</span>
          ) : (
            <span className="text-xs text-amber-500">Offline Mode</span>
          )}
        </div>
        <div className="flex items-center">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={isListening}
          />
          <div className="flex flex-col">
            <button
              onClick={handleSendMessage}
              disabled={message.trim() === '' || isLoading}
              className="bg-blue-500 text-white p-2 rounded-tr-lg hover:bg-blue-600 disabled:bg-blue-300"
              title="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
            <button
              onClick={startVoiceInput}
              disabled={isListening}
              className={`p-2 rounded-br-lg ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              title="Voice input"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentBar;