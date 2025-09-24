import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  Calendar, 
  FileText, 
  CreditCard, 
  HeartPulse, 
  Video, 
  HelpCircle, 
  ChevronLeft,
  ChevronRight,
  UserCog,
  Bot
} from 'lucide-react';

interface SideNavbarProps {
  isOpen: boolean;
  onAiAgentClick?: () => void;
}

const SideNavbar: React.FC<SideNavbarProps> = ({ isOpen, onAiAgentClick }) => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, text: 'Dashboard', link: '/patient-dashboard' },
    { icon: <UserPlus size={20} />, text: 'Registration', link: '/face-scan' },
    { icon: <Calendar size={20} />, text: 'Appointments', link: '/appointments' },
    { icon: <FileText size={20} />, text: 'Medical Records', link: '/records' },
    { icon: <CreditCard size={20} />, text: 'Billing', link: '/billing' },
    { icon: <HeartPulse size={20} />, text: 'Health Monitoring', link: '/monitoring' },
    { icon: <Video size={20} />, text: 'Teleconsultation', link: '/teleconsult' },
    { icon: <Bot size={20} />, text: 'AI Assistant', link: '#', onClick: onAiAgentClick },
    { icon: <HelpCircle size={20} />, text: 'Support', link: '/support' },
  ];
  
  const adminItems = [
    { icon: <UserCog size={20} />, text: 'Doctor Management', link: '/admin/doctors' },
  ];

  return (
    <aside 
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-blue-950 text-white 
        transition-all duration-300 ease-in-out z-40
        ${isOpen ? 'w-56' : 'w-16'}`}
    >
      <nav className="h-full flex flex-col">
        <ul className="flex-1 py-4">
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.onClick ? (
                <button 
                  onClick={item.onClick} 
                  className="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors w-full text-left"
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={`ml-4 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 overflow-hidden w-0'} transition-all duration-300`}>
                    {item.text}
                  </span>
                </button>
              ) : (
                <Link to={item.link} className="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={`ml-4 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 overflow-hidden w-0'} transition-all duration-300`}>
                    {item.text}
                  </span>
                </Link>
              )}
            </li>
          ))}
          
          {/* Admin Section */}
          <li className="mt-8 px-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</h3>
            <ul className="mt-2">
              {adminItems.map((item, index) => (
                <li key={`admin-${index}`}>
                  <Link to={item.link} className="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className={`ml-4 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 overflow-hidden w-0'} transition-all duration-300`}>
                      {item.text}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
        <div className="px-4 py-2 mt-auto border-t border-blue-800">
          <div className="flex items-center text-sm text-gray-300">
            <span className="flex-shrink-0">
              {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </span>
            <span className={`ml-2 ${isOpen ? 'opacity-100' : 'opacity-0 overflow-hidden w-0'} transition-all duration-300`}>
              Collapse Menu
            </span>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default SideNavbar;