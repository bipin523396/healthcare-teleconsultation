import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Video, Phone, MessageCircle } from 'lucide-react';
import TelehealthCall from '../components/TelehealthCall';
import doctorService from '../services/DoctorService';
import appointmentService from '../services/AppointmentService';
import type { Appointment } from '../services/AppointmentService';

const TelehealthSessionPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callStarted, setCallStarted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [networkTestComplete, setNetworkTestComplete] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<{
    latency: number;
    download: number;
    upload: number;
    suitable: boolean;
  }>({ latency: 0, download: 0, upload: 0, suitable: false });
  
  // Mock user role - in a real app, this would come from authentication
  const userRole = 'patient'; // or 'doctor'
  const patientId = 'patient123'; // Mock patient ID
  
  // Fetch appointment details
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all teleconsultation appointments
        const teleconsultations = await appointmentService.getTeleconsultationAppointments();
        setAppointments(teleconsultations);
        
        // If we have an appointmentId, find that specific appointment
        if (appointmentId) {
          const foundAppointment = teleconsultations.find(app => app.id === appointmentId);
          
          if (foundAppointment) {
            setAppointment(foundAppointment);
            
            // Fetch doctor details
            const doctorDetails = doctorService.getDoctorById(foundAppointment.doctorId);
            setDoctor(doctorDetails);
          } else {
            // If not found, create a mock appointment
            const mockAppointment: Appointment = {
              id: appointmentId || 'appt123',
              doctorId: 'doc1',
              doctorName: 'Dr. Smith',
              patientId: 'patient123',
              patientName: 'John Doe',
              date: new Date().toISOString().split('T')[0],
              time: '10:00 AM',
              type: 'teleconsultation',
              status: 'upcoming',
              roomId: `room-${Date.now()}`
            };
            
            setAppointment(mockAppointment);
            
            // Fetch doctor details
            const doctorDetails = doctorService.getDoctorById(mockAppointment.doctorId);
            setDoctor(doctorDetails);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching appointment details:', err);
        setError('Failed to load appointment details. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchAppointmentDetails();
  }, [appointmentId]);
  
  // If no specific appointment is selected, show the list of teleconsultation appointments
  const renderAppointmentsList = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      );
    }
    
    if (appointments.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <Calendar size={24} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Teleconsultations</h2>
          <p className="text-gray-600 mb-6">You don't have any scheduled teleconsultations yet.</p>
          <button 
            onClick={() => navigate('/appointments')}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <Calendar size={18} className="mr-2" />
            Schedule a Consultation
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map((apt) => (
          <div key={apt.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className={`p-4 ${apt.status === 'in-progress' ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
              <h3 className="font-semibold">
                {apt.status === 'in-progress' ? 'Active Consultation' : 'Scheduled Consultation'}
              </h3>
              <div className="flex items-center mt-1 text-sm">
                <Calendar size={14} className="mr-1" />
                <span>{apt.date}</span>
                <Clock size={14} className="ml-3 mr-1" />
                <span>{apt.time}</span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Doctor</p>
                <p className="font-medium">{apt.doctorName || 'Unknown Doctor'}</p>
              </div>
              
              {apt.patientName && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="font-medium">{apt.patientName}</p>
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">Status</p>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  apt.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
                  apt.status === 'in-progress' ? 'bg-green-100 text-green-800' : 
                  apt.status === 'completed' ? 'bg-gray-100 text-gray-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {apt.status === 'upcoming' ? 'Scheduled' : 
                   apt.status === 'in-progress' ? 'In Progress' : 
                   apt.status === 'completed' ? 'Completed' : 
                   'Pending'}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => navigate(`/teleconsult/${apt.id}`)}
                  className={`w-full py-2 px-4 rounded-md transition-colors flex items-center justify-center ${
                    apt.status === 'upcoming' || apt.status === 'scheduled' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 
                    apt.status === 'in-progress' ? 'bg-green-600 hover:bg-green-700 text-white' : 
                    'bg-gray-200 text-gray-700 cursor-not-allowed'
                  }`}
                  disabled={apt.status === 'completed' || apt.status === 'cancelled'}
                >
                  {apt.status === 'upcoming' || apt.status === 'scheduled' ? (
                    <>
                      <Video size={18} className="mr-2" />
                      Join Video Call
                    </>
                  ) : apt.status === 'in-progress' ? (
                    <>
                      <Video size={18} className="mr-2" />
                      Continue Consultation
                    </>
                  ) : (
                    <>
                      <Calendar size={18} className="mr-2" />
                      Consultation Ended
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => {
                    const audioApt = {...apt, type: 'audio'};
                    setAppointment(audioApt);
                    navigate(`/teleconsult/${apt.id}?mode=audio`);
                  }}
                  className={`w-full py-2 px-4 rounded-md transition-colors flex items-center justify-center ${
                    apt.status === 'upcoming' || apt.status === 'scheduled' ? 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50' : 
                    apt.status === 'in-progress' ? 'bg-white border border-green-600 text-green-600 hover:bg-green-50' : 
                    'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={apt.status === 'completed' || apt.status === 'cancelled'}
                >
                  <Phone size={18} className="mr-2" />
                  Audio Only
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  // Simulate network test
  const runNetworkTest = () => {
    setIsLoading(true);
    
    // In a real implementation, this would actually test network conditions
    setTimeout(() => {
      // Simulate network test results
      const testResults = {
        latency: Math.floor(Math.random() * 200) + 50, // 50-250ms
        download: Math.floor(Math.random() * 10) + 5, // 5-15 Mbps
        upload: Math.floor(Math.random() * 5) + 2, // 2-7 Mbps
        suitable: true // Determined based on thresholds
      };
      
      // Check if network conditions are suitable
      if (testResults.latency > 300 || testResults.download < 3 || testResults.upload < 1) {
        testResults.suitable = false;
      }
      
      setNetworkStatus(testResults);
      setNetworkTestComplete(true);
      setIsLoading(false);
    }, 2000);
  };
  
  // Start the call
  const startCall = () => {
    // In a real implementation, this would initialize the WebRTC connection
    // or connect to your video conferencing service
    setCallStarted(true);
    
    // Update appointment status to in-progress
    if (appointment) {
      setAppointment({
        ...appointment,
        status: 'in-progress'
      });
    }
  };
  
  // End the call
  const endCall = () => {
    setCallEnded(true);
    setCallStarted(false);
    
    // Update appointment status to completed
    if (appointment) {
      setAppointment({
        ...appointment,
        status: 'completed'
      });
    }
  };
  
  // Return to appointments page
  const returnToDashboard = () => {
    navigate('/appointments');
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* If no specific appointment is selected, show the list of teleconsultation appointments */}
      {!appointmentId ? (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-900">Teleconsultation Sessions</h1>
            <button 
              onClick={() => navigate('/appointments')}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Calendar size={18} className="mr-2" />
              Schedule New
            </button>
          </div>
          
          {renderAppointmentsList()}
        </div>
      ) : (
        <>
          {/* If appointment is loaded and call is not started, show appointment details */}
          {appointment && !callStarted && !callEnded && (
            <div className="container mx-auto px-4 py-8">
              <button 
                onClick={() => navigate('/teleconsult')}
                className="flex items-center text-blue-600 mb-6 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to All Sessions
              </button>
              
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 text-white p-6">
                  <h1 className="text-2xl font-bold">Teleconsultation with {doctor?.name || appointment.doctorName}</h1>
                  <div className="flex items-center mt-2">
                    <Calendar size={18} className="mr-2" />
                    <span>{appointment.date}</span>
                    <Clock size={18} className="ml-4 mr-2" />
                    <span>{appointment.time}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Doctor information */}
                  <div className="flex items-start mb-8">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                      {doctor?.profileImage ? (
                        <img src={doctor.profileImage} alt={doctor?.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={32} className="text-gray-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-semibold">{doctor?.name || appointment.doctorName}</h2>
                      <p className="text-gray-600">{doctor?.specialty || 'Specialist'}</p>
                      {doctor?.hospital && <p className="text-gray-600">{doctor.hospital}</p>}
                    </div>
                  </div>
                  
                  {/* Network test section */}
                  {!networkTestComplete ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-blue-800 mb-2">Connection Test</h3>
                      <p className="text-gray-700 mb-4">
                        To ensure the best experience, we recommend testing your connection before starting the consultation.
                      </p>
                      <button 
                        onClick={runNetworkTest}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>
                  ) : (
                    <div className={`bg-${networkStatus.suitable ? 'green' : 'yellow'}-50 border border-${networkStatus.suitable ? 'green' : 'yellow'}-200 rounded-lg p-4 mb-6`}>
                      <h3 className={`font-semibold text-${networkStatus.suitable ? 'green' : 'yellow'}-800 mb-2`}>
                        Connection {networkStatus.suitable ? 'Good' : 'Warning'}
                      </h3>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-gray-600 text-sm">Latency</p>
                          <p className="font-semibold">{networkStatus.latency} ms</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Download</p>
                          <p className="font-semibold">{networkStatus.download} Mbps</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Upload</p>
                          <p className="font-semibold">{networkStatus.upload} Mbps</p>
                        </div>
                      </div>
                      {!networkStatus.suitable && (
                        <p className="text-yellow-700 text-sm mb-2">
                          Your connection may not be optimal for video consultation. Consider using audio-only mode.
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Call options */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <button 
                      onClick={startCall}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                      disabled={isLoading}
                    >
                      <Video size={20} className="mr-2" />
                      Start Video Consultation
                    </button>
                    <button 
                      onClick={() => {
                        if (appointment) {
                          setAppointment({...appointment, type: 'audio'});
                          startCall();
                        }
                      }}
                      className="flex-1 bg-white border border-blue-600 text-blue-600 py-3 px-4 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center"
                      disabled={isLoading}
                    >
                      <Phone size={20} className="mr-2" />
                      Audio Only
                    </button>
                    <button 
                      onClick={() => navigate('/support')}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <MessageCircle size={20} className="mr-2" />
                      Get Help
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* If call is active, show the telehealth interface */}
          {callStarted && appointment && (
            <TelehealthCall
              appointmentId={appointment.id}
              doctorId={appointment.doctorId}
              patientId={appointment.patientId || 'patient123'}
              isDoctor={userRole === 'doctor'}
              appointmentTime={`${appointment.date} ${appointment.time}`}
              appointmentType={appointment.type === 'audio' ? 'audio' : 'video'}
              onEndCall={endCall}
            />
          )}
          
          {/* If call ended, show summary */}
          {callEnded && appointment && (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
              <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Consultation Complete</h2>
                  <p className="text-gray-600 mt-2">Your teleconsultation has ended successfully.</p>
                </div>
                
                <div className="border-t border-b border-gray-200 py-4 my-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Doctor:</span>
                    <span className="font-medium">{doctor?.name || appointment.doctorName}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{appointment.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{appointment.time}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 mt-6">
                  <button 
                    onClick={returnToDashboard}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Return to Appointments
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
  
  // Pre-call setup and network test
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button 
              onClick={returnToDashboard}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Telehealth Session</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Appointment details */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Appointment Details</h2>
            
            {appointment && doctor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <User className="text-blue-500 mr-3 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Doctor</p>
                    <p className="font-medium">{doctor.name}</p>
                    <p className="text-sm text-gray-500">{doctor.specialty}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="text-blue-500 mr-3 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{appointment.date}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="text-blue-500 mr-3 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{appointment.time}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  {appointment.type === 'video' ? (
                    <Video className="text-blue-500 mr-3 mt-1" size={20} />
                  ) : (
                    <Phone className="text-blue-500 mr-3 mt-1" size={20} />
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Consultation Type</p>
                    <p className="font-medium capitalize">{appointment.type} call</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Network test */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Connection Test</h2>
            
            {!networkTestComplete ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Before starting your telehealth session, we recommend testing your internet connection to ensure the best experience.
                </p>
                
                <button 
                  onClick={runNetworkTest}
                  disabled={isLoading}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⟳</span>
                      Testing Connection...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Latency</p>
                    <p className="text-xl font-semibold">{networkStatus.latency} ms</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {networkStatus.latency < 100 ? 'Excellent' : 
                       networkStatus.latency < 200 ? 'Good' : 
                       networkStatus.latency < 300 ? 'Fair' : 'Poor'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Download Speed</p>
                    <p className="text-xl font-semibold">{networkStatus.download} Mbps</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {networkStatus.download > 10 ? 'Excellent' : 
                       networkStatus.download > 5 ? 'Good' : 
                       networkStatus.download > 3 ? 'Fair' : 'Poor'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Upload Speed</p>
                    <p className="text-xl font-semibold">{networkStatus.upload} Mbps</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {networkStatus.upload > 5 ? 'Excellent' : 
                       networkStatus.upload > 3 ? 'Good' : 
                       networkStatus.upload > 1 ? 'Fair' : 'Poor'}
                    </p>
                  </div>
                </div>
                
                {networkStatus.suitable ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Your connection is suitable for a telehealth call</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>You should have a good quality experience during your telehealth session.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Your connection may not be optimal</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>You may experience some issues during your telehealth session. Consider the following:</p>
                          <ul className="list-disc pl-5 mt-1">
                            <li>Connect to a stronger WiFi signal or use a wired connection</li>
                            <li>Close other applications that might be using your internet connection</li>
                            <li>Consider switching to an audio-only call if video quality is poor</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={runNetworkTest}
                  className="text-blue-600 underline mr-4 hover:text-blue-800"
                >
                  Run Test Again
                </button>
              </div>
            )}
          </div>
          
          {/* Start call */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-lg font-medium text-gray-900">Ready to start?</h2>
                <p className="text-gray-600">
                  {appointment?.type === 'video' ? 
                    'Make sure your camera and microphone are working properly.' : 
                    'Make sure your microphone is working properly.'}
                </p>
              </div>
              
              <button 
                onClick={startCall}
                disabled={isLoading}
                className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center"
              >
                {appointment?.type === 'video' ? (
                  <>
                    <Video size={20} className="mr-2" />
                    Start Video Call
                  </>
                ) : (
                  <>
                    <Phone size={20} className="mr-2" />
                    Start Audio Call
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TelehealthSessionPage;