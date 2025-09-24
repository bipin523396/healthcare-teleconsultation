import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Peer, { SignalData } from 'simple-peer';
import Webcam from 'react-webcam';

interface PeerType {
  peerID: string;
  peer: Peer.Instance;
  stream?: MediaStream;
}

interface CallType {
  isReceivingCall?: boolean;
  from?: string;
  name?: string;
  signal?: SignalData;
}

const VideoCall: React.FC = () => {
  const [peers, setPeers] = useState<PeerType[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [me, setMe] = useState<string>('');
  const [callAccepted, setCallAccepted] = useState<boolean>(false);
  const [callEnded, setCallEnded] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [call, setCall] = useState<CallType>({});
  
  const socketRef = useRef<Socket>();
  const userVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: Peer.Instance }>({});
  const { id: roomID } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Clean up function
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    // Initialize socket connection
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    
    // Request access to user's media devices
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setStream(stream);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error('Error accessing media devices:', err);
      });

    // Set up socket event listeners
    socket.on('me', (id: string) => {
      setMe(id);
      console.log('My socket ID:', id);
    });

    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    socket.on('callAccepted', (signal: SignalData) => {
      setCallAccepted(true);
      const peer = Object.values(peersRef.current)[0];
      if (peer) {
        peer.signal(signal);
      }
    });

    socket.on('user joined', (userId: string) => {
      console.log('User joined:', userId);
      if (stream && socketRef.current?.id) {
        const peer = createPeer(userId, socketRef.current.id, stream);
        peersRef.current = { ...peersRef.current, [userId]: peer };
      }
    });

    socket.on('user left', (userId: string) => {
      console.log('User left:', userId);
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
        setPeers(prevPeers => prevPeers.filter(peer => peer.peerID !== userId));
      }
    });

    socket.on('all users', (users: string[]) => {
      console.log('All users in room:', users);
      const newPeers: PeerType[] = [];
      users.forEach(userId => {
        if (userId === me || !stream) return;
        const peer = createPeer(userId, me, stream);
        peersRef.current = { ...peersRef.current, [userId]: peer };
        newPeers.push({
          peerID: userId,
          peer,
        });
      });
      setPeers(newPeers);
    });

    // Handle user leaving the call
    socket.on('userLeft', (userId: string) => {
      const peer = peersRef.current[userId];
      if (peer) {
        peer.destroy();
        const newPeersRef = { ...peersRef.current };
        delete newPeersRef[userId];
        peersRef.current = newPeersRef;
        setPeers(prevPeers => prevPeers.filter(p => p.peerID !== userId));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const createPeer = (userToSignal: string, callerID: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal: SignalData) => {
      if (socketRef.current) {
        socketRef.current.emit('sending signal', { userToSignal, callerID, signal });
      }
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      setPeers(prevPeers => {
        // Check if we already have this peer
        if (prevPeers.some(p => p.peerID === userToSignal)) {
          return prevPeers.map(p => 
            p.peerID === userToSignal ? { ...p, stream: remoteStream } : p
          );
        }
        return [...prevPeers, { peerID: userToSignal, peer, stream: remoteStream }];
      });
    });

    peer.on('error', (err: Error) => {
      console.error('Peer error:', err);
    });

    return peer;
  };

  const answerCall = () => {
    if (!call.signal || !call.from) return;
    
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream || undefined,
    });

    peer.on('signal', (signal: SignalData) => {
      if (socketRef.current) {
        socketRef.current.emit('answer call', { signal, to: call.from });
      }
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      setPeers(prevPeers => {
        // Check if we already have this peer
        if (prevPeers.some(p => p.peerID === call.from)) {
          return prevPeers.map(p => 
            p.peerID === call.from ? { ...p, stream: remoteStream } : p
          );
        }
        return [...prevPeers, { peerID: call.from || '', peer, stream: remoteStream }];
      });
    });

    peer.on('error', (err: Error) => {
      console.error('Peer error in answerCall:', err);
    });

    peer.signal(call.signal);
    
    // Add to peers ref
    if (call.from) {
      peersRef.current = { ...peersRef.current, [call.from]: peer };
    }
  };

  const callUser = (id: string) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socketRef.current.emit('callUser', {
        userToCall: id,
        signalData: signal,
        from: me,
        name,
      });
    });

    peer.on('stream', (currentStream) => {
      // Handle the incoming stream
    });

    peersRef.current.push({
      peerID: id,
      peer,
    });
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/');
  };

  if (!stream) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Loading video...</h2>
          <p>Please allow access to your camera and microphone.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Your video */}
          <div className="bg-black rounded-lg overflow-hidden">
            <Webcam
              audio={false}
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: 'user'
              }}
              className="w-full h-auto"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
          
          {/* Peer videos */}
          {peers.map((peer, index) => (
            <div key={index} className="bg-black rounded-lg overflow-hidden">
              <video
                playsInline
                autoPlay
                ref={(ref) => {
                  if (ref && peer.stream) {
                    ref.srcObject = peer.stream;
                  }
                }}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
        
        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!callAccepted && !callEnded && call.isReceivingCall && (
            <button
              onClick={answerCall}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Answer Call
            </button>
          )}
          <button
            onClick={leaveCall}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
