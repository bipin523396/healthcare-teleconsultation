import React, { useState, useEffect } from 'react';
import { Activity, Heart, Droplet, Weight, Clock, DollarSign } from 'lucide-react';
import HealthMonitoringService from '../../services/HealthMonitoringService';
import { MonitoringEvent } from '../../types/Billing';

interface MonitoringDashboardProps {
  patientId: string;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ patientId }) => {
  const [monitoringData, setMonitoringData] = useState<MonitoringEvent[]>([]);
  const [billableEvents, setBillableEvents] = useState<MonitoringEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState({ startDate: '2024-06-01', endDate: '2024-07-01' });
  const [activeTab, setActiveTab] = useState<'data' | 'billing'>('data');
  
  useEffect(() => {
    fetchMonitoringData();
  }, [patientId, timeRange]);
  
  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all monitoring data
      const data = await HealthMonitoringService.getMonitoringData(patientId, timeRange);
      setMonitoringData(data);
      
      // Fetch billable events
      const billable = await HealthMonitoringService.getBillableEvents(patientId, timeRange);
      setBillableEvents(billable);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Group data by device type
  const groupedData = monitoringData.reduce((acc, event) => {
    if (!acc[event.deviceType]) {
      acc[event.deviceType] = [];
    }
    acc[event.deviceType].push(event);
    return acc;
  }, {} as Record<string, MonitoringEvent[]>);
  
  // Get the latest reading for each data type
  const getLatestReading = (deviceType: string, dataType: string) => {
    if (!groupedData[deviceType]) return null;
    
    const readings = groupedData[deviceType]
      .filter(event => event.dataType === dataType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return readings.length > 0 ? readings[0] : null;
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get icon for device type
  const getDeviceIcon = (deviceType: string, className = 'w-5 h-5') => {
    switch (deviceType) {
      case 'glucose_monitor':
        return <Droplet className={className} />;
      case 'blood_pressure':
        return <Heart className={className} />;
      case 'pulse_oximeter':
        return <Activity className={className} />;
      case 'scale':
        return <Weight className={className} />;
      case 'rpm_service':
        return <Clock className={className} />;
      default:
        return <Activity className={className} />;
    }
  };
  
  // Calculate total billable amount
  const calculateBillableAmount = () => {
    // In a real implementation, this would use actual billing rates
    // For now, we'll use mock pricing
    const mockPricing: Record<string, number> = {
      '99453': 20,  // Remote monitoring setup
      '99454': 70,  // Remote monitoring device supply
      '99457': 50,  // Remote monitoring treatment management, first 20 minutes
      '99458': 40   // Remote monitoring treatment management, additional 20 minutes
    };
    
    return billableEvents.reduce((total, event) => {
      if (event.billingCode && mockPricing[event.billingCode]) {
        return total + mockPricing[event.billingCode];
      }
      return total;
    }, 0);
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-900 text-white">
        <h3 className="font-semibold flex items-center">
          <Activity className="mr-2" />
          Health Monitoring Dashboard
        </h3>
      </div>
      
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'data' ? 'border-b-2 border-blue-900 text-blue-900' : 'text-gray-500 hover:text-blue-900'}`}
            onClick={() => setActiveTab('data')}
          >
            Monitoring Data
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'billing' ? 'border-b-2 border-blue-900 text-blue-900' : 'text-gray-500 hover:text-blue-900'}`}
            onClick={() => setActiveTab('billing')}
          >
            Billing & RPM
          </button>
        </div>
      </div>
      
      {activeTab === 'data' ? (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Glucose Monitor */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Droplet className="text-blue-600 mr-2" />
                <h4 className="font-medium">Blood Glucose</h4>
              </div>
              {getLatestReading('glucose_monitor', 'glucose') ? (
                <div>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold text-blue-900">
                      {getLatestReading('glucose_monitor', 'glucose')?.value}
                    </span>
                    <span className="ml-1 text-gray-600">
                      {getLatestReading('glucose_monitor', 'glucose')?.unit}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {formatDate(getLatestReading('glucose_monitor', 'glucose')?.timestamp || '')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
            
            {/* Blood Pressure */}
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Heart className="text-red-600 mr-2" />
                <h4 className="font-medium">Blood Pressure</h4>
              </div>
              {getLatestReading('blood_pressure', 'blood_pressure') ? (
                <div>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold text-red-900">
                      {getLatestReading('blood_pressure', 'blood_pressure')?.value}
                    </span>
                    <span className="ml-1 text-gray-600">
                      {getLatestReading('blood_pressure', 'blood_pressure')?.unit}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {formatDate(getLatestReading('blood_pressure', 'blood_pressure')?.timestamp || '')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
            
            {/* Oxygen Saturation */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Activity className="text-purple-600 mr-2" />
                <h4 className="font-medium">Oxygen Saturation</h4>
              </div>
              {getLatestReading('pulse_oximeter', 'oxygen_saturation') ? (
                <div>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold text-purple-900">
                      {getLatestReading('pulse_oximeter', 'oxygen_saturation')?.value}
                    </span>
                    <span className="ml-1 text-gray-600">
                      {getLatestReading('pulse_oximeter', 'oxygen_saturation')?.unit}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {formatDate(getLatestReading('pulse_oximeter', 'oxygen_saturation')?.timestamp || '')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
            
            {/* Weight */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Weight className="text-green-600 mr-2" />
                <h4 className="font-medium">Weight</h4>
              </div>
              {getLatestReading('scale', 'weight') ? (
                <div>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold text-green-900">
                      {getLatestReading('scale', 'weight')?.value}
                    </span>
                    <span className="ml-1 text-gray-600">
                      {getLatestReading('scale', 'weight')?.unit}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {formatDate(getLatestReading('scale', 'weight')?.timestamp || '')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Readings</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reading</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monitoringData
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 10) // Show only the 10 most recent readings
                    .map((event, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            {getDeviceIcon(event.deviceType)}
                            <span className="ml-2 text-sm">{event.deviceType.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {event.dataType.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                          {event.value} {event.unit}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(event.timestamp)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium flex items-center">
                <DollarSign className="text-blue-600 mr-2" />
                Remote Patient Monitoring Billing
              </h4>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {billableEvents.length} Billable Events
              </span>
            </div>
            <div className="text-3xl font-bold text-blue-900 mb-2">
              ${calculateBillableAmount().toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">
              Estimated billable amount for current period
            </p>
          </div>
          
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Billable Events</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billableEvents.map((event, index) => {
                    // Mock pricing for display
                    const mockPricing: Record<string, number> = {
                      '99453': 20,
                      '99454': 70,
                      '99457': 50,
                      '99458': 40
                    };
                    
                    const amount = event.billingCode ? mockPricing[event.billingCode] || 0 : 0;
                    
                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            {getDeviceIcon(event.deviceType)}
                            <span className="ml-2 text-sm">
                              {event.deviceType === 'rpm_service' 
                                ? 'RPM Treatment Management' 
                                : `${event.deviceType.replace('_', ' ')} Data`}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {event.billingCode || 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(event.timestamp)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-right">
                          ${amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600">
            <p className="flex items-center">
              <Info className="mr-2" size={16} />
              RPM services are billed monthly. Codes include device supply (99454) and treatment management (99457).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;

// Missing import for Info icon
const Info = (props: any) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
};