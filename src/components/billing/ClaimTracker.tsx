import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, ChevronRight, Search } from 'lucide-react';
import { Claim } from '../../types/Billing';

interface ClaimTrackerProps {
  patientId: string;
}

const ClaimTracker: React.FC<ClaimTrackerProps> = ({ patientId }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  
  useEffect(() => {
    // In a real implementation, this would fetch claims from an API
    // For now, we'll use mock data or localStorage
    const fetchClaims = async () => {
      try {
        setIsLoading(true);
        
        // Try to get claims from localStorage
        const storedClaims = localStorage.getItem('claims');
        if (storedClaims) {
          const allClaims = JSON.parse(storedClaims) as Claim[];
          setClaims(allClaims);
        } else {
          // Use mock data if no stored claims
          setClaims(getMockClaims());
        }
      } catch (error) {
        console.error('Error fetching claims:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClaims();
  }, [patientId]);
  
  // Filter claims based on search term
  const filteredClaims = claims.filter(claim => 
    claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.payer.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get status icon based on claim status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'In Process':
        return <Clock size={18} className="text-blue-600" />;
      case 'Denied':
        return <AlertTriangle size={18} className="text-red-600" />;
      case 'Submitted':
        return <FileText size={18} className="text-yellow-600" />;
      default:
        return <FileText size={18} className="text-gray-600" />;
    }
  };
  
  // Get status color based on claim status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'In Process':
        return 'bg-blue-100 text-blue-800';
      case 'Denied':
        return 'bg-red-100 text-red-800';
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Generate mock claims data
  const getMockClaims = (): Claim[] => {
    return [
      {
        id: 'CLM-001',
        billId: 'BILL-001',
        submissionDate: '2024-06-15',
        status: 'Paid',
        payer: 'BlueCross',
        amount: 120.00,
        remittanceAdvice: 'Payment processed on 2024-06-20'
      },
      {
        id: 'CLM-002',
        billId: 'BILL-002',
        submissionDate: '2024-06-10',
        status: 'In Process',
        payer: 'Aetna',
        amount: 60.00
      },
      {
        id: 'CLM-003',
        billId: 'BILL-003',
        submissionDate: '2024-06-05',
        status: 'Denied',
        payer: 'UnitedHealth',
        amount: 200.00,
        denialReason: 'Service not covered under current plan'
      },
      {
        id: 'CLM-004',
        billId: 'BILL-004',
        submissionDate: '2024-06-20',
        status: 'Submitted',
        payer: 'Medicare',
        amount: 72.00
      }
    ];
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Claims</h3>
        
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search claims..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        {filteredClaims.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <FileText size={40} className="mx-auto mb-2 text-gray-400" />
            <p>No claims found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredClaims.map(claim => (
              <div 
                key={claim.id}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedClaim?.id === claim.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setSelectedClaim(claim)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {getStatusIcon(claim.status)}
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{claim.id}</p>
                      <p className="text-sm text-gray-600">{claim.payer}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-3">
                      <p className="text-sm font-medium">${claim.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{formatDate(claim.submissionDate)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.status)}`}>
                      {claim.status}
                    </span>
                    <ChevronRight size={16} className="ml-2 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedClaim && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Claim Details</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Claim ID</p>
              <p className="font-medium">{selectedClaim.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bill ID</p>
              <p className="font-medium">{selectedClaim.billId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submission Date</p>
              <p className="font-medium">{formatDate(selectedClaim.submissionDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-medium">${selectedClaim.amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Insurance</p>
              <p className="font-medium">{selectedClaim.payer}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedClaim.status)}`}>
                {selectedClaim.status}
              </p>
            </div>
          </div>
          
          {selectedClaim.denialReason && (
            <div className="p-3 bg-red-50 rounded-md mb-3">
              <p className="text-sm font-medium text-red-800">Denial Reason</p>
              <p className="text-sm text-red-700">{selectedClaim.denialReason}</p>
            </div>
          )}
          
          {selectedClaim.remittanceAdvice && (
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-sm font-medium text-green-800">Payment Information</p>
              <p className="text-sm text-green-700">{selectedClaim.remittanceAdvice}</p>
            </div>
          )}
          
          {selectedClaim.status === 'In Process' && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Claim Timeline</h5>
              <div className="relative pl-6 border-l-2 border-blue-200 space-y-4">
                <div className="relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-blue-600"></div>
                  <p className="text-sm font-medium">Claim Submitted</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedClaim.submissionDate)}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-blue-400"></div>
                  <p className="text-sm font-medium">Claim Received by Payer</p>
                  <p className="text-xs text-gray-500">{formatDate(new Date(selectedClaim.submissionDate).setDate(new Date(selectedClaim.submissionDate).getDate() + 2))}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-gray-300"></div>
                  <p className="text-sm font-medium text-gray-500">Claim Processing</p>
                  <p className="text-xs text-gray-500">In progress</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimTracker;