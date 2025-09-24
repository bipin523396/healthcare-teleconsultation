import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon, RefreshCw, UserPlus, UserCheck, Eye } from 'lucide-react';
import patientService from '../services/PatientService';
import faceRecognitionService from '../services/FaceRecognitionService';

const FaceScanPage: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recognized, setRecognized] = useState<boolean | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientDetails, setPatientDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [eyesDetected, setEyesDetected] = useState(false);
  // Mode can be 'scan' or 'register'
  const [mode, setMode] = useState<'scan' | 'register'>('scan');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    contact: '',
    specialty: '',
    medicalHistory: '',
    currentIssue: '',
    faceId: ''
  });
  
  // State for tracking face and eye detection
  const [faceLocation, setFaceLocation] = useState<{top: number, right: number, bottom: number, left: number} | null>(null);
  const [eyeLocations, setEyeLocations] = useState<Array<{x: number, y: number, width: number, height: number}> | null>(null);
  
  // Create a secondary webcam ref for the hidden webcam
  const hiddenWebcamRef = useRef<Webcam>(null);
  
  // Function to get an available webcam reference (main or hidden)
  const getAvailableWebcamRef = () => {
    // First try the main webcam ref
    if (webcamRef.current && webcamRef.current.video) {
      return webcamRef.current;
    }
    // Fall back to the hidden webcam ref
    if (hiddenWebcamRef.current && hiddenWebcamRef.current.video) {
      console.log('Using hidden webcam reference as fallback');
      return hiddenWebcamRef.current;
    }
    // No webcam ref available
    return null;
  }

  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "user"
  };

  useEffect(() => {
    return () => {
      if (webcamRef.current) {
        const stream = webcamRef.current.video?.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);

  // Comprehensive polyfill and environment check for camera access
  useEffect(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    // Note: window.isSecureContext is the proper way to check, but we also manually check for localhost
    // as development environments are considered secure even on HTTP
    const isLocalhost = location.hostname === 'localhost' || 
                       location.hostname === '127.0.0.1' ||
                       location.hostname.includes('192.168.') ||
                       location.hostname.includes('10.') ||
                       location.hostname.includes('172.16.') ||
                       location.hostname.startsWith('172.') ||
                       location.hostname.includes('.local');
                       
    const isSecureContext = window.isSecureContext || 
                           location.protocol === 'https:' || 
                           isLocalhost;
    
    console.log('Security check:', { 
      isSecureContext, 
      protocol: location.protocol, 
      hostname: location.hostname,
      isLocalhost
    });
    
    if (!isSecureContext) {
      console.error('Camera access requires a secure context (HTTPS)');
      alert('Camera access requires HTTPS. Please access this application via a secure connection.');
      return;
    }

    // Ensure navigator exists
    if (typeof navigator === 'undefined') {
      console.error('Navigator not available in this environment');
      return;
    }

    // Define getUserMedia for older browsers
    // @ts-ignore - vendor prefixed versions
    const oldGetUserMedia = navigator.getUserMedia || 
                          // @ts-ignore - vendor prefixed versions
                          navigator.webkitGetUserMedia || 
                          // @ts-ignore - vendor prefixed versions
                          navigator.mozGetUserMedia || 
                          // @ts-ignore - vendor prefixed versions
                          navigator.msGetUserMedia;

    // Older browsers might not have mediaDevices at all
    if (!navigator.mediaDevices) {
      // @ts-ignore - we're intentionally modifying the navigator object for polyfill
      navigator.mediaDevices = {};
    }

    // Directly patch the react-webcam's expected method
    if (!navigator.mediaDevices.getUserMedia) {
      // @ts-ignore - we're intentionally modifying the navigator object for polyfill
      navigator.mediaDevices.getUserMedia = function(constraints) {
        // If we have the old getUserMedia, use it
        if (oldGetUserMedia) {
          return new Promise(function(resolve, reject) {
            oldGetUserMedia.call(navigator, constraints, resolve, reject);
          });
        }
        
        // If no getUserMedia is available at all
        console.warn('Camera API (getUserMedia) is not supported in this browser');
        return Promise.reject(new Error(
          'getUserMedia is not supported in this browser. Please use Chrome, Firefox, or Edge.'
        ));
      };
    }

    // Patch react-webcam's direct access to window.navigator.mediaDevices.getUserMedia
    // This is needed because react-webcam might access it directly
    if (window.navigator && window.navigator.mediaDevices) {
      // @ts-ignore - we're intentionally modifying the window object for polyfill
      window.navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia;
    }

    // Log that polyfill has been applied
    console.log('Camera API polyfill applied in', isSecureContext ? 'secure context' : 'non-secure context');
  }, []);
  
  // Ensure polyfill is applied before component mounts and check environment
  useEffect(() => {
    // Check if getUserMedia is properly implemented
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      console.error('Camera API polyfill failed to apply correctly');
      alert('Your browser may not support camera access. Please try using Chrome, Firefox, or Edge.');
      return;
    }
    
    // Check if we're in an iframe
    if (window.self !== window.top) {
      console.warn('Application is running in an iframe, which may restrict camera access');
    }
    
    // Check browser compatibility
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome');
    const isFirefox = userAgent.includes('firefox');
    const isEdge = userAgent.includes('edg');
    const isSafari = userAgent.includes('safari') && !isChrome && !isEdge;
    
    if (!isChrome && !isFirefox && !isEdge && !isSafari) {
      console.warn('Current browser may have limited support for camera access');
    }
  }, []);

  // Check camera permissions explicitly
  const checkCameraPermissions = async () => {
    console.log('Checking camera permissions...');
    try {
      // Try to enumerate devices to check if we have permission to see labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log(`Found ${videoDevices.length} video devices`);
      
      // If we can see device labels, we likely have permission already
      const hasLabels = videoDevices.some(device => !!device.label);
      console.log(`Camera permission status: ${hasLabels ? 'Granted' : 'Not yet granted or denied'}`);
      
      if (videoDevices.length === 0) {
        console.warn('No video devices found on this system!');
        return false;
      }
      
      // If we don't have labels, we need to request permission
      if (!hasLabels) {
        console.log('Requesting camera permission explicitly...');
        // Request a temporary stream just to trigger the permission prompt
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        console.log('Camera permission granted successfully');
        
        // Stop the temporary stream immediately
        tempStream.getTracks().forEach(track => track.stop());
        return true;
      }
      
      return true;
    } catch (err) {
      console.error('Error checking camera permissions:', err);
      return false;
    }
  };
  
  // Add a small delay to ensure webcam component is mounted before accessing
  const ensureWebcamMounted = () => {
    return new Promise<void>((resolve, reject) => {
      // Check if webcam is already available
      if (webcamRef.current && webcamRef.current.video) {
        console.log('Webcam reference is already available');
        resolve();
        return;
      }
      
      console.log('Waiting for webcam reference to become available...');
      console.log('Current webcamRef status:', {
        refExists: !!webcamRef.current,
        videoExists: !!webcamRef.current?.video,
        reactWebcamMounted: document.querySelector('.react-webcam') ? 'Yes' : 'No'
      });
      
      // Try multiple times with increasing delays and exponential backoff
      let attempts = 0;
      const maxAttempts = 8; // Increased from 5 to 8 for more attempts
      const baseDelay = 250; // Start with 250ms
      
      const checkWebcam = () => {
        attempts++;
        
        // Log detailed status on each attempt
        console.log(`Webcam check attempt ${attempts}/${maxAttempts}:`, {
          refExists: !!webcamRef.current,
          videoExists: !!webcamRef.current?.video,
          reactWebcamMounted: document.querySelector('.react-webcam') ? 'Yes' : 'No'
        });
        
        if (webcamRef.current && webcamRef.current.video) {
          console.log(`Webcam reference became available after ${attempts} attempts`);
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.log(`Webcam reference still not available after ${maxAttempts} attempts`);
          // We'll resolve anyway but log a warning
          console.warn('Proceeding without confirmed webcam reference - this may cause issues');
          resolve();
          return;
        }
        
        // Exponential backoff: delay increases with each attempt
        const delay = baseDelay * Math.pow(1.5, attempts - 1);
        console.log(`Trying again in ${delay}ms...`);
        setTimeout(checkWebcam, delay);
      };
      
      // Start the first check
      checkWebcam();
    });
  };

  const startCamera = async () => {
    try {
      console.log('Starting camera initialization process...');
      
      // Set camera active state immediately to provide user feedback
      setCameraActive(true);
      
      // Force any existing camera to stop first to avoid conflicts
      stopCamera();
      
      // Check if we're in a secure context (HTTPS or localhost)
      const isLocalhost = location.hostname === 'localhost' || 
                         location.hostname === '127.0.0.1' ||
                         location.hostname.includes('192.168.') ||
                         location.hostname.includes('10.') ||
                         location.hostname.includes('172.16.') ||
                         location.hostname.startsWith('172.') ||
                         location.hostname.includes('.local');
                         
      const isSecureContext = window.isSecureContext || 
                             location.protocol === 'https:' || 
                             isLocalhost;
      
      console.log('Camera start security check:', { 
        isSecureContext, 
        protocol: location.protocol, 
        hostname: location.hostname,
        isLocalhost
      });
      
      if (!isSecureContext) {
        throw new Error('Camera access requires a secure context (HTTPS)');
      }
      
      // Check if we're in an iframe
      if (window.self !== window.top) {
        console.warn('Application is running in an iframe, which may restrict camera access');
      }

      // First check if mediaDevices is supported
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices is not available in this browser');
      }
      
      if (typeof navigator.mediaDevices.getUserMedia !== 'function') {
        throw new Error('getUserMedia is not implemented in this browser');
      }
      
      // Check camera permissions explicitly before proceeding
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission) {
        console.warn('Camera permissions check failed or no cameras available');
        // We'll still try to proceed, but log the warning
      }

      // Ensure webcam component is fully mounted before proceeding
      console.log('Waiting for webcam component to be fully mounted...');
      await ensureWebcamMounted();
      
      // Verify DOM element is present
      const webcamElement = document.querySelector('.react-webcam');
      if (!webcamElement) {
        console.warn('React-webcam DOM element not found, attempting to proceed anyway');
      } else {
        console.log('React-webcam DOM element found in document');
      }
      
      // Try with minimal constraints first to ensure compatibility
      try {
        console.log('Attempting camera access with minimal constraints first');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        // Small delay to ensure browser has time to initialize the stream
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get an available webcam reference (main or hidden)
        const availableWebcamRef = getAvailableWebcamRef();
        if (availableWebcamRef) {
          availableWebcamRef.video.srcObject = stream;
          setCameraActive(true);
          console.log('Camera started successfully with minimal constraints');
          return; // Success, exit early
        } else {
          console.warn('Webcam reference not available after getting stream with minimal constraints');
          // Don't throw yet, try the next approach
        }
      } catch (minimalErr) {
        console.warn('Could not access camera with minimal constraints:', minimalErr);
        // Continue to try other approaches
      }

      // Try with exact constraints as a second attempt
      try {
        console.log('Attempting camera access with exact constraints');
        // Ensure webcam is mounted again before trying exact constraints
        await ensureWebcamMounted();
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...videoConstraints,
            width: { ideal: videoConstraints.width },
            height: { ideal: videoConstraints.height }
          },
          audio: false
        });
        
        // Small delay to ensure browser has time to initialize the stream
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get an available webcam reference (main or hidden)
        const availableWebcamRef = getAvailableWebcamRef();
        if (availableWebcamRef) {
          availableWebcamRef.video.srcObject = stream;
          setCameraActive(true);
          console.log('Camera started successfully with exact constraints');
          return; // Success, exit early
        }
      } catch (exactErr) {
        console.warn('Could not access camera with exact constraints:', exactErr);
      }

      // Final fallback to basic constraints with different facingMode
      console.log('Attempting camera access with environment facing mode as last resort');
      
      // Ensure webcam is mounted again before trying fallback
      await ensureWebcamMounted();
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment' // Try the back camera as a last resort
          },
          audio: false
        });
        
        // Small delay to ensure browser has time to initialize the stream
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get an available webcam reference (main or hidden)
        const availableWebcamRef = getAvailableWebcamRef();
        if (availableWebcamRef) {
          availableWebcamRef.video.srcObject = stream;
          console.log('Camera started successfully with environment facing mode');
          setCameraActive(true);
          return;
        } else {
          throw new Error('Webcam reference not available after all attempts');
        }
      } catch (fallbackErr) {
        console.error('All camera initialization attempts failed:', fallbackErr);
        throw fallbackErr; // Re-throw to be caught by the outer catch block
      }
      
      // This line should not be reached if any of the attempts succeed or fail
    } catch (err) {
      console.error('Error accessing camera:', err);
      console.error('Error details:', { 
        name: err.name, 
        message: err.message, 
        stack: err.stack,
        webcamRefStatus: webcamRef.current ? 'Available' : 'Not available',
        videoElementStatus: webcamRef.current?.video ? 'Available' : 'Not available',
        browserInfo: navigator.userAgent
      });
      
      // Check if camera devices are available
      try {
        navigator.mediaDevices.enumerateDevices().then(devices => {
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          console.log('Available video devices:', videoDevices.length);
          videoDevices.forEach((device, index) => {
            console.log(`Video device ${index + 1}:`, device.label || `Camera ${index + 1}`);
          });
          
          if (videoDevices.length === 0) {
            console.error('No video input devices found!');
          }
        }).catch(enumErr => {
          console.error('Error enumerating devices:', enumErr);
        });
      } catch (enumErr) {
        console.error('Could not enumerate devices:', enumErr);
      }
      
      // More helpful error message based on error type
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Camera access denied. Please check your browser settings and allow camera access for this site. You may need to click the camera icon in your address bar to enable permissions.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('No camera found. Please check that your camera is properly connected and not disabled in your device settings.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        alert('Camera is already in use by another application or there was an error accessing it. Please close other applications that might be using the camera (like Zoom, Teams, or other browser tabs).');
      } else if (err.name === 'OverconstrainedError') {
        alert('Camera cannot satisfy the requested constraints. Try using the app on a device with a better camera.');
      } else if (err.name === 'AbortError') {
        alert('Camera access was aborted. Please try again and don\'t interrupt the camera initialization process.');
      } else if (err.name === 'SecurityError') {
        alert('Camera access was blocked due to security restrictions. Please ensure you\'re using HTTPS or localhost.');
      } else if (err.message.includes('secure context')) {
        alert('Camera access requires HTTPS. Please access this application via a secure connection or use localhost for testing.');
      } else if (err.message.includes('getUserMedia is not implemented')) {
        alert('Your browser does not support camera access. Please use the latest version of Chrome, Firefox, Safari, or Edge.');
      } else if (err.message.includes('mediaDevices is not available')) {
        alert('Camera API is not available in this browser. Please use the latest version of Chrome, Firefox, Safari, or Edge.');
      } else if (err.message.includes('Webcam reference not available')) {
        alert('Webcam component is not properly initialized. Please refresh the page and try again. If the problem persists, try clearing your browser cache or using a different browser.');
      } else {
        alert(`Could not access camera: ${err.message}. Please try the following steps:\n\n1. Refresh the page\n2. Check that your camera is connected and working\n3. Try a different browser (Chrome or Firefox recommended)\n4. Clear your browser cache\n5. Restart your device`);
      }
    }
  };

  const stopCamera = () => {
    // Set camera inactive state immediately to provide user feedback
    setCameraActive(false);
    
    if (webcamRef.current) {
      const stream = webcamRef.current.video?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Note: hiddenWebcamRef and getAvailableWebcamRef are already declared at the top of the component

  // Enhanced face detection and scanning with improved AI capabilities
  const captureImage = () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    // Start loading animation
    setLoading(true);
    
    // Use the enhanced face recognition service to detect faces
    const faceDetection = faceRecognitionService.detectFaces(imageSrc);
    
    if (!faceDetection.detected) {
      setLoading(false);
      alert('No face detected. Please position your face properly in the frame.');
      return;
    }
    
    // Update face location state
    setFaceLocation(faceDetection.locations ? faceDetection.locations[0] : null);
    
    // Use the enhanced face recognition service to detect eyes
    const eyeDetection = faceRecognitionService.detectEyes(imageSrc);
    setEyesDetected(eyeDetection.detected);
    
    // Update eye locations state
    setEyeLocations(eyeDetection.locations || null);
    
    if (!eyeDetection.detected) {
      setLoading(false);
      alert('No eyes detected. Please position your face properly in the frame.');
      return;
    }
    
    // Generate a face ID from the image using our enhanced service
    const faceId = faceRecognitionService.generateFaceId(imageSrc);
    console.log('Generated face ID:', faceId); // Debug log to see the face ID
    
    // Different behavior based on mode
    if (mode === 'scan') {
      // SCAN MODE: Try to find an existing patient with this face
      // Use the improved compareFaces function which handles similarity
      console.log('Scanning face with ID:', faceId);
      const faceMatch = faceRecognitionService.compareFaces(faceId);
      console.log('Face match result (scan mode):', faceMatch); // Debug log with mode info
      
      if (faceMatch.matched && faceMatch.patient) {
        const existingPatient = faceMatch.patient;
        // Patient found - show their details
        setRecognized(true);
        setPatientName(existingPatient.name);
        
        // Format patient details
        const details = [];
        if (existingPatient.lastVisit) details.push(`Last visit: ${existingPatient.lastVisit}`);
        if (existingPatient.doctor) details.push(`Doctor: ${existingPatient.doctor}`);
        if (existingPatient.medication) details.push(`Current medication: ${existingPatient.medication}`);
        if (details.length === 0) {
          details.push(`Age: ${existingPatient.age} | Contact: ${existingPatient.contact}`);
        }
        
        setPatientDetails(details.join(' | '));
        setShowRegisterForm(false);
        setLoading(false);
        console.log('Successfully identified patient:', existingPatient.name);
        alert(`Patient identified: ${existingPatient.name}`);
      } else {
        // No patient found in scan mode
        setRecognized(false);
        setShowRegisterForm(false);
        setLoading(false);
        console.log('No matching patient found in scan mode');
        // Check if there are any patients in the database
        const storedData = localStorage.getItem('face_recognition_patients');
        if (storedData) {
          try {
            const patients = JSON.parse(storedData);
            console.log('Patients in database:', patients.length);
            if (patients.length > 0) {
              console.log('Database has patients but no match found');
            } else {
              console.log('Database is empty - no patients registered yet');
            }
          } catch (error) {
            console.error('Error parsing patient data:', error);
          }
        } else {
          console.log('No patient data found in localStorage');
        }
        alert('Patient not found in our system. Please use Register Mode to register this face.');
      }
    } else {
      // REGISTER MODE: Register a new patient or show existing one
      // Use the improved compareFaces function which handles similarity
      // In register mode, we want to be more strict about matching to avoid false positives
      const faceMatch = faceRecognitionService.compareFaces(faceId);
      console.log('Face match result (register mode):', faceMatch); // Debug log with mode info
      
      if (faceMatch.matched && faceMatch.patient && faceMatch.similarity && faceMatch.similarity > 0.6) {
        // Higher threshold for register mode to be more certain it's the same person
        const existingPatient = faceMatch.patient;
        // This face is already registered
        setRecognized(true);
        setPatientName(existingPatient.name);
        
        // Format patient details
        const details = [];
        if (existingPatient.lastVisit) details.push(`Last visit: ${existingPatient.lastVisit}`);
        if (existingPatient.doctor) details.push(`Doctor: ${existingPatient.doctor}`);
        if (existingPatient.medication) details.push(`Current medication: ${existingPatient.medication}`);
        if (details.length === 0) {
          details.push(`Age: ${existingPatient.age} | Contact: ${existingPatient.contact}`);
        }
        
        setPatientDetails(details.join(' | '));
        setShowRegisterForm(false);
        setLoading(false);
        console.log('Face already registered as:', existingPatient.name);
        alert('This face is already registered in our system.');
      } else {
        // New face in register mode - show registration form
        setRecognized(false);
        setShowRegisterForm(true);
        // Store the face ID temporarily for registration
        setFormData(prev => ({ ...prev, faceId }));
        setLoading(false);
        console.log('New face detected in register mode, ready for registration');
      }
    }
  };
  
  // Handle keyboard events for camera control (similar to cv2.waitKey)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'q' && cameraActive) {
        stopCamera();
        console.log("🛑 Camera stopped by user pressing 'q'");
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [cameraActive]);
  
  // Continuous face scanning (similar to the OpenCV loop)
  useEffect(() => {
    let scanInterval: NodeJS.Timeout | null = null;
    
    if (cameraActive && !recognized && !showRegisterForm) {
      scanInterval = setInterval(() => {
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            // Check for faces without showing alert
            const faceDetection = faceRecognitionService.detectFaces(imageSrc);
            
            if (faceDetection.detected) {
              // Update face location state
              setFaceLocation(faceDetection.locations ? faceDetection.locations[0] : null);
              
              // Check for eyes without showing alert
              const eyeDetection = faceRecognitionService.detectEyes(imageSrc);
              setEyesDetected(eyeDetection.detected);
              
              // Update eye locations state
              setEyeLocations(eyeDetection.locations || null);
              
              // Log detection for debugging
              console.log('Real-time detection:', { 
                face: faceDetection.detected, 
                faceLocation: faceDetection.locations,
                eyes: eyeDetection.detected,
                eyeCount: eyeDetection.count,
                eyeLocations: eyeDetection.locations
              });
            } else {
              setEyesDetected(false);
              setFaceLocation(null);
              setEyeLocations(null);
            }
          }
        }
      }, 500); // Check every 500ms
    }
    
    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [cameraActive, recognized, showRegisterForm]);
  

  // Simulate loading for better UX
  const simulateLoading = (callback: () => void) => {
    setLoading(true);
    setTimeout(() => {
      callback();
      setLoading(false);
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Register the new patient with enhanced face recognition
    simulateLoading(() => {
      const newPatient = faceRecognitionService.addPatient({
        name: formData.name,
        age: formData.age,
        contact: formData.contact,
        specialty: formData.specialty,
        medicalHistory: formData.medicalHistory,
        currentIssue: formData.currentIssue,
        faceId: formData.faceId
      });
      
      alert('Patient registered successfully with facial recognition!');
      setRecognized(true);
      setPatientName(newPatient.name);
      setPatientDetails(`Age: ${newPatient.age} | Contact: ${newPatient.contact}`);
      setShowRegisterForm(false);
    });
  };

  const resetScan = () => {
    setRecognized(null);
    setPatientName('');
    setPatientDetails('');
    setShowRegisterForm(false);
  };

  // Note: hiddenWebcamRef and getAvailableWebcamRef are already declared at the top of the component
  
  // Initialize webcam on component mount
  useEffect(() => {
    // We'll use React's way of rendering instead of direct DOM manipulation
    // The hidden webcam will be rendered in the component's JSX
    
    // Check if the hidden webcam is mounted after a short delay
    const checkHiddenWebcam = setTimeout(() => {
      if (hiddenWebcamRef.current) {
        console.log('Hidden webcam component mounted successfully');
      } else {
        console.warn('Hidden webcam component failed to mount');
      }
    }, 1000);
    
    // Clean up function
    return () => {
      clearTimeout(checkHiddenWebcam);
      // Stop any camera stream on the hidden webcam
      if (hiddenWebcamRef.current) {
        const stream = hiddenWebcamRef.current.video?.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hidden webcam that's always rendered but not visible */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
        <Webcam
          ref={hiddenWebcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          style={{ width: 1, height: 1 }}
        />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Patient Identification</h1>
        <p className="text-gray-600">
          Our AI-powered facial recognition system securely identifies patients and retrieves their medical history.
        </p>
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm text-blue-800">
            <strong>Mode Instructions:</strong><br/>
            <span className="block mt-1">• <strong>Scan Mode:</strong> Use this to identify existing patients. The system will retrieve patient information if the face is recognized.</span>
            <span className="block mt-1">• <strong>Register Mode:</strong> Use this to register new patients. You'll be prompted to enter patient details after face scanning.</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col items-center">
          {!cameraActive ? (
            <div className="text-center mb-6">
              <div className="bg-gray-100 rounded-lg p-8 mb-4">
                <CameraIcon size={64} className="mx-auto text-blue-900" />
                <p className="mt-4 text-gray-600">Camera access required for patient identification</p>
              </div>
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={startCamera}
                  className="bg-blue-900 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-800 transition-colors"
                  disabled={cameraActive}
                >
                  Start Camera
                </button>
                <button 
                  onClick={stopCamera}
                  className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition-colors"
                  disabled={!cameraActive}
                >
                  Stop Camera
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full rounded-lg"
                  style={{ maxHeight: '400px' }}
                />
                
                {/* Face detection overlay - similar to cv2.rectangle */}
                {eyesDetected && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Face detection rectangle - similar to cv2.rectangle */}
                    {faceLocation && (
                      <div className="absolute border-2 border-green-500 rounded-lg"
                        style={{
                          top: `${faceLocation.top}px`,
                          left: `${faceLocation.left}px`,
                          width: `${faceLocation.right - faceLocation.left}px`,
                          height: `${faceLocation.bottom - faceLocation.top}px`
                        }}>
                      </div>
                    )}
                    
                    {/* Eye detection rectangles - similar to cv2.rectangle for eyes */}
                    {eyeLocations && eyeLocations.map((eye, index) => (
                      <div key={`eye-${index}`} className="absolute border-2 border-blue-500 rounded-sm"
                        style={{
                          top: `${eye.y}px`,
                          left: `${eye.x}px`,
                          width: `${eye.width}px`,
                          height: `${eye.height}px`
                        }}>
                      </div>
                    ))}
                    
                    {/* Status indicator */}
                    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded">
                      <div className="flex items-center">
                        <Eye className="mr-1" size={16} />
                        <span>Face & Eyes Detected</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <RefreshCw size={48} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                {/* Mode selection */}
                <div className="flex justify-center space-x-4 mb-2">
                  <button
                    onClick={() => {
                      setMode('scan');
                      resetScan();
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${mode === 'scan' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    Scan Mode
                  </button>
                  <button
                    onClick={() => {
                      setMode('register');
                      resetScan();
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${mode === 'register' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    Register Mode
                  </button>
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-center space-x-4 w-full">
                  {recognized === null ? (
                    <button 
                      onClick={() => simulateLoading(captureImage)}
                      className={`text-white px-6 py-2 rounded-md font-semibold transition-colors ${mode === 'register' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-900 hover:bg-blue-800'}`}
                      disabled={loading}
                    >
                      {mode === 'register' ? 'Register Face' : 'Scan Face'}
                    </button>
                  ) : (
                    <button 
                      onClick={resetScan}
                      className="bg-gray-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                  <button 
                    onClick={stopCamera}
                    className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700 transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {recognized === true && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 animate-fadeIn">
          <div className="flex items-start">
            <UserCheck size={32} className="text-green-600 mr-4 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-green-800">Patient Identified Successfully</h2>
              <h3 className="text-lg font-bold mt-2">{patientName}</h3>
              <p className="text-gray-600 mt-1">{patientDetails}</p>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="bg-blue-900 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-800 transition-colors">
                  View Full Medical History
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors">
                  Start Teleconsultation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRegisterForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 animate-fadeIn">
          <div className="flex items-start mb-4">
            <UserPlus size={32} className="text-blue-600 mr-4 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-blue-800">New Patient Registration</h2>
              <p className="text-gray-600">Please fill in your details to create a new patient profile.</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
              <input
                type="text"
                name="specialty"
                value={formData.specialty || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter your specialty"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical History (if any)</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md h-24"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Health Issue</label>
              <textarea
                name="currentIssue"
                value={formData.currentIssue}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md h-24"
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
              >
                Register Patient
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FaceScanPage;