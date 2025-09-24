import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './HealthMonitoringPage.module.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HeartPulse, AlertTriangle, Zap, User, Activity as ActivityIcon } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

// Heart attack prediction model
class CardiacPredictor {
  predictRisk(vitals: {
    heartRate: number;
    systolicBP: number;
    diastolicBP: number;
    oxygenSaturation: number;
    age: number;
    gender: number; // 0 for female, 1 for male
    cholesterol: number; // mg/dL
    bloodSugar: number; // mg/dL
    chestPain: number; // 0-3 scale (none, low, medium, high)
  }): { risk: 'low' | 'medium' | 'high'; probability: number; message: string } {
    // Base risk factors
    let riskScore = 0;
    
    // Heart rate risk (60-100 is normal)
    if (vitals.heartRate < 50 || vitals.heartRate > 120) riskScore += 0.4;
    else if (vitals.heartRate < 60 || vitals.heartRate > 100) riskScore += 0.2;
    
    // Blood pressure risk (normal: 120/80)
    const meanBP = (vitals.systolicBP + 2 * vitals.diastolicBP) / 3;
    if (meanBP < 60 || meanBP > 100) riskScore += 0.3;
    
    // Oxygen saturation risk
    if (vitals.oxygenSaturation < 90) riskScore += 0.3;
    else if (vitals.oxygenSaturation < 95) riskScore += 0.1;
    
    // Age risk (increases with age)
    riskScore += Math.min(0.4, (vitals.age - 40) * 0.01);
    
    // Gender risk (males have slightly higher risk)
    if (vitals.gender === 1) riskScore += 0.1;
    
    // Cholesterol risk
    if (vitals.cholesterol > 240) riskScore += 0.4;
    else if (vitals.cholesterol > 200) riskScore += 0.2;
    
    // Blood sugar risk
    if (vitals.bloodSugar > 140) riskScore += 0.3; // Fasting blood sugar > 140 is concerning
    
    // Chest pain
    riskScore += vitals.chestPain * 0.1;
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let message = 'Low risk of cardiac event';
    
    if (riskScore >= 0.7) {
      riskLevel = 'high';
      message = 'High risk of cardiac event - Seek immediate medical attention';
    } else if (riskScore >= 0.4) {
      riskLevel = 'medium';
      message = 'Moderate risk - Consult a healthcare provider';
    }
    
    return {
      risk: riskLevel,
      probability: Math.min(0.99, riskScore), // Cap at 99%
      message
    };
  }
}

// Initialize the predictor
const cardiacPredictor = new CardiacPredictor();

// ChartJS registration
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Types
type VitalSigns = {
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  oxygenSaturation: number;
  cholesterol: number;
  bloodSugar: number;
  chestPain: number; // 0-3 scale
  age: number;
  gender: number; // 0: female, 1: male
};

type PredictionResult = {
  risk: 'low' | 'medium' | 'high';
  probability: number;
  message: string;
  timestamp: string;
};

