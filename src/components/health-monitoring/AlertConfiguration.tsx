import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Save, AlertTriangle, Info } from 'lucide-react';
import HealthMonitoringService from '../../services/HealthMonitoringService';

interface AlertConfigurationProps {
  patientId: string;
}

interface AlertThreshold {
  id: string;
  metricType: 'glucose' | 'blood_pressure' | 'oxygen' | 'weight';
  condition: 'above' | 'below' | 'between';
  value1: number;
  value2?: number;
  unit: string;
  notifyVia: ('email' | 'sms' | 'app')[];
  notifyProvider: boolean;
  frequency: 'immediately' | 'daily' | 'weekly';
  active: boolean;
}

const AlertConfiguration: React.FC<AlertConfigurationProps> = ({ patientId }) => {
  const [alerts, setAlerts] = useState<AlertThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<AlertThreshold>>({
    metricType: 'glucose',
    condition: 'above',
    value1: 0,
    notifyVia: ['app'],
    notifyProvider: false,
    frequency: 'immediately',
    active: true
  });
  
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would call an API
        // Mock data for demonstration
        const mockAlerts: AlertThreshold[] = [
          {
            id: 'alert-1',
            metricType: 'glucose',
            condition: 'above',
            value1: 180,
            unit: 'mg/dL',
            notifyVia: ['app', 'email'],
            notifyProvider: true,
            frequency: 'immediately',
            active: true
          },
          {
            id: 'alert-2',
            metricType: 'blood_pressure',
            condition: 'above',
            value1: 140,
            unit: 'mmHg',
            notifyVia: ['app'],
            notifyProvider: false,
            frequency: 'daily',
            active: true
          },
          {
            id: 'alert-3',
            metricType: 'oxygen',
            condition: 'below',
            value1: 92,
            unit: '%',
            notifyVia: ['app', 'sms'],
            notifyProvider: true,
            frequency: 'immediately',
            active: true
          }
        ];
        
        setAlerts(mockAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlerts();
  }, [patientId]);
  
  const getMetricLabel = (type: string): string => {
    switch (type) {
      case 'glucose': return 'Blood Glucose';
      case 'blood_pressure': return 'Blood Pressure';
      case 'oxygen': return 'Oxygen Saturation';
      case 'weight': return 'Weight';
      default: return type;
    }
  };
  
  const getMetricUnit = (type: string): string => {
    switch (type) {
      case 'glucose': return 'mg/dL';
      case 'blood_pressure': return 'mmHg';
      case 'oxygen': return '%';
      case 'weight': return 'kg';
      default: return '';
    }
  };
  
  const handleAddAlert = () => {
    if (!newAlert.metricType || !newAlert.condition || !newAlert.value1) {
      return;
    }
    
    const unit = getMetricUnit(newAlert.metricType);
    
    const alert: AlertThreshold = {
      id: `alert-${Date.now()}`,
      metricType: newAlert.metricType as 'glucose' | 'blood_pressure' | 'oxygen' | 'weight',
      condition: newAlert.condition as 'above' | 'below' | 'between',
      value1: newAlert.value1,
      value2: newAlert.value2,
      unit,
      notifyVia: newAlert.notifyVia as ('email' | 'sms' | 'app')[],
      notifyProvider: newAlert.notifyProvider || false,
      frequency: newAlert.frequency as 'immediately' | 'daily' | 'weekly',
      active: true
    };
    
    setAlerts([...alerts, alert]);
    setShowAddAlert(false);
    setNewAlert({
      metricType: 'glucose',
      condition: 'above',
      value1: 0,
      notifyVia: ['app'],
      notifyProvider: false,
      frequency: 'immediately',
      active: true
    });
  };
  
  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };
  
  const handleToggleAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ));
  };
  
  const renderAlertCondition = (alert: AlertThreshold): string => {
    switch (alert.condition) {
      case 'above':
        return `above ${alert.value1} ${alert.unit}`;
      case 'below':
        return `below ${alert.value1} ${alert.unit}`;
      case 'between':
        return `between ${alert.value1} and ${alert.value2} ${alert.unit}`;
      default:
        return '';
    }
  };
  
  const renderNotificationMethods = (methods: ('email' | 'sms' | 'app')[]): string => {
    return methods.map(method => method.charAt(0).toUpperCase() + method.slice(1)).join(', ');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-900 text-white">
        <h3 className="font-semibold flex items-center">
          <Bell className="mr-2" />
          Alert Configuration
        </h3>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            Configure alerts for your health metrics to stay informed about important changes.
          </p>
          <button
            onClick={() => setShowAddAlert(true)}
            className="flex items-center px-3 py-1 bg-blue-900 text-white rounded-md hover:bg-blue-800 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Alert
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-500 mb-4">No alerts configured yet.</p>
            <button
              onClick={() => setShowAddAlert(true)}
              className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 text-sm font-medium"
            >
              Configure Your First Alert
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`border rounded-lg overflow-hidden ${alert.active ? 'border-blue-200' : 'border-gray-200 opacity-70'}`}
              >
                <div className={`p-3 flex justify-between items-center ${alert.active ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${alert.active ? 'bg-blue-100' : 'bg-gray-200'}`}>
                      <Bell className={`w-5 h-5 ${alert.active ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{getMetricLabel(alert.metricType)}</h4>
                      <p className="text-sm text-gray-600">
                        Alert when {renderAlertCondition(alert)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleAlert(alert.id)}
                      className={`px-3 py-1 rounded text-xs font-medium ${alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}
                    >
                      {alert.active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3 border-t border-gray-100 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Notify via</p>
                      <p>{renderNotificationMethods(alert.notifyVia)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Frequency</p>
                      <p className="capitalize">{alert.frequency}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Provider Notification</p>
                      <p>{alert.notifyProvider ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Alert Modal */}
        {showAddAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Add New Alert</h3>
                <button 
                  onClick={() => setShowAddAlert(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Metric Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
                  <select
                    value={newAlert.metricType}
                    onChange={(e) => setNewAlert({...newAlert, metricType: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="glucose">Blood Glucose</option>
                    <option value="blood_pressure">Blood Pressure</option>
                    <option value="oxygen">Oxygen Saturation</option>
                    <option value="weight">Weight</option>
                  </select>
                </div>
                
                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert({...newAlert, condition: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                    <option value="between">Between</option>
                  </select>
                </div>
                
                {/* Values */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {newAlert.condition === 'between' ? 'Minimum Value' : 'Value'}
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        value={newAlert.value1}
                        onChange={(e) => setNewAlert({...newAlert, value1: parseFloat(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                        {getMetricUnit(newAlert.metricType || 'glucose')}
                      </span>
                    </div>
                  </div>
                  
                  {newAlert.condition === 'between' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Value</label>
                      <div className="flex">
                        <input
                          type="number"
                          value={newAlert.value2 || 0}
                          onChange={(e) => setNewAlert({...newAlert, value2: parseFloat(e.target.value)})}
                          className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                          {getMetricUnit(newAlert.metricType || 'glucose')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Notification Methods */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notify via</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAlert.notifyVia?.includes('app')}
                        onChange={(e) => {
                          const notifyVia = [...(newAlert.notifyVia || [])];
                          if (e.target.checked) {
                            notifyVia.push('app');
                          } else {
                            const index = notifyVia.indexOf('app');
                            if (index !== -1) notifyVia.splice(index, 1);
                          }
                          setNewAlert({...newAlert, notifyVia});
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">App Notification</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAlert.notifyVia?.includes('email')}
                        onChange={(e) => {
                          const notifyVia = [...(newAlert.notifyVia || [])];
                          if (e.target.checked) {
                            notifyVia.push('email');
                          } else {
                            const index = notifyVia.indexOf('email');
                            if (index !== -1) notifyVia.splice(index, 1);
                          }
                          setNewAlert({...newAlert, notifyVia});
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Email</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAlert.notifyVia?.includes('sms')}
                        onChange={(e) => {
                          const notifyVia = [...(newAlert.notifyVia || [])];
                          if (e.target.checked) {
                            notifyVia.push('sms');
                          } else {
                            const index = notifyVia.indexOf('sms');
                            if (index !== -1) notifyVia.splice(index, 1);
                          }
                          setNewAlert({...newAlert, notifyVia});
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">SMS</span>
                    </label>
                  </div>
                </div>
                
                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alert Frequency</label>
                  <select
                    value={newAlert.frequency}
                    onChange={(e) => setNewAlert({...newAlert, frequency: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="immediately">Immediately</option>
                    <option value="daily">Daily Summary</option>
                    <option value="weekly">Weekly Summary</option>
                  </select>
                </div>
                
                {/* Notify Provider */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAlert.notifyProvider}
                      onChange={(e) => setNewAlert({...newAlert, notifyProvider: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Also notify my healthcare provider</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddAlert(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAlert}
                  className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 flex items-center"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Alert
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Information Section */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start">
            <Info className="text-blue-600 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">About Health Alerts</h4>
              <p className="text-sm text-blue-800">
                Alerts help you stay on top of your health by notifying you when your readings fall outside of normal ranges. 
                You can customize when and how you receive these notifications.
              </p>
              <div className="mt-2 text-sm">
                <a href="#" className="text-blue-900 font-medium hover:underline">Learn more about recommended alert thresholds</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertConfiguration;