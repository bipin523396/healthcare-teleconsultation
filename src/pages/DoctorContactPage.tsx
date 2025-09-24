import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Clock, Calendar } from 'lucide-react';
import RealLifeCallOptions from '../components/RealLifeCallOptions';
import doctorService from '../services/DoctorService';

const DoctorContactPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch doctor details
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        setLoading(true);
        
        if (!doctorId) {
          setError('Doctor ID is required');
          setLoading(false);
          return;
        }
        
        // Fetch doctor from service
        const doctorDetails = await doctorService.getDoctorById(doctorId);
        
        if (!doctorDetails) {
          setError('Doctor not found');
          setLoading(false);
          return;
        }
        
        setDoctor(doctorDetails);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching doctor details:', err);
        setError('Failed to load doctor details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDoctorDetails();
  }, [doctorId]);
  
  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading doctor details...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={handleBack}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // If no doctor is found but no error (edge case)
  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Doctor Not Found</h2>
          <p className="text-gray-700 mb-6">We couldn't find the doctor you're looking for.</p>
          <button 
            onClick={handleBack}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Mock additional contact details
  const officeAddress = "123 Medical Center Blvd, Suite 456, San Francisco, CA 94143";
  const officeHours = [
    { day: "Monday - Friday", hours: "9:00 AM - 5:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 2:00 PM" },
    { day: "Sunday", hours: "Closed" }
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button 
              onClick={handleBack}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Contact Doctor</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <img 
                src={doctor.imageUrl} 
                alt={doctor.name} 
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-900"
              />
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-blue-900">{doctor.name}</h2>
                <p className="text-gray-600">{doctor.specialty}</p>
                <div className="flex items-center mt-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm ml-1">{doctor.rating}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Phone className="text-blue-500 mr-3 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{doctor.phone || "+1 (555) 123-4567"}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="text-blue-500 mr-3 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{doctor.email || "doctor@example.com"}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="text-blue-500 mr-3 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Office Address</p>
                  <p className="font-medium">{officeAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <User className="text-blue-500 mr-3 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Languages</p>
                  <p className="font-medium">{doctor.languages?.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Office Hours</h3>
            
            <div className="space-y-3">
              {officeHours.map((schedule, index) => (
                <div key={index} className="flex items-start">
                  <Calendar className="text-blue-500 mr-3 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">{schedule.day}</p>
                    <p className="font-medium">{schedule.hours}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Real Life Call Options Component */}
        <RealLifeCallOptions 
          doctorName={doctor.name}
          doctorPhone={doctor.phone || "+1 (555) 123-4567"}
          doctorEmail={doctor.email || "doctor@example.com"}
        />
      </main>
    </div>
  );
};

export default DoctorContactPage;