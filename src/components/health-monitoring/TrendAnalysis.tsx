import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import HealthMonitoringService from '../../services/HealthMonitoringService';

interface TrendAnalysisProps {
  patientId: string;
  metricType?: 'glucose' | 'blood_pressure' | 'oxygen' | 'weight' | 'all';
}

interface DataPoint {
  value: number;
  timestamp: string;
  unit: string;
  isNormal: boolean;
}

interface MetricData {
  type: string;
  label: string;
  color: string;
  data: DataPoint[];
  unit: string;
  normalRange: {
    min: number;
    max: number;
  };
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ patientId, metricType = 'all' }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('week');
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(metricType !== 'all' ? metricType : null);
  const [showAnomalies, setShowAnomalies] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would call an API with the proper time range
        const monitoringData = await HealthMonitoringService.getMonitoringData(patientId, {
          startDate: getStartDate(timeRange),
          endDate: new Date().toISOString()
        });
        
        // Process the data for visualization
        const processedData = processMonitoringData(monitoringData);
        setMetrics(processedData);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patientId, timeRange]);
  
  // Helper function to get start date based on time range
  const getStartDate = (range: 'week' | 'month' | 'quarter' | 'year'): string => {
    const now = new Date();
    switch (range) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        now.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    return now.toISOString();
  };
  
  // Process monitoring data for visualization
  const processMonitoringData = (data: any[]): MetricData[] => {
    // This is a mock implementation - in a real app, this would process actual data
    const mockMetrics: MetricData[] = [
      {
        type: 'glucose',
        label: 'Blood Glucose',
        color: '#F59E0B',
        unit: 'mg/dL',
        normalRange: { min: 70, max: 140 },
        data: generateMockData(80, 160, 'mg/dL', { min: 70, max: 140 }, timeRange)
      },
      {
        type: 'blood_pressure',
        label: 'Blood Pressure (Systolic)',
        color: '#EF4444',
        unit: 'mmHg',
        normalRange: { min: 90, max: 120 },
        data: generateMockData(100, 150, 'mmHg', { min: 90, max: 120 }, timeRange)
      },
      {
        type: 'oxygen',
        label: 'Oxygen Saturation',
        color: '#3B82F6',
        unit: '%',
        normalRange: { min: 95, max: 100 },
        data: generateMockData(92, 100, '%', { min: 95, max: 100 }, timeRange)
      },
      {
        type: 'weight',
        label: 'Weight',
        color: '#10B981',
        unit: 'kg',
        normalRange: { min: 60, max: 80 },
        data: generateMockData(65, 85, 'kg', { min: 60, max: 80 }, timeRange)
      }
    ];
    
    return mockMetrics;
  };
  
  // Generate mock data points
  const generateMockData = (
    min: number, 
    max: number, 
    unit: string, 
    normalRange: { min: number, max: number },
    timeRange: 'week' | 'month' | 'quarter' | 'year'
  ): DataPoint[] => {
    const dataPoints: DataPoint[] = [];
    const now = new Date();
    const startDate = new Date(getStartDate(timeRange));
    
    // Determine number of data points based on time range
    let numPoints: number;
    let intervalHours: number;
    
    switch (timeRange) {
      case 'week':
        numPoints = 14; // Twice daily for a week
        intervalHours = 12;
        break;
      case 'month':
        numPoints = 30; // Daily for a month
        intervalHours = 24;
        break;
      case 'quarter':
        numPoints = 45; // Every other day for 3 months
        intervalHours = 48;
        break;
      case 'year':
        numPoints = 52; // Weekly for a year
        intervalHours = 168;
        break;
    }
    
    // Generate data points with some randomness and occasional anomalies
    for (let i = 0; i < numPoints; i++) {
      const pointDate = new Date(startDate.getTime());
      pointDate.setHours(pointDate.getHours() + (intervalHours * i));
      
      // Add some randomness to the value
      let value: number;
      
      // Occasionally generate an anomaly (10% chance)
      const isAnomaly = Math.random() < 0.1;
      
      if (isAnomaly) {
        // Generate a value outside the normal range
        const belowRange = Math.random() < 0.5;
        value = belowRange 
          ? normalRange.min - (Math.random() * (normalRange.min * 0.2)) 
          : normalRange.max + (Math.random() * (normalRange.max * 0.2));
      } else {
        // Generate a value within the expected range
        value = min + Math.random() * (max - min);
      }
      
      // Round to 1 decimal place
      value = Math.round(value * 10) / 10;
      
      const isNormal = value >= normalRange.min && value <= normalRange.max;
      
      dataPoints.push({
        value,
        timestamp: pointDate.toISOString(),
        unit,
        isNormal
      });
    }
    
    return dataPoints;
  };
  
  // Calculate statistics for the selected metric
  const calculateStats = (metricData: MetricData | undefined) => {
    if (!metricData || !metricData.data.length) {
      return { min: 0, max: 0, avg: 0, anomalies: 0 };
    }
    
    const values = metricData.data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / values.length) * 10) / 10;
    const anomalies = metricData.data.filter(d => !d.isNormal).length;
    
    return { min, max, avg, anomalies };
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get the currently selected metric data
  const selectedMetricData = selectedMetric 
    ? metrics.find(m => m.type === selectedMetric) 
    : metrics.length > 0 ? metrics[0] : undefined;
  
  // Calculate statistics for the selected metric
  const stats = calculateStats(selectedMetricData);
  
  // Filter data points based on anomaly setting
  const filteredDataPoints = selectedMetricData?.data.filter(d => showAnomalies ? !d.isNormal : true) || [];
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-900 text-white">
        <h3 className="font-semibold flex items-center">
          <TrendingUp className="mr-2" />
          Health Trends Analysis
        </h3>
      </div>
      
      <div className="p-4">
        {/* Time Range Selector */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md ${timeRange === range ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showAnomalies}
                onChange={() => setShowAnomalies(!showAnomalies)}
                className="mr-2 h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300 rounded"
              />
              Show Anomalies Only
            </label>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        ) : (
          <>
            {/* Metric Selector */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
              {metrics.map((metric) => (
                <button
                  key={metric.type}
                  onClick={() => setSelectedMetric(metric.type)}
                  className={`px-3 py-2 text-sm font-medium rounded-md flex items-center whitespace-nowrap ${selectedMetric === metric.type ? `bg-${metric.color.replace('#', '')} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  style={selectedMetric === metric.type ? { backgroundColor: metric.color } : {}}
                >
                  {metric.label}
                </button>
              ))}
            </div>
            
            {selectedMetricData && (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Average</p>
                    <p className="text-xl font-bold">{stats.avg} {selectedMetricData.unit}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Minimum</p>
                    <p className="text-xl font-bold">{stats.min} {selectedMetricData.unit}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Maximum</p>
                    <p className="text-xl font-bold">{stats.max} {selectedMetricData.unit}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Anomalies</p>
                    <p className="text-xl font-bold">{stats.anomalies}</p>
                  </div>
                </div>
                
                {/* Normal Range Indicator */}
                <div className="bg-blue-50 p-3 rounded-lg mb-6 flex items-start">
                  <Info className="text-blue-600 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Normal Range</p>
                    <p className="text-sm text-blue-800">
                      {selectedMetricData.label} should be between {selectedMetricData.normalRange.min} and {selectedMetricData.normalRange.max} {selectedMetricData.unit}.
                    </p>
                  </div>
                </div>
                
                {/* Chart Placeholder - In a real implementation, this would be a Chart.js or Recharts component */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6 h-64 flex items-center justify-center">
                  <p className="text-gray-500 text-center">
                    [Chart Visualization Would Appear Here]<br />
                    <span className="text-sm">In a real implementation, this would be an interactive chart showing {selectedMetricData.label} trends over time.</span>
                  </p>
                </div>
                
                {/* Data Points Table */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">
                    {showAnomalies ? 'Anomaly' : 'Recent'} Readings
                  </h4>
                  
                  {filteredDataPoints.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-gray-500">
                        {showAnomalies 
                          ? 'No anomalies detected in the selected time period.' 
                          : 'No readings available for the selected time period.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reading
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredDataPoints.slice(0, 10).map((point, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(point.timestamp)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                {point.value} {point.unit}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                {point.isNormal ? (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    Normal
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center w-fit">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Abnormal
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrendAnalysis;