import React, { useRef, useState, useCallback } from 'react';
import { useAIAgent } from '../hooks/useAIAgent';
import { Mic, Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import './AIAgentPanel.css';

const AIAgentPanel: React.FC = () => {
  const {
    messages,
    isLoading,
    isBackendAvailable,
    error,
    sendMessage,
    processVoiceInput,
    processImage,
    clearConversation,
  } = useAIAgent();

  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle sending a text message
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;
    
    await sendMessage(inputMessage);
    setInputMessage('');
    scrollToBottom();
  }, [inputMessage, sendMessage, scrollToBottom]);

  // Handle key press in input (Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start/stop voice recording
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && audioChunksRef.current.length > 0) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        scrollToBottom();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      // Handle error - maybe show a message to the user
    }
  }, [isRecording, processVoiceInput, scrollToBottom]);

  // Handle image upload
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      // Show error to user
      return;
    }

    await processImage(file);
    scrollToBottom();
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processImage, scrollToBottom]);

  // Auto-scroll when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Clean up media recorder on unmount
  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="ai-agent-panel">
      <div className="ai-agent-header">
        <h3>AI Assistant</h3>
        <div className="ai-agent-actions">
          <button 
            onClick={clearConversation}
            className="clear-button"
            disabled={messages.length === 0}
            aria-label="Clear conversation"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="ai-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>How can I help you today?</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender} ${message.error ? 'error' : ''}`}
            >
              {message.type === 'image' && message.data?.imageUrl && (
                <div className="message-image">
                  <img 
                    src={message.data.imageUrl} 
                    alt={message.data.fileName || 'Uploaded content'}
                    className="uploaded-image"
                  />
                </div>
              )}
              <div className="message-content">
                {message.content}
                {message.error && <span className="error-indicator">!</span>}
              </div>
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="ai-input-container">
        <div className="input-actions">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="icon-button"
            aria-label="Upload image"
            disabled={isLoading}
          >
            <ImageIcon size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            onClick={toggleRecording}
            className={`icon-button ${isRecording ? 'recording' : ''}`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            disabled={isLoading}
          >
            {isRecording ? (
              <div className="pulse-animation">
                <Mic size={20} />
              </div>
            ) : (
              <Mic size={20} />
            )}
          </button>
        </div>
        
        <div className="message-input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={1}
            aria-label="Type your message"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPanel;
