import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Bell, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import HealthMonitoringService from '../../services/HealthMonitoringService';
import DeviceIntegration from './DeviceIntegration';
import TrendAnalysis from './TrendAnalysis';
import AlertConfiguration from './AlertConfiguration';

interface EnhancedMonitoringDashboardProps {
  patientId: string;
}

const EnhancedMonitoringDashboard: React.FC<EnhancedMonitoringDashboardProps> = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'trends' | 'devices' | 'alerts'>('monitoring');
  const [isLoading, setIsLoading] = useState(true);
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'recent_readings': true,
    'devices': false,
    'alerts': false,
    'trends': false
  });
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would call an API
        const data = await HealthMonitoringService.getMonitoringData(patientId, {
          startDate: getStartDate('week'),
          endDate: new Date().toISOString()
        });
        
        setMonitoringData(data);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patientId]);
  
  // Helper function to get start date based on time range
  const getStartDate = (range: 'day' | 'week' | 'month'): string => {
    const now = new Date();
    switch (range) {
      case 'day':
        now.setDate(now.getDate() - 1);
        break;
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
    }
    return now.toISOString();
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get the latest reading for each metric type
  const getLatestReadings = () => {
    // In a real implementation, this would process actual data
    // Mock data for demonstration
    return [
      {
        type: 'glucose',
        label: 'Blood Glucose',
        value: 105,
        unit: 'mg/dL',
        timestamp: new Date().toISOString(),
        isNormal: true,
        icon: <Activity className="text-amber-500" />,
        color: 'amber'
      },
      {
        type: 'blood_pressure',
        label: 'Blood Pressure',
        value: '120/80',
        unit: 'mmHg',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        isNormal: true,
        icon: <Activity className="text-red-500" />,
        color: 'red'
      },
      {
        type: 'oxygen',
        label: 'Oxygen Saturation',
        value: 98,
        unit: '%',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        isNormal: true,
        icon: <Activity className="text-blue-500" />,
        color: 'blue'
      },
      {
        type: 'weight',
        label: 'Weight',
        value: 72.5,
        unit: 'kg',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        isNormal: true,
        icon: <Activity className="text-green-500" />,
        color: 'green'
      }
    ];
  };
  
  const latestReadings = getLatestReadings();
  
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-blue-900 text-white">
          <h3 className="font-semibold flex items-center">
            <Activity className="mr-2" />
            Enhanced Health Monitoring Dashboard
          </h3>
        </div>
        
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Health Overview</h2>
              <p className="text-gray-600">Monitor your health metrics, set alerts, and track trends over time.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-2">
                <button 
                  onClick={() => setActiveTab('monitoring')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'monitoring' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('trends')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'trends' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Trends
                </button>
                <button 
                  onClick={() => setActiveTab('devices')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'devices' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Devices
                </button>
                <button 
                  onClick={() => setActiveTab('alerts')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'alerts' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Alerts
                </button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'monitoring' && (
                <div className="space-y-6">
                  {/* Latest Readings Section */}
                  <div>
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSection('recent_readings')}
                    >
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Latest Readings
                      </h3>
                      {expandedSections['recent_readings'] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    {expandedSections['recent_readings'] && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {latestReadings.map((reading) => (
                          <div 
                            key={reading.type} 
                            className={`bg-${reading.color}-50 p-4 rounded-lg border border-${reading.color}-100`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  {reading.icon}
                                  <h4 className="font-medium ml-2">{reading.label}</h4>
                                </div>
                                <p className="text-2xl font-bold mt-2">
                                  {reading.value} <span className="text-sm font-normal">{reading.unit}</span>
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${reading.isNormal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {reading.isNormal ? 'Normal' : 'Abnormal'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Last updated: {formatDate(reading.timestamp)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Devices Section */}
                  <div>
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSection('devices')}
                    >
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Smartphone className="w-5 h-5 mr-2" />
                        Connected Devices
                      </h3>
                      {expandedSections['devices'] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    {expandedSections['devices'] && (
                      <div className="mt-4">
                        <DeviceIntegration patientId={patientId} />
                      </div>
                    )}
                  </div>
                  
                  {/* Alerts Section */}
                  <div>
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSection('alerts')}
                    >
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Bell className="w-5 h-5 mr-2" />
                        Health Alerts
                      </h3>
                      {expandedSections['alerts'] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    {expandedSections['alerts'] && (
                      <div className="mt-4">
                        <AlertConfiguration patientId={patientId} />
                      </div>
                    )}
                  </div>
                  
                  {/* Trends Section */}
                  <div>
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSection('trends')}
                    >
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        Health Trends
                      </h3>
                      {expandedSections['trends'] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    {expandedSections['trends'] && (
                      <div className="mt-4">
                        <TrendAnalysis patientId={patientId} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <TrendAnalysis patientId={patientId} />
              )}
              
              {/* Devices Tab */}
              {activeTab === 'devices' && (
                <DeviceIntegration patientId={patientId} />
              )}
              
              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <AlertConfiguration patientId={patientId} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMonitoringDashboard;