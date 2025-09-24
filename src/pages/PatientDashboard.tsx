import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  FileText, 
  Calendar, 
  PenSquare, 
  Activity, 
  Pill, 
  Clock, 
  User, 
  Phone,
  AlertTriangle
} from 'lucide-react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const PatientDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  
  const tabs = [
    { name: 'Medical Records', icon: <FileText size={20} /> },
    { name: 'Appointments', icon: <Calendar size={20} /> },
    { name: 'Prescriptions', icon: <Pill size={20} /> },
    { name: 'Health Metrics', icon: <Activity size={20} /> },
  ];

  // Mock patient data
  const patientInfo = {
    name: 'John Doe',
    age: 32,
    gender: 'Male',
    bloodType: 'A+',
    contactNumber: '+1 (555) 123-4567',
    address: '123 Main St, Anytown, USA',
    emergencyContact: 'Sarah Doe (+1 555-987-6543)',
    primaryDoctor: 'Dr. Sarah Johnson'
  };

  // Mock medical records
  const medicalRecords = [
    {
      date: '2023-06-15',
      doctor: 'Dr. Sarah Johnson',
      diagnosis: 'Seasonal allergies',
      notes: 'Patient presented with nasal congestion and itchy eyes. Prescribed antihistamines.'
    },
    {
      date: '2022-11-22',
      doctor: 'Dr. Michael Chen',
      diagnosis: 'Influenza type A',
      notes: 'High fever, body aches, and fatigue. Rest and fluids recommended. Prescribed Tamiflu.'
    },
    {
      date: '2022-03-08',
      doctor: 'Dr. Emily Patel',
      diagnosis: 'Mild hypertension',
      notes: 'Blood pressure slightly elevated. Recommended dietary changes and regular monitoring.'
    }
  ];

  // Mock appointments
  const appointments = [
    {
      id: 1,
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      date: '2023-07-15',
      time: '10:00 AM',
      status: 'Upcoming',
      type: 'In-person'
    },
    {
      id: 2,
      doctor: 'Dr. Michael Chen',
      specialty: 'Neurologist',
      date: '2023-07-03',
      time: '2:30 PM',
      status: 'Completed',
      type: 'Teleconsultation'
    },
    {
      id: 3,
      doctor: 'Dr. Emily Patel',
      specialty: 'Pediatrician',
      date: '2023-06-20',
      time: '9:15 AM',
      status: 'Cancelled',
      type: 'Teleconsultation'
    }
  ];

  // Mock prescriptions
  const prescriptions = [
    {
      id: 1,
      name: 'Amoxicillin',
      dosage: '500mg',
      frequency: '3 times daily',
      startDate: '2023-06-15',
      endDate: '2023-06-25',
      doctor: 'Dr. Sarah Johnson',
      refillsLeft: 0
    },
    {
      id: 2,
      name: 'Loratadine',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: '2023-06-15',
      endDate: 'Ongoing',
      doctor: 'Dr. Sarah Johnson',
      refillsLeft: 2
    },
    {
      id: 3,
      name: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'As needed for pain',
      startDate: '2023-01-10',
      endDate: 'As needed',
      doctor: 'Dr. Michael Chen',
      refillsLeft: 1
    }
  ];

  // Mock health metrics
  const healthMetrics = {
    heartRate: [
      { date: '2023-06-01', value: 72 },
      { date: '2023-06-08', value: 75 },
      { date: '2023-06-15', value: 70 },
      { date: '2023-06-22', value: 68 },
      { date: '2023-06-29', value: 73 }
    ],
    bloodPressure: [
      { date: '2023-06-01', systolic: 120, diastolic: 80 },
      { date: '2023-06-08', systolic: 118, diastolic: 78 },
      { date: '2023-06-15', systolic: 122, diastolic: 82 },
      { date: '2023-06-22', systolic: 119, diastolic: 79 },
      { date: '2023-06-29', systolic: 121, diastolic: 81 }
    ],
    weight: [
      { date: '2023-06-01', value: 70.5 },
      { date: '2023-06-15', value: 70.2 },
      { date: '2023-06-29', value: 70.0 }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Patient Dashboard</h1>
        <p className="text-gray-600">
          View your medical records, appointments, and health metrics all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Patient Info Card */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-900 rounded-full p-3 text-white mr-4">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">{patientInfo.name}</h2>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div>
                  <span className="text-gray-600">Age:</span> {patientInfo.age}
                </div>
                <div>
                  <span className="text-gray-600">Gender:</span> {patientInfo.gender}
                </div>
                <div>
                  <span className="text-gray-600">Blood Type:</span> {patientInfo.bloodType}
                </div>
                <div>
                  <span className="text-gray-600">Primary Doctor:</span> {patientInfo.primaryDoctor}
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <button className="inline-flex items-center text-blue-700 hover:text-blue-900 transition-colors mr-4">
                  <PenSquare size={16} className="mr-1" /> Edit Profile
                </button>
                <button className="inline-flex items-center text-blue-700 hover:text-blue-900 transition-colors">
                  <Phone size={16} className="mr-1" /> Contact Doctor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointment Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
            <Clock size={20} className="mr-2" /> Next Appointment
          </h3>
          {appointments.filter(a => a.status === 'Upcoming').length > 0 ? (
            <div>
              <p className="text-lg font-semibold">{appointments[0].doctor}</p>
              <p className="text-gray-600">{appointments[0].specialty}</p>
              <div className="mt-2 flex items-center text-gray-700">
                <Calendar size={16} className="mr-1" /> 
                <span>{appointments[0].date} at {appointments[0].time}</span>
              </div>
              <div className="mt-4">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {appointments[0].type}
                </span>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="bg-blue-900 text-white px-3 py-1 rounded text-sm hover:bg-blue-800 transition-colors">
                  Join Call
                </button>
                <button className="border border-red-500 text-red-500 px-3 py-1 rounded text-sm hover:bg-red-50 transition-colors">
                  Reschedule
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">No upcoming appointments</p>
              <button className="mt-2 bg-blue-900 text-white px-4 py-2 rounded text-sm hover:bg-blue-800 transition-colors">
                Schedule Appointment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Detection and Book Appointment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Emergency Detection Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
          <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
            <AlertTriangle size={20} className="mr-2" /> Emergency Detection
          </h3>
          <p className="text-gray-700 mb-4">
            Our intelligent system uses your device's sensors to detect accidents and automatically alert emergency services.
          </p>
          <button 
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm w-full"
            onClick={() => window.location.href = '/emergency'}
          >
            Activate Emergency Detection
          </button>
        </div>
        
        {/* Book Appointment Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
            <Calendar size={20} className="mr-2" /> Book Appointment
          </h3>
          <p className="text-gray-700 mb-4">
            Schedule a consultation with one of our specialists at your convenience, either in-person or via teleconsultation.
          </p>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm w-full"
            onClick={() => window.location.href = '/appointments'}
          >
            Schedule New Appointment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex rounded-t-lg bg-gray-100 border-b">
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                className={({ selected }) =>
                  classNames(
                    'flex items-center py-4 px-6 text-sm font-medium outline-none',
                    selected
                      ? 'text-blue-900 border-b-2 border-blue-900 bg-white'
                      : 'text-gray-600 hover:text-blue-800 hover:bg-white/[0.5]'
                  )
                }
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="p-6">
            {/* Medical Records Panel */}
            <Tab.Panel>
              <h3 className="text-xl font-bold text-blue-900 mb-4">Medical History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medicalRecords.map((record, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.doctor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.diagnosis}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{record.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tab.Panel>

            {/* Appointments Panel */}
            <Tab.Panel>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-blue-900">Appointments</h3>
                <button className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors text-sm">
                  + New Appointment
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{appointment.doctor}</div>
                          <div className="text-sm text-gray-500">{appointment.specialty}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{appointment.date}</div>
                          <div className="text-sm text-gray-500">{appointment.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {appointment.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full 
                            ${appointment.status === 'Upcoming' ? 'bg-green-100 text-green-800' : 
                              appointment.status === 'Completed' ? 'bg-gray-100 text-gray-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.status === 'Upcoming' && (
                            <div className="flex space-x-2">
                              {appointment.type === 'Teleconsultation' && (
                                <button className="text-blue-700 hover:text-blue-900">Join</button>
                              )}
                              <button className="text-yellow-600 hover:text-yellow-800">Reschedule</button>
                              <button className="text-red-600 hover:text-red-800">Cancel</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tab.Panel>

            {/* Prescriptions Panel */}
            <Tab.Panel>
              <h3 className="text-xl font-bold text-blue-900 mb-4">Current Medications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between">
                      <h4 className="text-lg font-bold text-blue-900">{prescription.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full 
                        ${prescription.refillsLeft > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {prescription.refillsLeft > 0 ? `${prescription.refillsLeft} refills left` : 'No refills'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {prescription.dosage} - {prescription.frequency}
                    </p>
                    <div className="mt-2 text-xs text-gray-600">
                      <p>Prescribed by: {prescription.doctor}</p>
                      <p>Start date: {prescription.startDate}</p>
                      <p>End date: {prescription.endDate}</p>
                    </div>
                    {prescription.refillsLeft > 0 && (
                      <button className="mt-3 text-sm text-blue-700 hover:text-blue-900">
                        Request Refill
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Tab.Panel>

            {/* Health Metrics Panel */}
            <Tab.Panel>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-blue-900">Health Metrics</h3>
                <a href="/monitoring" className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors text-sm flex items-center">
                  <Activity size={16} className="mr-1" />
                  View Full Monitoring Dashboard
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Heart Rate Card */}
                <div className="border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-blue-900 mb-2">Heart Rate</h4>
                  <div className="h-40 bg-gray-50 rounded p-2 flex items-end">
                    {/* Simple chart visualization */}
                    {healthMetrics.heartRate.map((data, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-blue-600 rounded-t"
                          style={{ height: `${data.value / 2}%` }}
                        ></div>
                        <div className="text-xs mt-1">{data.date.split('-')[2]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-center text-gray-600">
                    <span>Average: </span>
                    <span className="font-medium">
                      {Math.round(healthMetrics.heartRate.reduce((acc, curr) => acc + curr.value, 0) / healthMetrics.heartRate.length)} bpm
                    </span>
                  </div>
                </div>

                {/* Blood Pressure Card */}
                <div className="border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-blue-900 mb-2">Blood Pressure</h4>
                  <div className="h-40 bg-gray-50 rounded p-2 flex items-end">
                    {/* Simple BP visualization */}
                    {healthMetrics.bloodPressure.map((data, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="relative w-8">
                          <div 
                            className="absolute bottom-0 w-full bg-red-600 rounded-t"
                            style={{ height: `${data.systolic / 2}%` }}
                          ></div>
                          <div 
                            className="absolute bottom-0 w-full bg-blue-600 rounded-t"
                            style={{ height: `${data.diastolic / 2}%` }}
                          ></div>
                        </div>
                        <div className="text-xs mt-1">{data.date.split('-')[2]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-center text-gray-600">
                    <span>Latest: </span>
                    <span className="font-medium">
                      {healthMetrics.bloodPressure[healthMetrics.bloodPressure.length - 1].systolic}/
                      {healthMetrics.bloodPressure[healthMetrics.bloodPressure.length - 1].diastolic} mmHg
                    </span>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default PatientDashboard;