const HealthMonitoringPage: React.FC = () => {
  // State for mode (simulated/manual)
  const [mode, setMode] = useState<'simulated' | 'manual'>('simulated');
  
  // State for manual input
  const [vitals, setVitals] = useState<VitalSigns>({
    heartRate: 75,
    systolicBP: 120,
    diastolicBP: 80,
    oxygenSaturation: 98,
    cholesterol: 180,
    bloodSugar: 90,
    chestPain: 0,
    age: 45,
    gender: 0,
  });

  // State for simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(2); // 1x, 2x, 5x
  
  // State for results and history
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionResult[]>([]);
  
  // Chart data state
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: Array(10).fill('').map((_, i) => `${i * 5}s`),
    datasets: [
      {
        label: 'Heart Rate',
        data: Array(10).fill(75),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.1,
      },
      {
        label: 'Systolic BP',
        data: Array(10).fill(120),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.1,
      },
      {
        label: 'Oxygen Saturation',
        data: Array(10).fill(98),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.1,
      },
    ],
  });

  // Chart options
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable animations for better performance
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }), []);

  // Generate simulated vital signs
  const generateSimulatedVitals = useCallback((): VitalSigns => {
    // Base values with some randomness
    const baseHeartRate = 70 + Math.random() * 20; // 70-90 bpm
    const baseSystolicBP = 110 + Math.random() * 20; // 110-130 mmHg
    const baseDiastolicBP = 70 + Math.random() * 10; // 70-80 mmHg
    const baseOxygen = 95 + Math.random() * 5; // 95-100%
    
    // Occasionally introduce anomalies (10% chance)
    const hasAnomaly = Math.random() < 0.1;
    
    return {
      heartRate: hasAnomaly 
        ? baseHeartRate * (1.5 + Math.random() * 0.5) // 50% increase or more
        : baseHeartRate * (0.9 + Math.random() * 0.2), // ±10% variation
        
      systolicBP: hasAnomaly 
        ? baseSystolicBP * (1.3 + Math.random() * 0.3) // 30% increase or more
        : baseSystolicBP * (0.9 + Math.random() * 0.2),
        
      diastolicBP: hasAnomaly 
        ? baseDiastolicBP * (1.2 + Math.random() * 0.3) // 20% increase or more
        : baseDiastolicBP * (0.9 + Math.random() * 0.2),
        
      oxygenSaturation: hasAnomaly 
        ? 85 + Math.random() * 5 // 85-90% when anomaly
        : 95 + Math.random() * 5, // 95-100% normally
        
      cholesterol: 150 + Math.random() * 100, // 150-250 mg/dL
      bloodSugar: 80 + Math.random() * 60, // 80-140 mg/dL
      chestPain: Math.floor(Math.random() * 4), // 0-3
      age: 40 + Math.floor(Math.random() * 40), // 40-80 years
      gender: Math.round(Math.random()), // 0 or 1
    };
  }, []);

  // Run prediction
  const runPrediction = useCallback((currentVitals: VitalSigns) => {
    const prediction = cardiacPredictor.predictRisk(currentVitals);
    const timestamp = new Date().toLocaleTimeString();
    
    const result = {
      ...prediction,
      timestamp,
    };
    
    setCurrentPrediction(result);
    setPredictionHistory(prev => [result, ...prev].slice(0, 10)); // Keep last 10 predictions
    
    // Update chart data
    setChartData(prev => ({
      ...prev,
      datasets: [
        {
          ...prev.datasets[0],
          data: [...prev.datasets[0].data.slice(1), currentVitals.heartRate],
        },
        {
          ...prev.datasets[1],
          data: [...prev.datasets[1].data.slice(1), currentVitals.systolicBP],
        },
        {
          ...prev.datasets[2],
          data: [...prev.datasets[2].data.slice(1), currentVitals.oxygenSaturation],
        },
      ],
    }));
    
    return result;
  }, []);

  // Handle manual form submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runPrediction(vitals);
  };

  // Toggle simulation
  useEffect(() => {
    if (!isSimulating) return;
    
    const interval = setInterval(() => {
      if (mode === 'simulated') {
        const newVitals = generateSimulatedVitals();
        setVitals(newVitals); // Update vitals state
        runPrediction(newVitals);
      }
    }, 5000 / simulationSpeed); // Adjust speed based on multiplier
    
    return () => clearInterval(interval);
  }, [isSimulating, mode, simulationSpeed, generateSimulatedVitals, runPrediction]);

  // Start with an initial prediction
  useEffect(() => {
    if (mode === 'simulated') {
      const initialVitals = generateSimulatedVitals();
      runPrediction(initialVitals);
    }
  }, [mode, generateSimulatedVitals, runPrediction]);

  // Get color class based on risk level
  const getRiskColor = (risk: 'low' | 'medium' | 'high'): string => {
    return styles[`risk${risk.charAt(0).toUpperCase() + risk.slice(1)}`];
  };

  // Format vital sign value with units
  const formatVital = (key: keyof VitalSigns, value: number): string => {
    switch (key) {
      case 'heartRate': return `${Math.round(value)} bpm`;
      case 'systolicBP':
      case 'diastolicBP': return `${Math.round(value)} mmHg`;
      case 'oxygenSaturation': return `${Math.round(value)}%`;
      case 'cholesterol':
      case 'bloodSugar': return `${Math.round(value)} mg/dL`;
      case 'chestPain': {
        const levels = ['None', 'Mild', 'Moderate', 'Severe'];
        return levels[Math.min(3, Math.max(0, Math.round(value)))];
      }
      case 'age':
      case 'gender':
        return value.toString();
      default: 
        return value.toString();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Cardiac Health Monitor</h1>
      
      <Tabs 
        value={mode} 
        onValueChange={(value) => {
          setMode(value as 'simulated' | 'manual');
          setIsSimulating(false);
        }}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simulated">
            <Zap className="w-4 h-4 mr-2" />
            Simulated Mode
          </TabsTrigger>
          <TabsTrigger value="manual">
            <User className="w-4 h-4 mr-2" />
            Manual Input
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="simulated">
          <Card>
            <CardHeader>
              <CardTitle>Simulated Monitoring</CardTitle>
              <CardDescription>
                Real-time simulation of vital signs with automatic anomaly detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={() => setIsSimulating(!isSimulating)}
                    variant={isSimulating ? 'destructive' : 'default'}
                    className="w-32"
                  >
                    {isSimulating ? 'Stop' : 'Start'} Simulation
                  </Button>
                  
                  <div className="flex-1">
                    <Label htmlFor="simulation-speed" className="block mb-2">
                      Simulation Speed: {simulationSpeed}x
                    </Label>
                    <Slider
                      id="simulation-speed"
                      min={1}
                      max={5}
                      step={1}
                      value={[simulationSpeed]}
                      onValueChange={([value]) => setSimulationSpeed(value)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1x</span>
                      <span>5x</span>
                    </div>
                  </div>
                </div>
                
                {currentPrediction && (
                  <Alert 
                    variant={currentPrediction.risk === 'high' ? 'destructive' : 
                            currentPrediction.risk === 'medium' ? 'warning' : 'default'}
                    className="mt-4"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="capitalize">
                      {currentPrediction.risk} Risk Detected
                    </AlertTitle>
                    <AlertDescription>
                      {currentPrediction.message}
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${getRiskColor(currentPrediction.risk)}`}
                            style={{ width: `${currentPrediction.probability * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-xs mt-1">
                          {Math.round(currentPrediction.probability * 100)}% Risk Probability
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Vital Signs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentPrediction && Object.entries(vitals).map(([key, value]) => (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-semibold">
                            {formatVital(key, value)}
                          </span>
                        </div>
                        {key === 'heartRate' && (
                          <Progress 
                            value={Math.min(100, Math.max(0, (value - 40) / 2))} 
                            className="h-2 mt-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Trends</h3>
                  <div className={styles.chartContainer}>
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Prediction History</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {predictionHistory.map((pred, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-2 border-b"
                      >
                        <span>{pred.timestamp}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pred.risk === 'high' ? 'bg-red-100 text-red-800' :
                          pred.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {pred.risk.toUpperCase()}
                        </span>
                        <span>{Math.round(pred.probability * 100)}%</span>
                      </div>
                    ))}
                    {predictionHistory.length === 0 && (
                      <p className="text-sm text-gray-500">No prediction history yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Input</CardTitle>
              <CardDescription>
                Enter patient vitals manually to assess cardiac risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                    <Input
                      id="heartRate"
                      type="number"
                      value={vitals.heartRate}
                      onChange={(e) => setVitals({...vitals, heartRate: Number(e.target.value)})}
                      min="40"
                      max="200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="systolicBP">Systolic BP (mmHg)</Label>
                    <Input
                      id="systolicBP"
                      type="number"
                      value={vitals.systolicBP}
                      onChange={(e) => setVitals({...vitals, systolicBP: Number(e.target.value)})}
                      min="70"
                      max="200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="diastolicBP">Diastolic BP (mmHg)</Label>
                    <Input
                      id="diastolicBP"
                      type="number"
                      value={vitals.diastolicBP}
                      onChange={(e) => setVitals({...vitals, diastolicBP: Number(e.target.value)})}
                      min="40"
                      max="120"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="oxygenSaturation">Oxygen Saturation (%)</Label>
                    <Input
                      id="oxygenSaturation"
                      type="number"
                      value={vitals.oxygenSaturation}
                      onChange={(e) => setVitals({...vitals, oxygenSaturation: Number(e.target.value)})}
                      min="70"
                      max="100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cholesterol">Cholesterol (mg/dL)</Label>
                    <Input
                      id="cholesterol"
                      type="number"
                      value={vitals.cholesterol}
                      onChange={(e) => setVitals({...vitals, cholesterol: Number(e.target.value)})}
                      min="100"
                      max="400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bloodSugar">Blood Sugar (mg/dL)</Label>
                    <Input
                      id="bloodSugar"
                      type="number"
                      value={vitals.bloodSugar}
                      onChange={(e) => setVitals({...vitals, bloodSugar: Number(e.target.value)})}
                      min="70"
                      max="300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chestPain">Chest Pain Level (0-3)</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">None</span>
                      <Slider
                        id="chestPain"
                        min={0}
                        max={3}
                        step={1}
                        value={[vitals.chestPain]}
                        onValueChange={([value]) => setVitals({...vitals, chestPain: value})}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500">Severe</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {['None', 'Mild', 'Moderate', 'Severe'][vitals.chestPain]}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={vitals.age}
                      onChange={(e) => setVitals({...vitals, age: Number(e.target.value)})}
                      min="18"
                      max="120"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          checked={vitals.gender === 0}
                          onChange={() => setVitals({...vitals, gender: 0})}
                          className="mr-2"
                        />
                        Female
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          checked={vitals.gender === 1}
                          onChange={() => setVitals({...vitals, gender: 1})}
                          className="mr-2"
                        />
                        Male
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="w-full sm:w-auto">
                    <ActivityIcon className="w-4 h-4 mr-2" />
                    Analyze Risk
                  </Button>
                </div>
              </form>
              
              {currentPrediction && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
                  <Alert 
                    variant={currentPrediction.risk === 'high' ? 'destructive' : 
                            currentPrediction.risk === 'medium' ? 'warning' : 'default'}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="capitalize">
                      {currentPrediction.risk} Risk Detected
                    </AlertTitle>
                    <AlertDescription>
                      {currentPrediction.message}
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${getRiskColor(currentPrediction.risk)}`}
                            style={{ width: `${currentPrediction.probability * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-xs mt-1">
                          {Math.round(currentPrediction.probability * 100)}% Risk Probability
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HealthMonitoringPage;
