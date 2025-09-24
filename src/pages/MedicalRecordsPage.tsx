import React, { useState } from 'react';
import { FileText, Upload, Lock, Clock, Search, Filter, Download, Eye, Plus } from 'lucide-react';

interface MedicalRecord {
  id: string;
  type: 'prescription' | 'lab_report' | 'imaging' | 'discharge' | 'other';
  title: string;
  date: string;
  doctor: string;
  description: string;
  fileUrl: string;
  tags: string[];
}

interface AccessLog {
  id: string;
  user: string;
  role: string;
  action: 'viewed' | 'downloaded' | 'edited' | 'uploaded';
  timestamp: string;
  recordId: string;
}

const MedicalRecordsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'prescriptions' | 'lab_reports' | 'imaging' | 'discharge'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAccessLog, setShowAccessLog] = useState(false);
  
  // Mock medical records data
  const records: MedicalRecord[] = [
    {
      id: 'rec1',
      type: 'prescription',
      title: 'Amoxicillin Prescription',
      date: '2024-06-15',
      doctor: 'Dr. Sarah Johnson',
      description: 'Prescription for seasonal allergies treatment',
      fileUrl: '#',
      tags: ['medication', 'allergies']
    },
    {
      id: 'rec2',
      type: 'lab_report',
      title: 'Complete Blood Count (CBC)',
      date: '2024-05-22',
      doctor: 'Dr. Michael Chen',
      description: 'Routine blood work results',
      fileUrl: '#',
      tags: ['blood test', 'routine']
    },
    {
      id: 'rec3',
      type: 'imaging',
      title: 'Chest X-Ray',
      date: '2024-04-10',
      doctor: 'Dr. Emily Patel',
      description: 'Chest X-ray for respiratory symptoms',
      fileUrl: '#',
      tags: ['x-ray', 'respiratory']
    },
    {
      id: 'rec4',
      type: 'discharge',
      title: 'Hospital Discharge Summary',
      date: '2023-11-05',
      doctor: 'Dr. Sarah Johnson',
      description: 'Discharge summary after appendectomy procedure',
      fileUrl: '#',
      tags: ['surgery', 'appendectomy', 'hospital']
    },
    {
      id: 'rec5',
      type: 'lab_report',
      title: 'Lipid Panel',
      date: '2023-10-18',
      doctor: 'Dr. Michael Chen',
      description: 'Cholesterol and triglycerides test results',
      fileUrl: '#',
      tags: ['cholesterol', 'heart health']
    },
  ];
  
  // Mock access logs
  const accessLogs: AccessLog[] = [
    {
      id: 'log1',
      user: 'Dr. Sarah Johnson',
      role: 'Primary Physician',
      action: 'viewed',
      timestamp: '2024-06-20 14:32:45',
      recordId: 'rec1'
    },
    {
      id: 'log2',
      user: 'John Doe',
      role: 'Patient',
      action: 'downloaded',
      timestamp: '2024-06-19 10:15:22',
      recordId: 'rec1'
    },
    {
      id: 'log3',
      user: 'Dr. Michael Chen',
      role: 'Specialist',
      action: 'viewed',
      timestamp: '2024-06-18 09:45:11',
      recordId: 'rec2'
    },
    {
      id: 'log4',
      user: 'Sarah Wilson',
      role: 'Lab Technician',
      action: 'uploaded',
      timestamp: '2024-05-22 16:20:33',
      recordId: 'rec2'
    },
    {
      id: 'log5',
      user: 'Dr. Emily Patel',
      role: 'Radiologist',
      action: 'edited',
      timestamp: '2024-04-10 11:05:27',
      recordId: 'rec3'
    },
  ];
  
  // Filter records based on active tab and search query
  const filteredRecords = records.filter(record => {
    const matchesTab = activeTab === 'all' || record.type === activeTab;
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get record type display name
  const getRecordTypeDisplay = (type: string): string => {
    switch(type) {
      case 'prescription': return 'Prescription';
      case 'lab_report': return 'Lab Report';
      case 'imaging': return 'Imaging';
      case 'discharge': return 'Discharge Summary';
      default: return 'Other';
    }
  };
  
  // Get record type icon
  const getRecordTypeIcon = (type: string) => {
    switch(type) {
      case 'prescription':
        return <FileText className="text-blue-600" />;
      case 'lab_report':
        return <FileText className="text-green-600" />;
      case 'imaging':
        return <FileText className="text-purple-600" />;
      case 'discharge':
        return <FileText className="text-red-600" />;
      default:
        return <FileText className="text-gray-600" />;
    }
  };
  
  // Handle record download
  const handleDownload = (recordId: string) => {
    console.log('Downloading record:', recordId);
    // In a real app, this would trigger a download of the file
  };
  
  // Handle record view
  const handleView = (recordId: string) => {
    console.log('Viewing record:', recordId);
    // In a real app, this would open a viewer for the file
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Medical Records</h1>
        <p className="text-gray-600">
          Securely access and manage your complete medical history in one place.
        </p>
      </div>
      
      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start">
        <Lock className="text-blue-900 mr-3 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-blue-900">Your Privacy is Protected</h3>
          <p className="text-sm text-blue-800">
            All your medical records are encrypted and can only be accessed by you and your authorized healthcare providers.
            Every access to your records is logged and can be reviewed at any time.
          </p>
          <button 
            className="text-sm text-blue-900 font-medium hover:underline mt-1"
            onClick={() => setShowAccessLog(!showAccessLog)}
          >
            {showAccessLog ? 'Hide Access Log' : 'View Access Log'}
          </button>
        </div>
      </div>
      
      {/* Access Log */}
      {showAccessLog && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-8 animate-fadeIn">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="mr-2" size={20} /> Access Log
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accessLogs.map((log) => {
                  const record = records.find(r => r.id === log.recordId);
                  return (
                    <tr key={log.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{log.user}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{log.role}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.action === 'viewed' ? 'bg-blue-100 text-blue-800' :
                          log.action === 'downloaded' ? 'bg-green-100 text-green-800' :
                          log.action === 'edited' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {record ? record.title : 'Unknown Record'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Records Management */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        {/* Tabs and Actions */}
        <div className="border-b flex flex-wrap items-center justify-between px-4">
          <div className="flex overflow-x-auto hide-scrollbar">
            <button
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-blue-900'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Records
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'prescriptions'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-blue-900'
              }`}
              onClick={() => setActiveTab('prescriptions')}
            >
              Prescriptions
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'lab_reports'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-blue-900'
              }`}
              onClick={() => setActiveTab('lab_reports')}
            >
              Lab Reports
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'imaging'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-blue-900'
              }`}
              onClick={() => setActiveTab('imaging')}
            >
              Imaging
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'discharge'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-blue-900'
              }`}
              onClick={() => setActiveTab('discharge')}
            >
              Discharge Summaries
            </button>
          </div>
          
          <button 
            className="ml-auto my-2 bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors flex items-center"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload className="mr-1" size={16} /> Upload Record
          </button>
        </div>
        
        {/* Search and Filter */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search records by title, doctor, or tags"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Filter className="mr-2" size={16} /> Filter
            </button>
          </div>
        </div>
        
        {/* Records List */}
        <div className="p-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto mb-2" size={48} />
              <p>No records found matching your criteria.</p>
              <button 
                className="mt-4 text-blue-900 font-medium hover:underline"
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className="p-2 bg-gray-100 rounded-lg mr-4">
                        {getRecordTypeIcon(record.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
                        <p className="text-gray-600 text-sm">{formatDate(record.date)} • {record.doctor}</p>
                        <p className="text-gray-700 mt-1">{record.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {record.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {getRecordTypeDisplay(record.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800 transition-colors"
                        onClick={() => handleView(record.id)}
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors"
                        onClick={() => handleDownload(record.id)}
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Upload Medical Record</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowUploadModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                <select className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="prescription">Prescription</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="imaging">Imaging</option>
                  <option value="discharge">Discharge Summary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Blood Test Results"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Dr. Sarah Johnson"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Brief description of the medical record"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., blood test, routine, annual"
                />
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-500 mb-1">Drag and drop your file here, or</p>
                <button type="button" className="text-blue-900 font-medium hover:underline text-sm">
                  Browse files
                </button>
                <input type="file" className="hidden" />
                <p className="text-xs text-gray-400 mt-2">Supported formats: PDF, JPG, PNG (Max: 10MB)</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
                  onClick={() => {
                    // In a real app, this would handle the upload
                    setShowUploadModal(false);
                  }}
                >
                  Upload Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsPage;