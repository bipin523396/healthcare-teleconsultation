import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <section className="relative rounded-xl overflow-hidden">
      <div 
        className="h-96 bg-gradient-to-r from-blue-900 to-blue-800 py-12 px-8 flex flex-col justify-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1470&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay"
        }}
      >
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Health, <span className="text-yellow-400">Our Priority</span>
          </h1>
          <p className="text-lg text-gray-100 mb-8">
            Connect with experienced doctors from anywhere using our AI-powered telemedicine platform. 
            From consultations to emergency care, we're here for you 24/7.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/face-scan" 
              className="inline-flex items-center bg-yellow-400 text-blue-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
            >
              Start Face Scan <ArrowRight className="ml-2" size={18} />
            </Link>
            <Link 
              to="/emergency" 
              className="inline-flex items-center bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors"
            >
              Emergency Detection
            </Link>
            <Link 
              to="/appointments" 
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;