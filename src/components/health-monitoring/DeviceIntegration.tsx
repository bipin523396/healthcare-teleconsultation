import React, { useState } from 'react';
import { Bluetooth, Plus, Check, X, Info, RefreshCw, Smartphone } from 'lucide-react';

interface DeviceIntegrationProps {
  patientId: string;
  onDeviceConnected?: (deviceId: string, deviceType: string) => void;
}

interface Device {
  id: string;
  name: string;
  type: 'glucose_monitor' | 'blood_pressure' | 'pulse_oximeter' | 'scale' | 'smartwatch' | 'other';
  status: 'available' | 'connected' | 'pairing' | 'error';
  lastSync?: string;
  batteryLevel?: number;
}

const DeviceIntegration: React.FC<DeviceIntegrationProps> = ({ patientId, onDeviceConnected }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showPairingInstructions, setShowPairingInstructions] = useState(false);
  
  // Mock function to simulate scanning for devices
  const scanForDevices = () => {
    setIsScanning(true);
    
    // In a real implementation, this would use Web Bluetooth API
    // or a native bridge to scan for actual devices
    setTimeout(() => {
      const mockDevices: Device[] = [
        {
          id: 'gluc-123',
          name: 'OneTouch Verio',
          type: 'glucose_monitor',
          status: 'available'
        },
        {
          id: 'bp-456',
          name: 'Omron BP Monitor',
          type: 'blood_pressure',
          status: 'available'
        },
        {
          id: 'ox-789',
          name: 'Pulse Oximeter Pro',
          type: 'pulse_oximeter',
          status: 'available'
        },
        {
          id: 'scale-101',
          name: 'Smart Scale X3',
          type: 'scale',
          status: 'available'
        }
      ];
      
      setAvailableDevices(mockDevices);
      setIsScanning(false);
    }, 2000);
  };
  
  // Mock function to pair with a device
  const pairDevice = (device: Device) => {
    setSelectedDevice(device);
    setShowPairingInstructions(true);
  };
  
  // Mock function to complete pairing
  const completePairing = () => {
    if (!selectedDevice) return;
    
    const updatedDevice = {
      ...selectedDevice,
      status: 'connected' as const,
      lastSync: new Date().toISOString(),
      batteryLevel: Math.floor(Math.random() * 100)
    };
    
    setConnectedDevices([...connectedDevices, updatedDevice]);
    setAvailableDevices(availableDevices.filter(d => d.id !== selectedDevice.id));
    setSelectedDevice(null);
    setShowPairingInstructions(false);
    
    if (onDeviceConnected) {
      onDeviceConnected(updatedDevice.id, updatedDevice.type);
    }
  };
  
  // Mock function to disconnect a device
  const disconnectDevice = (deviceId: string) => {
    const device = connectedDevices.find(d => d.id === deviceId);
    if (!device) return;
    
    const updatedDevice = {
      ...device,
      status: 'available' as const
    };
    
    setConnectedDevices(connectedDevices.filter(d => d.id !== deviceId));
    setAvailableDevices([...availableDevices, updatedDevice]);
  };
  
  // Get device type label
  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'glucose_monitor': return 'Glucose Monitor';
      case 'blood_pressure': return 'Blood Pressure Monitor';
      case 'pulse_oximeter': return 'Pulse Oximeter';
      case 'scale': return 'Smart Scale';
      case 'smartwatch': return 'Smartwatch';
      default: return 'Other Device';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-900 text-white">
        <h3 className="font-semibold flex items-center">
          <Bluetooth className="mr-2" />
          Device Integration
        </h3>
      </div>
      
      <div className="p-4">
        {/* Connected Devices Section */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Connected Devices</h4>
          
          {connectedDevices.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500">No devices connected yet. Connect a device to start monitoring your health data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedDevices.map(device => (
                <div key={device.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <Check className="text-green-600 w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-medium">{device.name}</h5>
                      <p className="text-sm text-gray-500">{getDeviceTypeLabel(device.type)}</p>
                      {device.lastSync && (
                        <p className="text-xs text-gray-400">Last synced: {new Date(device.lastSync).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {device.batteryLevel !== undefined && (
                      <div className="mr-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-8 h-3 bg-gray-200 rounded-full mr-1 relative">
                            <div 
                              className={`absolute top-0 left-0 h-full rounded-full ${device.batteryLevel > 20 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${device.batteryLevel}%` }}
                            ></div>
                          </div>
                          <span>{device.batteryLevel}%</span>
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={() => disconnectDevice(device.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Available Devices Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-medium text-gray-900">Available Devices</h4>
            <button 
              onClick={scanForDevices}
              disabled={isScanning}
              className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${isScanning ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 mr-1" />
                  Scan for Devices
                </>
              )}
            </button>
          </div>
          
          {availableDevices.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500">No devices found. Click "Scan for Devices" to search for nearby health monitoring devices.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableDevices.map(device => (
                <div key={device.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Bluetooth className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-medium">{device.name}</h5>
                      <p className="text-sm text-gray-500">{getDeviceTypeLabel(device.type)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => pairDevice(device)}
                    className="bg-blue-900 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-800"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Pairing Instructions Modal */}
      {showPairingInstructions && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Connect {selectedDevice.name}</h3>
              <button 
                onClick={() => {
                  setShowPairingInstructions(false);
                  setSelectedDevice(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4 bg-blue-50 p-3 rounded-lg">
                <Info className="text-blue-600 w-5 h-5 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-800">Follow these steps to connect your {getDeviceTypeLabel(selectedDevice.type)}.</p>
              </div>
              
              <ol className="space-y-4 text-sm">
                <li className="flex">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                  <p>Turn on your {selectedDevice.name} device.</p>
                </li>
                <li className="flex">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                  <p>Press and hold the pairing button on your device until the Bluetooth indicator starts flashing.</p>
                </li>
                <li className="flex">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                  <p>Keep your device within 3 feet of your phone or computer during the pairing process.</p>
                </li>
                <li className="flex">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
                  <p>Click "Complete Pairing" below when your device is ready.</p>
                </li>
              </ol>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowPairingInstructions(false);
                  setSelectedDevice(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={completePairing}
                className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
              >
                Complete Pairing
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Manual Device Entry Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-medium text-gray-900">Manual Device Entry</h4>
          <button className="flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200">
            <Plus className="w-4 h-4 mr-1" />
            Add Device
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Don't see your device? You can manually add your health monitoring device to track your readings.
        </p>
      </div>
      
      {/* Help Section */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
        <p className="text-sm text-gray-600 mb-3">
          Having trouble connecting your device? Check our troubleshooting guide or contact support.
        </p>
        <div className="flex space-x-3">
          <button className="text-blue-900 text-sm font-medium hover:underline">
            Troubleshooting Guide
          </button>
          <button className="text-blue-900 text-sm font-medium hover:underline">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceIntegration;