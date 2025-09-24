import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, VideoOff, Phone, PhoneOff, MessageSquare, Users, Settings, Shield, X } from 'lucide-react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

interface TelehealthCallProps {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  isDoctor: boolean;
  appointmentTime: string;
  appointmentType: 'video' | 'audio';
  onEndCall: () => void;
}

// Create a socket connection to our signaling server
// In a production environment, this would be your actual server URL
const socket = io('http://localhost:5001');

const TelehealthCall: React.FC<TelehealthCallProps> = ({
  appointmentId,
  doctorId,
  patientId,
  isDoctor,
  appointmentTime,
  appointmentType,
  onEndCall
}) => {
  // State for call controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: string, text: string, timestamp: Date}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // WebRTC states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState<any>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  
  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Peer.Instance | null>(null);
  
  // Mock data for doctor/patient info
  const doctorInfo = {
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    imageUrl: 'https://randomuser.me/api/portraits/women/45.jpg'
  };
  
  const patientInfo = {
    name: 'John Smith',
    age: 42,
    imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  };
  
  // Timer for call duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isConnected) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);
  
  // Format elapsed time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Initialize WebRTC connection
  useEffect(() => {
    // Get user media (camera and microphone)
    const getMedia = async () => {
      try {
        console.log('Requesting media devices...');
        
        // Request access to camera and microphone
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: appointmentType === 'video',
          audio: true
        });
        
        setStream(mediaStream);
        
        // Display local video stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
        
        // Set up socket event listeners for signaling
        setupSocketListeners();
        
        // If doctor, create the room
        if (isDoctor) {
          console.log('Doctor creating room:', appointmentId);
          socket.emit('createRoom', { roomId: appointmentId });
          setIsWaiting(true);
        } else {
          // If patient, join the room
          console.log('Patient joining room:', appointmentId);
          socket.emit('joinRoom', { roomId: appointmentId });
          setIsWaiting(true);
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Failed to access camera or microphone. Please check your device permissions.');
      }
    };
    
    getMedia();
    
    // Cleanup function
    return () => {
      // Clean up media streams
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Clean up peer connection
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      
      // Disconnect from room
      socket.emit('leaveRoom', { roomId: appointmentId });
      socket.off();
    };
  }, [appointmentId, appointmentType, isDoctor]);
  
  // Set up socket event listeners for signaling
  const setupSocketListeners = () => {
    // When a user joins the room
    socket.on('userJoined', () => {
      console.log('User joined the room');
      setIsWaiting(false);
      
      // If doctor, initiate the call
      if (isDoctor && stream) {
        callUser();
      }
    });
    
    // When receiving a call
    socket.on('callUser', (data: { signal: any }) => {
      console.log('Receiving call...');
      setReceivingCall(true);
      setCallerSignal(data.signal);
      // Auto answer for simplicity
      answerCall();
    });
    
    // When call is accepted
    socket.on('callAccepted', (data: { signal: any }) => {
      console.log('Call accepted');
      setCallAccepted(true);
      setIsConnected(true);
      setIsWaiting(false);
      
      // Set up peer connection with the accepted signal
      if (connectionRef.current) {
        connectionRef.current.signal(data.signal);
      }
    });
    
    // When user leaves
    socket.on('userLeft', () => {
      console.log('User left the call');
      setIsConnected(false);
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      onEndCall();
    });
    
    // When receiving a chat message
    socket.on('receiveMessage', (data: { sender: string, text: string, timestamp: string }) => {
      const message = {
        sender: data.sender,
        text: data.text,
        timestamp: new Date(data.timestamp)
      };
      setMessages(prevMessages => [...prevMessages, message]);
    });
  };
  
  // Initiate a call to the other user
  const callUser = () => {
    console.log('Initiating call...');
    
    if (!stream) {
      console.error('No local stream available');
      return;
    }
    
    // Create a new peer connection as initiator
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });
    
    // When we have a signal to send
    peer.on('signal', (data) => {
      console.log('Sending signal to callee');
      socket.emit('callUser', {
        roomId: appointmentId,
        signalData: data
      });
    });
    
    // When we receive a remote stream
    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });
    
    // Handle connection errors
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      setError('Connection error. Please try again.');
    });
    
    // Save the peer connection reference
    connectionRef.current = peer;
  };
  
  // Answer an incoming call
  const answerCall = () => {
    console.log('Answering call...');
    
    if (!stream) {
      console.error('No local stream available');
      return;
    }
    
    setCallAccepted(true);
    setIsConnected(true);
    setIsWaiting(false);
    
    // Create a new peer connection as receiver
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });
    
    // When we have a signal to send back
    peer.on('signal', (data) => {
      console.log('Sending answer signal');
      socket.emit('answerCall', {
        roomId: appointmentId,
        signal: data
      });
    });
    
    // When we receive a remote stream
    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });
    
    // Handle connection errors
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      setError('Connection error. Please try again.');
    });
    
    // Signal with the caller's signal data
    if (callerSignal) {
      peer.signal(callerSignal);
    }
    
    // Save the peer connection reference
    connectionRef.current = peer;
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      console.log(`Microphone ${!isMuted ? 'muted' : 'unmuted'}`);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
      console.log(`Video ${!isVideoOff ? 'turned off' : 'turned on'}`);
    }
  };
  
  // End call
  const handleEndCall = () => {
    console.log('Ending call...');
    setIsConnected(false);
    
    // Clean up peer connection
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    
    // Notify the other user
    socket.emit('endCall', { roomId: appointmentId });
    
    // Call the parent component's onEndCall callback
    onEndCall();
  };
  
  // Send chat message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const sender = isDoctor ? doctorInfo.name : patientInfo.name;
      const timestamp = new Date();
      
      const message = {
        sender,
        text: newMessage,
        timestamp
      };
      
      // Add message to local state
      setMessages([...messages, message]);
      
      // Send message to the other user
      socket.emit('sendMessage', {
        roomId: appointmentId,
        message: {
          sender,
          text: newMessage,
          timestamp: timestamp.toISOString()
        }
      });
      
      setNewMessage('');
    }
  };
  
  // Format timestamp for chat
  const formatMessageTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Monitor connection quality
  useEffect(() => {
    if (isConnected && stream) {
      // In a real implementation, you would use WebRTC stats API to monitor connection quality
      // For this example, we'll simulate connection quality changes
      const qualityInterval = setInterval(() => {
        // Get connection stats
        if (connectionRef.current) {
          // Simulate quality changes for now
          const qualities: ('good' | 'fair' | 'poor')[] = ['good', 'fair', 'good', 'good'];
          const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
          setConnectionQuality(randomQuality);
          
          // In a real implementation, you would use:
          // connectionRef.current.getStats((err, stats) => { ... })
        }
      }, 10000);
      
      return () => clearInterval(qualityInterval);
    }
  }, [isConnected, stream]);
  
  // Render connection quality indicator
  const renderConnectionQuality = () => {
    const qualityColors = {
      good: 'bg-green-500',
      fair: 'bg-yellow-500',
      poor: 'bg-red-500'
    };
    
    return (
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${qualityColors[connectionQuality]} mr-2`}></div>
        <span className="text-sm">
          {connectionQuality === 'good' ? 'Good connection' : 
           connectionQuality === 'fair' ? 'Fair connection' : 'Poor connection'}
        </span>
      </div>
    );
  };
  
  // If there's an error, show error screen
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={onEndCall}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // If waiting, show waiting room
  if (isWaiting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto flex items-center justify-center">
              <Users size={32} className="text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            {isDoctor ? 'Waiting for patient to join...' : 'Waiting for doctor to start the call...'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isDoctor ? 
              'Your patient will join shortly. Please wait.' : 
              'You are in the virtual waiting room. The doctor will see you soon.'}
          </p>
          <div className="flex justify-center">
            <button 
              onClick={onEndCall}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Main video area */}
      <div className="flex-1 relative">
        {/* Remote video (full screen) */}
        <div className="absolute inset-0 bg-black">
          {appointmentType === 'video' && !isVideoOff ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src={isDoctor ? patientInfo.imageUrl : doctorInfo.imageUrl}
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {isDoctor ? patientInfo.name : doctorInfo.name}
                </h3>
                <p className="text-gray-300">
                  {isDoctor ? `Patient, ${patientInfo.age} years old` : doctorInfo.specialty}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Local video (picture-in-picture) */}
        {appointmentType === 'video' && (
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
            {!isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted // Always mute local video to prevent feedback
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 mx-auto mb-2 flex items-center justify-center">
                    <img 
                      src={isDoctor ? doctorInfo.imageUrl : patientInfo.imageUrl}
                      alt="Profile" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-white">Camera Off</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Call info overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-3 text-white">
          <div className="flex items-center">
            <div className="mr-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <img 
                  src={isDoctor ? patientInfo.imageUrl : doctorInfo.imageUrl}
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="font-medium">
                {isDoctor ? patientInfo.name : doctorInfo.name}
              </h3>
              <div className="flex items-center text-xs">
                <span className="mr-2">{formatTime(elapsedTime)}</span>
                {renderConnectionQuality()}
              </div>
            </div>
          </div>
        </div>
        
        {/* HIPAA compliance indicator */}
        <div className="absolute top-4 right-4 bg-green-600 bg-opacity-90 rounded-lg px-3 py-1 text-white flex items-center">
          <Shield size={16} className="mr-1" />
          <span className="text-xs font-medium">HIPAA Compliant</span>
        </div>
      </div>
      
      {/* Chat panel (conditionally rendered) */}
      {chatOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-lg flex flex-col z-10">
          <div className="p-3 bg-blue-600 text-white flex justify-between items-center">
            <h3 className="font-medium">Chat</h3>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center italic text-sm">No messages yet</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`mb-3 ${msg.sender === (isDoctor ? doctorInfo.name : patientInfo.name) ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-xs rounded-lg p-3 ${msg.sender === (isDoctor ? doctorInfo.name : patientInfo.name) ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatMessageTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-200">
            <div className="flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Call controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center space-x-4">
          <button 
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          {appointmentType === 'video' && (
            <button 
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
            >
              {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          )}
          
          <button 
            onClick={() => setChatOpen(!chatOpen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${chatOpen ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
          >
            <MessageSquare size={20} />
          </button>
          
          <button 
            onClick={handleEndCall}
            className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelehealthCall;