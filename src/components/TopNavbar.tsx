import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Heart, Bell, User } from 'lucide-react';

interface TopNavbarProps {
  toggleSideNav: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ toggleSideNav }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-900 text-white z-50 h-16 flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center">
        <button 
          onClick={toggleSideNav} 
          className="mr-4 p-1 rounded-full hover:bg-blue-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <Link to="/" className="text-xl font-bold tracking-wider mr-8">MediCarePro</Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-yellow-300 transition-colors">Home</Link>
          <Link to="/face-scan" className="hover:text-yellow-300 transition-colors">Face Scan</Link>
          <Link to="/patient-dashboard" className="hover:text-yellow-300 transition-colors">Dashboard</Link>
          <Link to="/emergency" className="hover:text-yellow-300 transition-colors">Emergency</Link>
        </nav>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-1 rounded-full hover:bg-blue-800 transition-colors" aria-label="Health stats">
          <Heart size={20} />
        </button>
        <button className="p-1 rounded-full hover:bg-blue-800 transition-colors" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button className="p-1 rounded-full hover:bg-blue-800 transition-colors" aria-label="Profile">
          <User size={20} />
        </button>
        <button className="hidden md:block bg-yellow-400 text-blue-900 px-4 py-2 rounded-md font-bold hover:bg-yellow-500 transition-colors">
          Book Appointment
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;