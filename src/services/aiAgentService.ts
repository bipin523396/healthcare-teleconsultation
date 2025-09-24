const API_BASE_URL = 'http://localhost:5000/api';

export interface AIResponse {
  status: 'success' | 'error';
  response?: string;
  message?: string;
  timestamp?: string;
}

export interface VoiceRecognitionResponse {
  status: 'success' | 'error';
  text?: string;
  message?: string;
  timestamp?: string;
}

export interface ImageAnalysisResponse {
  status: 'success' | 'error';
  analysis?: string;
  message?: string;
  timestamp?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  service?: string;
  version?: string;
  timestamp?: string;
  message?: string;
}

export const sendMessage = async (message: string): Promise<AIResponse> => {
  try {
    console.log('Sending message to AI:', message);
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error from AI service:', data);
      return {
        status: 'error',
        message: data.message || 'Failed to get response from AI service',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      status: 'success',
      response: data.response,
      timestamp: data.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error sending message to AI:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to connect to AI service',
      timestamp: new Date().toISOString()
    };
  }
};

export const recognizeSpeech = async (audioBlob: Blob): Promise<VoiceRecognitionResponse> => {
  try {
    console.log('Starting voice recognition...');
    
    // Basic validation
    if (!audioBlob || !(audioBlob instanceof Blob)) {
      console.error('Invalid audio blob provided');
      throw new Error('Invalid audio data');
    }
    
    console.log('Audio blob details:', {
      size: audioBlob.size,
      type: audioBlob.type,
    });
    
    const formData = new FormData();
    const fileName = `recording_${Date.now()}.wav`;
    formData.append('audio', audioBlob, fileName);
    
    console.log('Sending request to:', `${API_BASE_URL}/voice/recognize`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}/voice/recognize`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let the browser set it with the correct boundary
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      
      // First, try to parse as JSON
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('Failed to parse JSON response:', text);
        throw new Error(`Invalid response from server: ${text.substring(0, 200)}`);
      }
      
      if (!response.ok) {
        console.error('Error response from server:', data);
        throw new Error(data.message || `Server returned ${response.status}`);
      }
      
      console.log('Recognition successful:', { textLength: data.text?.length });
      
      return {
        status: 'success',
        text: data.text || '',
        timestamp: data.timestamp || new Date().toISOString()
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      const fetchError = error as Error;
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw fetchError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in recognizeSpeech:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      status: 'error',
      message: errorMessage.includes('Failed to fetch') 
        ? 'Could not connect to the server. Please check your connection.'
        : errorMessage || 'Failed to recognize speech',
      timestamp: new Date().toISOString()
    };
  }
};

export const analyzeImage = async (imageFile: File): Promise<ImageAnalysisResponse> => {
  try {
    console.log('Sending image for analysis...');
    const formData = new FormData();
    formData.append('image', imageFile, `image_${Date.now()}.jpg`);
    
    const response = await fetch(`${API_BASE_URL}/vision/analyze`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error from image analysis service:', data);
      return {
        status: 'error',
        message: data.message || 'Failed to analyze image',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      status: 'success',
      analysis: data.analysis,
      timestamp: data.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to analyze image',
      timestamp: new Date().toISOString()
    };
  }
};

export const checkBackendHealth = async (): Promise<HealthCheckResponse> => {
  try {
    console.log('Checking backend health...');
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Backend health check failed:', data);
      return {
        status: 'error',
        message: data.message || 'Backend health check failed',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      status: 'ok',
      service: data.service,
      version: data.version,
      timestamp: data.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Backend health check failed:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to connect to backend',
      timestamp: new Date().toISOString()
    };
  }
};
