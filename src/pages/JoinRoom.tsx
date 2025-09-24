import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as faceapi from 'face-api.js';

interface UserData {
  name: string;
  roomId: string;
  faceDescriptor: Float32Array;
}

const JoinRoom: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [message, setMessage] = useState('');
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
        ]);
        setIsModelLoading(false);
        startVideo();
      } catch (error) {
        console.error('Error loading models:', error);
        setMessage('Error loading face recognition models');
      }
    };

    loadModels();

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      stopVideo();
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setMessage('Could not access camera. Please check permissions.');
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleRegisterFace = async () => {
    if (!name.trim() || !roomId.trim()) {
      setMessage('Please enter your name and room ID');
      return;
    }

    setIsRegistering(true);
    setMessage('Position your face in the frame...');

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setMessage('No face detected. Please try again.');
        setIsRegistering(false);
        return;
      }

      // Store user data with face descriptor
      const userData: UserData = {
        name,
        roomId,
        faceDescriptor: detections[0].descriptor
      };

      localStorage.setItem('userFaceData', JSON.stringify(Array.from(userData.faceDescriptor)));
      localStorage.setItem('userInfo', JSON.stringify({ name, roomId }));
      
      setMessage('Face registered successfully!');
      navigate(`/call/${roomId}`, { state: { name } });
    } catch (error) {
      console.error('Error registering face:', error);
      setMessage('Error registering face. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRecognizeFace = async () => {
    setIsRecognizing(true);
    setMessage('Recognizing face...');

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setMessage('No face detected. Please try again.');
        setIsRecognizing(false);
        return;
      }

      const storedUserInfo = localStorage.getItem('userInfo');
      const storedFaceData = localStorage.getItem('userFaceData');

      if (!storedUserInfo || !storedFaceData) {
        setMessage('No registered user found. Please register first.');
        setIsRecognizing(false);
        return;
      }

      const userInfo = JSON.parse(storedUserInfo);
      const storedDescriptor = new Float32Array(JSON.parse(storedFaceData));
      const faceMatcher = new faceapi.FaceMatcher([
        new faceapi.LabeledFaceDescriptors(userInfo.name, [storedDescriptor])
      ]);

      const results = detections.map(d => 
        faceMatcher.findBestMatch(d.descriptor)
      );

      if (results[0].label !== 'unknown' && results[0].distance < 0.6) {
        setMessage(`Welcome back, ${userInfo.name}!`);
        navigate(`/call/${userInfo.roomId}`, { state: { name: userInfo.name } });
      } else {
        setMessage('Face not recognized. Please register first.');
      }
    } catch (error) {
      console.error('Error recognizing face:', error);
      setMessage('Error recognizing face. Please try again.');
    } finally {
      setIsRecognizing(false);
    }
  };

  if (isModelLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
        <div className="text-lg">Loading face recognition models...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          {isRegistering ? 'Register Your Face' : 'Join Video Call'}
        </h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Video Feed */}
          <div className="w-full md:w-1/2">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-auto"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
            </div>
            {message && (
              <div className="mt-4 p-2 text-center text-sm text-blue-600">
                {message}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="w-full md:w-1/2 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
                disabled={isRegistering || isRecognizing}
                required
              />
            </div>
            
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
                Room ID
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter room ID"
                disabled={isRegistering || isRecognizing}
                required
              />
            </div>

            <div className="flex flex-col space-y-3 pt-4">
              <button
                type="button"
                onClick={handleRegisterFace}
                disabled={isRegistering || isRecognizing}
                className={`px-6 py-3 rounded-md font-medium text-white ${
                  isRegistering || isRecognizing
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRegistering ? 'Registering...' : 'Register Face & Join'}
              </button>
              
              <button
                type="button"
                onClick={handleRecognizeFace}
                disabled={isRegistering || isRecognizing}
                className={`px-6 py-3 rounded-md font-medium text-white ${
                  isRegistering || isRecognizing
                    ? 'bg-green-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRecognizing ? 'Recognizing...' : 'Recognize Face & Join'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
