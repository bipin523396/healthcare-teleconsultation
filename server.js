import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `audio_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /wav|mp3|ogg|m4a/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'));
    }
  }
});

// Ensure uploads directory exists
import fs from 'fs';
import { promisify } from 'util';
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

(async () => {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!await exists(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
})();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Voice recognition endpoint
app.post('/api/voice/recognize', (req, res, next) => {
  // Log the incoming request
  console.log('Incoming voice recognition request');
  console.log('Request headers:', req.headers);
  
  // Use the upload middleware
  upload.single('audio')(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({
          status: 'error',
          message: err.message || 'Error uploading file',
          timestamp: new Date().toISOString()
        });
      }
      
      if (!req.file) {
        console.log('No file was uploaded');
        return res.status(400).json({
          status: 'error',
          message: 'No audio file provided in the request',
          timestamp: new Date().toISOString()
        });
      }

      console.log('Successfully received file:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      // Simulate processing delay (1-3 seconds)
      const processingTime = 1000 + Math.random() * 2000;
      console.log(`Simulating processing for ${processingTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Mock response - in a real app, you would process the audio here
      const mockResponses = [
        'This is a test transcription of your audio.',
        'The quick brown fox jumps over the lazy dog.',
        'Hello, how can I help you today?',
        'This is a mock response from the speech recognition service.'
      ];
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      console.log('Sending successful response');
      res.status(200).json({
        status: 'success',
        text: randomResponse,
        timestamp: new Date().toISOString(),
        fileUrl: `/uploads/${req.file.filename}`,
        processingTime: `${processingTime}ms`
      });
      
    } catch (error) {
      console.error('Error in voice recognition endpoint:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred while processing the audio file',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AI Agent Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/api/chat', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required'
      });
    }
    
    // Mock response - replace with actual AI processing
    res.status(200).json({
      status: 'success',
      response: `You said: ${message}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  },
});

const users = {};
const socketToRoom = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join room', (roomID) => {
    if (users[roomID]) {
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
    
    // Send the list of users already in the room to the new user
    socket.emit('all users', usersInThisRoom);
    
    // Notify other users about the new user
    socket.to(roomID).emit('user joined', socket.id);
  });

  socket.on('sending signal', (payload) => {
    io.to(payload.userToSignal).emit('user joined', {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on('returning signal', (payload) => {
    io.to(payload.callerID).emit('receiving returned signal', {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
      
      // Notify other users that this user has left
      socket.to(roomID).emit('user left', socket.id);
      
      // Clean up empty rooms
      if (room.length === 0) {
        delete users[roomID];
      }
    }
    
    delete socketToRoom[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});