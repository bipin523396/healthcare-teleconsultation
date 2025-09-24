import React, { useState, useEffect } from 'react';
import { CreditCard, Clock, Download, Filter, Activity, Video, FileText, Shield } from 'lucide-react';
import BillingService from '../services/BillingService';
import HealthMonitoringService from '../services/HealthMonitoringService';
import PaymentPortal from '../components/billing/PaymentPortal';
import InsuranceVerification from '../components/billing/InsuranceVerification';
import CostEstimator from '../components/billing/CostEstimator';
import ClaimTracker from '../components/billing/ClaimTracker';
import MonitoringDashboard from '../components/health-monitoring/MonitoringDashboard';
import { Bill, InsuranceVerification as InsuranceVerificationType } from '../types/Billing';

const BillingPage: React.FC = () => {
  // State for tabs and data
  const [activeTab, setActiveTab] = useState<'bills' | 'insurance' | 'monitoring' | 'telehealth'>('bills');
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPaymentPortal, setShowPaymentPortal] = useState(false);
  const [insuranceVerification, setInsuranceVerification] = useState<InsuranceVerificationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock patient ID - in a real app, this would come from authentication
  const patientId = 'patient123';
  
  // Load data on component mount
  useEffect(() => {
    const loadBillingData = async () => {
      try {
        setIsLoading(true);
        
        // Get bills
        const patientBills = await BillingService.getPatientBills(patientId);
        setBills(patientBills);
        
        // Get insurance verification
        const verification = await BillingService.verifyInsurance(patientId, {
          insuranceId: 'ins123',
        });
        setInsuranceVerification(verification);
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBillingData();
  }, []);
  
  // Calculate total due amount
  const calculateTotalDue = () => {
    return bills
      .filter(bill => bill.status === 'Pending' || bill.status === 'Failed')
      .reduce((total, bill) => total + bill.patientResponsibility, 0);
  };
  
  // Handle payment for a specific bill
  const handlePayment = async (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      setSelectedBill(bill);
      setShowPaymentPortal(true);
    }
  };
  
  // Handle payment completion
  const handlePaymentComplete = (success: boolean) => {
    setShowPaymentPortal(false);
    
    if (success && selectedBill) {
      // Update the bill status in the local state
      const updatedBills = bills.map(bill => 
        bill.id === selectedBill.id ? { ...bill, status: 'Paid' } : bill
      );
      setBills(updatedBills);
      
      // Show success message
      alert('Payment processed successfully!');
    }
  };
  
  // Handle invoice download
  const handleDownload = (billId: string) => {
    // In a real implementation, this would generate and download a PDF
    console.log('Downloading invoice:', billId);
    alert('Invoice download started.');
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Billing & Payments</h1>
        <p className="text-gray-600">
          Manage your medical bills, insurance claims, payment history, and health monitoring services.
        </p>
      </div>

      {/* Billing Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <CreditCard className="text-blue-900 w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Due</h3>
              <p className="text-2xl font-bold text-blue-900">${calculateTotalDue().toFixed(2)}</p>
            </div>
          </div>
          <button 
            onClick={() => handlePayment(bills.find(b => b.status === 'Pending')?.id || '')}
            disabled={!bills.some(b => b.status === 'Pending')}
            className={`w-full py-2 rounded-md font-medium ${!bills.some(b => b.status === 'Pending') ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'} text-white transition-colors`}
          >
            Pay All Bills
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Activity className="text-green-700 w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Health Monitoring</h3>
              <p className="text-2xl font-bold text-green-700">4</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('monitoring')}
            className="w-full border border-green-700 text-green-700 py-2 rounded-md hover:bg-green-50 transition-colors"
          >
            View Monitoring
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Shield className="text-purple-700 w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Insurance</h3>
              <p className="text-sm text-gray-600">View coverage details</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('insurance')}
            className="w-full border border-purple-700 text-purple-700 py-2 rounded-md hover:bg-purple-50 transition-colors"
          >
            View Coverage
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            <button
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'bills' ? 'border-b-2 border-blue-900 text-blue-900' : 'text-gray-500 hover:text-blue-900'}`}
              onClick={() => setActiveTab('bills')}
            >
              Bills & Payments
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'insurance' ? 'border-b-2 border-blue-900 text-blue-900' : 'text-gray-500 hover:text-blue-900'}`}
              onClick={() => setActiveTab('insurance')}
            >
              Insurance & Claims
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'monitoring' ? 'border-b-2 border-blue-900 text-blue-900' : 'text-gray-500 hover:text-blue-900'}`}
              onClick={() => setActiveTab('monitoring')}
            >
              Health Monitoring
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'telehealth' ? 'border-b-2 border-blue-900 text-blue-900' : 'text-gray-500 hover:text-blue-900'}`}
              onClick={() => setActiveTab('telehealth')}
            >
              Telehealth Billing
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
                <button className="flex items-center text-gray-600 hover:text-blue-900">
                  <Filter className="w-4 h-4 mr-1" />
                  Filter
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bills.map((bill) => (
                      <tr key={bill.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bill.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            {bill.telehealth && <Video size={16} className="text-blue-500 mr-1" />}
                            {bill.service}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bill.doctor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <p>${bill.amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Your cost: ${bill.patientResponsibility.toFixed(2)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${bill.status === 'Paid' ? 'bg-green-100 text-green-800' : bill.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            {bill.status !== 'Paid' && (
                              <button
                                onClick={() => handlePayment(bill.id)}
                                className="text-blue-900 hover:text-blue-700"
                              >
                                Pay Now
                              </button>
                            )}
                            <button
                              onClick={() => handleDownload(bill.id)}
                              className="text-gray-600 hover:text-blue-900"
                            >
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Cost Estimator */}
              <div className="mt-8">
                <CostEstimator patientId={patientId} insuranceVerification={insuranceVerification} />
              </div>
            </div>
          )}
          
          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <div className="space-y-6">
              <InsuranceVerification 
                patientId={patientId} 
                insuranceId="ins123"
                onVerificationComplete={setInsuranceVerification}
              />
              
              <ClaimTracker patientId={patientId} />
            </div>
          )}
          
          {/* Health Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div>
              <MonitoringDashboard patientId={patientId} />
            </div>
          )}
          
          {/* Telehealth Billing Tab */}
          {activeTab === 'telehealth' && (
            <div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                <div className="p-4 bg-blue-900 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Video className="mr-2" />
                    Telehealth Billing Information
                  </h3>
                </div>
                
                <div className="p-4">
                  <p className="text-gray-600 mb-4">
                    Telehealth services are billed using specific codes and modifiers to indicate virtual care delivery.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Common Telehealth Codes</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>99441</span>
                          <span>Phone evaluation, 5-10 minutes</span>
                        </li>
                        <li className="flex justify-between">
                          <span>99442</span>
                          <span>Phone evaluation, 11-20 minutes</span>
                        </li>
                        <li className="flex justify-between">
                          <span>99443</span>
                          <span>Phone evaluation, 21-30 minutes</span>
                        </li>
                        <li className="flex justify-between">
                          <span>99214-95</span>
                          <span>Office visit with telehealth modifier</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Insurance Coverage</h4>
                      <p className="text-sm mb-2">
                        Most insurance plans now cover telehealth services. Your specific coverage depends on your plan.
                      </p>
                      <p className="text-sm font-medium">
                        Your typical telehealth copay: ${insuranceVerification?.coverageDetails.copay.toFixed(2) || '25.00'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Recent Telehealth Bills</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bills
                            .filter(bill => bill.telehealth)
                            .map(bill => (
                              <tr key={bill.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{bill.date}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{bill.doctor}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{bill.service}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">${bill.patientResponsibility.toFixed(2)}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${bill.status === 'Paid' ? 'bg-green-100 text-green-800' : bill.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                                  >
                                    {bill.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Portal Modal */}
      {showPaymentPortal && selectedBill && (
        <PaymentPortal 
          bill={selectedBill} 
          onPaymentComplete={handlePaymentComplete} 
          onCancel={() => setShowPaymentPortal(false)} 
        />
      )}
    </div>
  );
};

export default BillingPage;