import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Activity, RefreshCw, CheckCircle } from 'lucide-react';

const EmergencyPage: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState('System idle. Ready to activate.');
  const [alertBox, setAlertBox] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const threshold = 15; // Acceleration threshold in g-force (lowered for better sensitivity)
  const [alertSent, setAlertSent] = useState(false);
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
    };
  }, []);
  
  // Debounce mechanism to prevent multiple alerts
  const [lastShakeTime, setLastShakeTime] = useState(0);
  const debounceTime = 2000; // 2 seconds between shake detections

  // Handle motion detection
  const handleMotion = (event: DeviceMotionEvent) => {
    if (!isMonitoring || alertSent) return;
    
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;
    
    const total = Math.sqrt(x * x + y * y + z * z);
    console.log("Motion force:", total.toFixed(2));
    
    const now = Date.now();
    if (total > threshold && (now - lastShakeTime) > debounceTime) {
      setLastShakeTime(now);
      setStatus("⚠️ High impact detected. Verifying accident...");
      
      // Visual feedback
      navigator.vibrate?.(200); // Vibrate if supported
      
      setTimeout(() => {
        if (!alertSent) sendAccidentAlert(total);
      }, 3000); // Confirm after 3 seconds
    }
  };

  const startDetection = async () => {
    if (!window.DeviceMotionEvent) {
      alert("Your device doesn't support motion detection.");
      return;
    }
    
    if (!navigator.geolocation) {
      alert("Your browser does not support GPS.");
      return;
    }
    
    // Request permission for iOS 13+ devices
    try {
      // Check if DeviceMotionEvent has a requestPermission method (iOS 13+)
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          alert('Permission to access motion sensors was denied.');
          return;
        }
      }
      
      setIsMonitoring(true);
      setAlertSent(false);
      setStatus("✅ Monitoring activated. Shake device to simulate accident...");
      
      // Add event listener for motion detection
      window.addEventListener('devicemotion', handleMotion, true);
      
      // Get current location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. GPS may be disabled.");
        }
      );
    } catch (error) {
      console.error("Error starting detection:", error);
      alert("Failed to start motion detection. Please try again.");
    }
  };

  const stopDetection = () => {
    window.removeEventListener('devicemotion', handleMotion, true);
    setIsMonitoring(false);
    setStatus("System idle. Ready to activate.");
    setAlertBox('');
    setAlertSent(false);
  };

  const sendAccidentAlert = (force: number) => {
    setAlertSent(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const message = `🚨 Accident Detected!\nImpact: ${force.toFixed(2)}g\nLocation: https://maps.google.com/?q=${lat},${lon}`;
        
        // For demo, just show alert
        // alert(message);
        
        // Show message in alert box
        setAlertBox(message);
        setStatus("🚑 Alert sent to emergency services and contacts. Help is on the way.");
        
        setCoordinates({ lat, lon });
        
        // In a real app, this would send to your backend API
        // which would then notify emergency services, contacts, etc.
        console.log("Would send alert to backend:", message);
      },
      (error) => {
        alert("GPS access failed: " + error.message);
        setStatus("⚠️ Could not determine location. Please call emergency services directly.");
      }
    );
  };

  // Mock health data for demonstration
  const healthData = {
    heartRate: "82 bpm",
    bloodPressure: "118/78 mmHg",
    respiration: "18 rpm",
    oxygenSaturation: "97%"
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Emergency Accident Detection</h1>
        <p className="text-gray-600">
          Our intelligent system uses your device's sensors to detect accidents and automatically alert emergency services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1470&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "overlay",
            backgroundColor: "rgba(255, 255, 255, 0.9)"
          }}>
            <div className="flex items-start mb-6">
              <AlertTriangle size={32} className="text-red-600 mr-4 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-red-800">Accident Detection System</h2>
                <p className="text-gray-700">
                  Click the button below to enable real-time accident monitoring using your phone's motion and GPS sensors.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mb-6">
              {!isMonitoring ? (
                <button
                  onClick={startDetection}
                  className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition-colors"
                >
                  Start Emergency Detection
                </button>
              ) : (
                <button
                  onClick={stopDetection}
                  className="bg-gray-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-700 transition-colors"
                >
                  Stop Detection
                </button>
              )}
            </div>
            
            <div className={`text-center p-4 rounded-lg ${isMonitoring ? 'bg-green-100' : 'bg-gray-100'}`}>
              <p className="text-lg font-medium">
                {isMonitoring ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw size={20} className="animate-spin mr-2" /> {status}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <CheckCircle size={20} className="mr-2" /> {status}
                  </span>
                )}
              </p>
            </div>
            
            {alertBox && (
              <div className="mt-6 bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg animate-pulse">
                <p className="font-bold whitespace-pre-wrap">{alertBox}</p>
                <div className="mt-4 flex justify-between">
                  <p>
                    <strong>Authorities notified:</strong> Local Emergency Services, Family Contacts
                  </p>
                  <button className="text-blue-700 underline">
                    Cancel Alert
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Emergency Contacts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Emergency Contacts</h3>
            <ul className="space-y-3">
              <li className="flex justify-between">
                <span>Family - Sarah Johnson</span>
                <span className="text-blue-700">+1 (555) 123-4567</span>
              </li>
              <li className="flex justify-between">
                <span>Primary Doctor - Dr. Michael Chen</span>
                <span className="text-blue-700">+1 (555) 987-6543</span>
              </li>
              <li className="flex justify-between">
                <span>Local Hospital</span>
                <span className="text-blue-700">+1 (555) 789-0123</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Right column: Location and Health Data */}
        <div className="space-y-6">
          {/* Location Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <MapPin size={20} className="text-blue-900 mr-2" />
              <h3 className="text-lg font-bold text-blue-900">Location</h3>
            </div>
            
            {coordinates ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Current coordinates:</p>
                <p className="font-medium">Lat: {coordinates.lat.toFixed(6)}</p>
                <p className="font-medium">Lon: {coordinates.lon.toFixed(6)}</p>
                <a 
                  href={`https://maps.google.com/?q=${coordinates.lat},${coordinates.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 text-blue-700 hover:underline"
                >
                  View on Google Maps
                </a>
              </div>
            ) : (
              <p className="text-gray-600">Location tracking not active.</p>
            )}
          </div>
          
          {/* Health Data Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Activity size={20} className="text-blue-900 mr-2" />
              <h3 className="text-lg font-bold text-blue-900">Health Data</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Heart Rate:</span>
                <span className="font-medium">{healthData.heartRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blood Pressure:</span>
                <span className="font-medium">{healthData.bloodPressure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Respiration:</span>
                <span className="font-medium">{healthData.respiration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Oxygen Saturation:</span>
                <span className="font-medium">{healthData.oxygenSaturation}</span>
              </div>
            </div>
            
            <p className="mt-4 text-sm text-gray-600">
              * Data simulated for demonstration purposes. In the real application, 
              this would be connected to your smartwatch or health monitoring devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;