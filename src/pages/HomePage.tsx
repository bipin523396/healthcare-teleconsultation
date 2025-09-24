import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import ServiceCard from '../components/ServiceCard';
import DoctorCard from '../components/DoctorCard';

const services = [
  { 
    icon: '🩺', 
    title: 'Online Consultation', 
    description: 'Connect with top doctors remotely from the comfort of your home.' 
  },
  { 
    icon: '💊', 
    title: 'Digital Prescriptions', 
    description: 'Get prescriptions online and have medicines delivered to your doorstep.' 
  },
  { 
    icon: '📱', 
    title: 'Health Monitoring', 
    description: 'Track vital signs and share data with your healthcare provider in real-time.' 
  },
  { 
    icon: '🚑', 
    title: 'Emergency Response', 
    description: 'Automatic accident detection with immediate alert to emergency services.' 
  },
];

const doctors = [
  {
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    image: 'https://randomuser.me/api/portraits/women/45.jpg'
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'Neurologist',
    image: 'https://randomuser.me/api/portraits/men/33.jpg'
  },
  {
    name: 'Dr. Emily Patel',
    specialty: 'Pediatrician',
    image: 'https://randomuser.me/api/portraits/women/65.jpg'
  },
];

const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      <HeroSection />

      {/* Services Section */}
      <section id="services" className="py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-900 border-b-4 border-yellow-400 pb-2 inline-block">
            Our Services
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <ServiceCard 
              key={index} 
              icon={service.icon} 
              title={service.title} 
              description={service.description}
            />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link 
            to="/face-scan"
            className="inline-flex items-center text-blue-900 font-semibold hover:text-blue-700 transition-colors"
          >
            Face Scan for Patient Identification <ArrowRight className="ml-2" size={18} />
          </Link>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-900 border-b-4 border-yellow-400 pb-2 inline-block">
            Meet Our Doctors
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {doctors.map((doctor, index) => (
            <DoctorCard 
              key={index} 
              name={doctor.name} 
              specialty={doctor.specialty}
              imageUrl={doctor.image}
            />
          ))}
        </div>
      </section>

      {/* Emergency and Appointment Section */}
      <section id="emergency-appointment" className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emergency Feature Card */}
          <div className="bg-blue-900 text-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-12" style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1470&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundBlendMode: "overlay",
              backgroundColor: "rgba(30, 58, 138, 0.85)"
            }}>
              <h2 className="text-3xl font-bold mb-4">Emergency Accident Detection</h2>
              <p className="text-lg mb-6">Our integrated accident detection system uses your device's motion sensors to automatically detect accidents and alert emergency contacts.</p>
              <Link to="/emergency" className="inline-block bg-yellow-400 text-blue-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors">
                Learn More About Emergency Features
              </Link>
            </div>
          </div>
          
          {/* Book Appointment Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-blue-600">
            <div className="px-6 py-12">
              <h2 className="text-3xl font-bold text-blue-800 mb-4">Book an Appointment</h2>
              <p className="text-lg text-gray-700 mb-6">Schedule a consultation with one of our specialists at your convenience, either in-person or via teleconsultation.</p>
              <Link to="/appointments" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Schedule Appointment Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;