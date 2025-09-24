import React, { useState } from 'react';
import { Phone, Video, MessageSquare, Share2, ExternalLink } from 'lucide-react';

interface RealLifeCallOptionsProps {
  doctorName: string;
  doctorPhone?: string;
  doctorEmail?: string;
  supportedPlatforms?: {
    name: string;
    icon: string;
    url?: string;
    appLink?: string;
  }[];
}

const RealLifeCallOptions: React.FC<RealLifeCallOptionsProps> = ({
  doctorName,
  doctorPhone = "+1 (555) 123-4567", // Default mock phone number
  doctorEmail = "doctor@example.com",
  supportedPlatforms = [
    { name: "WhatsApp", icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg", appLink: "whatsapp://send?phone=15551234567" },
    { name: "Zoom", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Zoom_logo.svg/320px-Zoom_logo.svg.png", url: "https://zoom.us/start" },
    { name: "Google Meet", icon: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon.svg", url: "https://meet.google.com/new" },
    { name: "Practo", icon: "https://www.practo.com/providers/static/images/practo.svg", url: "https://www.practo.com" },
    { name: "DocOnline", icon: "https://doconline.com/assets/images/logo/logo-doconline.svg", url: "https://doconline.com" }
  ]
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Handle direct phone call
  const handlePhoneCall = () => {
    // In a real app, this would use the tel: protocol to initiate a call
    window.location.href = `tel:${doctorPhone}`;
  };

  // Handle email
  const handleEmail = () => {
    // In a real app, this would use the mailto: protocol
    window.location.href = `mailto:${doctorEmail}?subject=Medical%20Consultation%20Request`;
  };

  // Handle platform selection
  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
    setShowInstructions(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">Contact {doctorName} Directly</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Contact Options</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handlePhoneCall}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <Phone size={18} className="mr-2" />
            Call Mobile
          </button>
          
          <button 
            onClick={handleEmail}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <MessageSquare size={18} className="mr-2" />
            Send Email
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Connect via Telemedicine Apps</h3>
        <p className="text-gray-600 mb-4">
          Your doctor supports consultations through the following platforms. Select one to get started:
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {supportedPlatforms.map((platform) => (
            <div 
              key={platform.name}
              onClick={() => handlePlatformSelect(platform.name)}
              className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${selectedPlatform === platform.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <img 
                src={platform.icon} 
                alt={platform.name} 
                className="w-10 h-10 object-contain mb-2" 
              />
              <span className="text-sm font-medium text-center">{platform.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {showInstructions && selectedPlatform && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Connect via {selectedPlatform}</h3>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Instructions:</h4>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
              <li>Make sure you have {selectedPlatform} installed on your device</li>
              <li>Open the app and sign in to your account</li>
              <li>Search for your doctor using their contact information</li>
              <li>Initiate a call at your scheduled appointment time</li>
              <li>Ensure your camera and microphone permissions are enabled</li>
            </ol>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {supportedPlatforms.find(p => p.name === selectedPlatform)?.url && (
              <a 
                href={supportedPlatforms.find(p => p.name === selectedPlatform)?.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <ExternalLink size={18} className="mr-2" />
                Open {selectedPlatform} Website
              </a>
            )}
            
            {supportedPlatforms.find(p => p.name === selectedPlatform)?.appLink && (
              <a 
                href={supportedPlatforms.find(p => p.name === selectedPlatform)?.appLink || '#'}
                className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Share2 size={18} className="mr-2" />
                Open in {selectedPlatform} App
              </a>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Tips for a Successful Call</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>Ensure you have a stable internet connection (preferably WiFi)</li>
          <li>Use headphones for better audio quality</li>
          <li>Find a quiet, well-lit location for your call</li>
          <li>Have your medical history and current medications list ready</li>
          <li>Prepare questions you want to ask your doctor</li>
          <li>If video quality is poor, be prepared to switch to an audio-only call</li>
        </ul>
      </div>
    </div>
  );
};

export default RealLifeCallOptions;