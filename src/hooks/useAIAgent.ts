import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  sendMessage, 
  recognizeSpeech, 
  analyzeImage, 
  checkBackendHealth
} from '../services/aiAgentService';

export interface AIMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  error?: boolean;
  type?: 'text' | 'image' | 'voice';
  data?: any;
}

export const useAIAgent = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const healthCheckInterval = useRef<NodeJS.Timeout>();
  
  // Check backend health on mount and periodically
  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log('Checking backend health...');
        const health = await checkBackendHealth();
        console.log('Backend health:', health);
        
        const isAvailable = health.status === 'ok';
        setIsBackendAvailable(isAvailable);
        
        if (!isAvailable) {
          setError(health.message || 'AI service is currently unavailable. Please try again later.');
        } else {
          setError(null);
        }
        
        return isAvailable;
      } catch (err) {
        console.error('Failed to connect to AI backend:', err);
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        setIsBackendAvailable(false);
        setError(`Failed to connect to AI backend: ${errorMessage}`);
        return false;
      }
    };

    // Initial check
    checkBackend();
    
    // Set up periodic health check (every 5 minutes)
    healthCheckInterval.current = setInterval(checkBackend, 5 * 60 * 1000);
    
    // Cleanup interval on unmount
    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
    };
  }, []);

  const addMessage = useCallback((content: string, sender: 'user' | 'ai' = 'user', options: {
    error?: boolean;
    type?: 'text' | 'image' | 'voice';
    data?: any;
  } = {}) => {
    const { error = false, type = 'text', data } = options;
    
    const newMessage: AIMessage = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      error,
      type,
      data
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessageToAI = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Check backend health first
    const isAvailable = isBackendAvailable;
    if (isAvailable === false) {
      addMessage('The AI service is currently unavailable. Please try again later.', 'ai', { error: true });
      return;
    }

    // Add user message
    addMessage(message, 'user');
    setIsLoading(true);
    setError(null);

    try {
      // Send to AI backend
      const response = await sendMessage(message);
      
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to get response from AI');
      }

      // Add AI response
      addMessage(response.response || 'I received your message but have no response.', 'ai');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Error sending message:', errorMessage);
      addMessage('Sorry, I encountered an error processing your request.', 'ai', { error: true });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const processVoiceInput = useCallback(async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, add a temporary message to show we're processing
      const processingMessage = addMessage('Processing your voice message...', 'ai', { type: 'voice' });
      
      // Send the audio to the server for recognition
      const result = await recognizeSpeech(audioBlob);
      
      if (result.status === 'error') {
        throw new Error(result.message || 'Failed to recognize speech');
      }
      
      if (!result.text) {
        throw new Error('No text recognized in the audio');
      }
      
      // Update the processing message with the recognized text
      setMessages(prev => prev.map(msg => 
        msg.id === processingMessage.id 
          ? { ...msg, content: `You said: ${result.text}`, data: { ...msg.data, recognizedText: result.text } } 
          : msg
      ));
      
      // Send the recognized text to the AI
      await sendMessageToAI(result.text);
      
      return result.text;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process voice input';
      console.error('Voice recognition error:', errorMessage);
      
      // Update any processing message with the error
      setMessages(prev => prev.map(msg => 
        msg.content === 'Processing your voice message...' 
          ? { ...msg, content: 'Sorry, I had trouble understanding your voice. Could you please type your message?', error: true }
          : msg
      ));
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sendMessageToAI, addMessage]);

  const processImage = useCallback(async (imageFile: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, create a URL for the image to display it
      const imageUrl = URL.createObjectURL(imageFile);
      
      // Add the image to the chat
      addMessage('', 'user', { 
        type: 'image', 
        data: { imageUrl, fileName: imageFile.name } 
      });
      
      // Add a processing message
      const processingMessage = addMessage('Analyzing the image...', 'ai');
      
      // Send the image to the server for analysis
      const result = await analyzeImage(imageFile);
      
      if (result.status === 'error') {
        throw new Error(result.message || 'Failed to analyze image');
      }
      
      // Update the processing message with the analysis
      setMessages(prev => prev.map(msg => 
        msg.id === processingMessage.id 
          ? { 
              ...msg, 
              content: result.analysis || 'I analyzed the image but have no specific information about it.',
              data: { ...msg.data, analysis: result.analysis }
            } 
          : msg
      ));
      
      return result.analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      console.error('Image analysis error:', errorMessage);
      
      // Update any processing message with the error
      setMessages(prev => prev.map(msg => 
        msg.content === 'Analyzing the image...' 
          ? { ...msg, content: 'Sorry, I had trouble analyzing the image.', error: true }
          : msg
      ));
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const clearConversation = useCallback(() => {
    setMessages(prev => {
      // Clean up any object URLs we created for images
      prev.forEach(msg => {
        if (msg.type === 'image' && msg.data?.imageUrl) {
          URL.revokeObjectURL(msg.data.imageUrl);
        }
      });
      return [];
    });
    setError(null);
  }, []);

  // Clean up object URLs when the component unmounts
  useEffect(() => {
    return () => {
      messages.forEach(msg => {
        if (msg.type === 'image' && msg.data?.imageUrl) {
          URL.revokeObjectURL(msg.data.imageUrl);
        }
      });
    };
  }, [messages]);

  return {
    messages,
    isLoading,
    isBackendAvailable,
    error,
    sendMessage: sendMessageToAI,
    processVoiceInput,
    processImage,
    clearConversation,
    addMessage, // Expose addMessage for external use if needed
  };
};
