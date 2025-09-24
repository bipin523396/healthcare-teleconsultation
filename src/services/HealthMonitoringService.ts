import { MonitoringEvent } from '../types/Billing';

class HealthMonitoringService {
  // Connect to patient devices
  async connectDevices(patientId: string): Promise<any[]> {
    // In a real implementation, this would integrate with device APIs
    // For now, we'll simulate device connection
    
    console.log(`Connecting devices for patient ${patientId}`);
    
    // Simulate successful connection after a delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.getMockDevices());
      }, 1000);
    });
  }
  
  // Get monitoring data
  async getMonitoringData(patientId: string, timeRange: any): Promise<MonitoringEvent[]> {
    // In a real implementation, this would fetch data from connected devices
    // For now, we'll return mock monitoring data
    
    console.log(`Fetching monitoring data for patient ${patientId}`, timeRange);
    
    // Get stored monitoring data or generate mock data
    try {
      const storedData = localStorage.getItem('monitoring_data');
      if (storedData) {
        const allData = JSON.parse(storedData) as MonitoringEvent[];
        return allData.filter(event => event.patientId === patientId);
      }
    } catch (error) {
      console.error('Error retrieving monitoring data from storage:', error);
    }
    
    // Generate mock data if none exists
    return this.generateMockMonitoringData(patientId, timeRange);
  }
  
  // Generate billable events from monitoring
  async getBillableEvents(patientId: string, timeRange: any): Promise<MonitoringEvent[]> {
    // Get all monitoring events
    const allEvents = await this.getMonitoringData(patientId, timeRange);
    
    // Filter for billable events only
    return allEvents.filter(event => event.billable);
  }
  
  // Save monitoring data
  async saveMonitoringData(event: MonitoringEvent): Promise<boolean> {
    try {
      // Get existing data
      const storedData = localStorage.getItem('monitoring_data');
      let allData: MonitoringEvent[] = [];
      
      if (storedData) {
        allData = JSON.parse(storedData) as MonitoringEvent[];
      }
      
      // Add new event
      allData.push(event);
      
      // Save back to storage
      localStorage.setItem('monitoring_data', JSON.stringify(allData));
      
      return true;
    } catch (error) {
      console.error('Error saving monitoring data:', error);
      return false;
    }
  }
  
  // Helper method to get mock devices
  private getMockDevices(): any[] {
    return [
      {
        id: 'device-001',
        type: 'glucose_monitor',
        name: 'Continuous Glucose Monitor',
        manufacturer: 'Dexcom',
        model: 'G6',
        connected: true,
        lastSync: new Date().toISOString()
      },
      {
        id: 'device-002',
        type: 'blood_pressure',
        name: 'Blood Pressure Monitor',
        manufacturer: 'Omron',
        model: 'Platinum',
        connected: true,
        lastSync: new Date().toISOString()
      },
      {
        id: 'device-003',
        type: 'pulse_oximeter',
        name: 'Pulse Oximeter',
        manufacturer: 'Nonin',
        model: 'Connect',
        connected: true,
        lastSync: new Date().toISOString()
      },
      {
        id: 'device-004',
        type: 'scale',
        name: 'Smart Scale',
        manufacturer: 'Withings',
        model: 'Body+',
        connected: true,
        lastSync: new Date().toISOString()
      }
    ];
  }
  
  // Helper method to generate mock monitoring data
  private generateMockMonitoringData(patientId: string, timeRange: any): MonitoringEvent[] {
    const events: MonitoringEvent[] = [];
    const devices = this.getMockDevices();
    
    // Generate data for each device
    devices.forEach(device => {
      // Generate multiple readings per device
      for (let i = 0; i < 5; i++) {
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - i); // Data from the last 5 days
        
        let event: MonitoringEvent;
        
        switch (device.type) {
          case 'glucose_monitor':
            event = {
              id: `event-glucose-${Date.now()}-${i}`,
              patientId,
              deviceId: device.id,
              deviceType: device.type,
              timestamp: timestamp.toISOString(),
              dataType: 'glucose',
              value: 110 + Math.floor(Math.random() * 40), // Random glucose between 110-150
              unit: 'mg/dL',
              billable: i === 0, // Only the most recent reading is billable
              billingCode: '99454' // Device supply with daily recording
            };
            break;
            
          case 'blood_pressure':
            event = {
              id: `event-bp-${Date.now()}-${i}`,
              patientId,
              deviceId: device.id,
              deviceType: device.type,
              timestamp: timestamp.toISOString(),
              dataType: 'blood_pressure',
              value: 120 + Math.floor(Math.random() * 20), // Random systolic between 120-140
              unit: 'mmHg',
              billable: i === 0, // Only the most recent reading is billable
              billingCode: '99454' // Device supply with daily recording
            };
            break;
            
          case 'pulse_oximeter':
            event = {
              id: `event-oxygen-${Date.now()}-${i}`,
              patientId,
              deviceId: device.id,
              deviceType: device.type,
              timestamp: timestamp.toISOString(),
              dataType: 'oxygen_saturation',
              value: 95 + Math.floor(Math.random() * 5), // Random O2 between 95-100
              unit: '%',
              billable: i === 0, // Only the most recent reading is billable
              billingCode: '99454' // Device supply with daily recording
            };
            break;
            
          case 'scale':
            event = {
              id: `event-weight-${Date.now()}-${i}`,
              patientId,
              deviceId: device.id,
              deviceType: device.type,
              timestamp: timestamp.toISOString(),
              dataType: 'weight',
              value: 70 + Math.floor(Math.random() * 10), // Random weight between 70-80
              unit: 'kg',
              billable: i === 0, // Only the most recent reading is billable
              billingCode: '99454' // Device supply with daily recording
            };
            break;
            
          default:
            event = {
              id: `event-other-${Date.now()}-${i}`,
              patientId,
              deviceId: device.id,
              deviceType: device.type,
              timestamp: timestamp.toISOString(),
              dataType: 'other',
              value: Math.floor(Math.random() * 100),
              unit: 'units',
              billable: false,
              billingCode: undefined
            };
        }
        
        events.push(event);
      }
    });
    
    // Add one monthly RPM treatment management event (billable)
    events.push({
      id: `event-rpm-mgmt-${Date.now()}`,
      patientId,
      deviceId: 'system',
      deviceType: 'rpm_service',
      timestamp: new Date().toISOString(),
      dataType: 'treatment_management',
      value: 20, // 20 minutes of RPM treatment management
      unit: 'minutes',
      billable: true,
      billingCode: '99457' // RPM treatment management, first 20 minutes
    });
    
    return events;
  }
}

export default new HealthMonitoringService();