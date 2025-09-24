import React from 'react';

interface DoctorCardProps {
  name: string;
  specialty: string;
  imageUrl: string;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ name, specialty, imageUrl }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col items-center text-center">
      <img 
        src={imageUrl} 
        alt={name} 
        className="w-32 h-32 rounded-full object-cover border-4 border-blue-900 mb-4"
      />
      <h3 className="text-xl font-bold text-blue-900 mb-1">{name}</h3>
      <p className="text-gray-600 mb-4">{specialty}</p>
      <button className="bg-blue-900 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-800 transition-colors">
        Book Appointment
      </button>
    </div>
  );
};

export default DoctorCard;