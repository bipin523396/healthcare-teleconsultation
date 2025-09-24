import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Info } from 'lucide-react';
import BillingService from '../../services/BillingService';
import { InsuranceVerification as InsuranceVerificationType } from '../../types/Billing';

interface InsuranceVerificationProps {
  patientId: string;
  insuranceId?: string;
  onVerificationComplete?: (verification: InsuranceVerificationType) => void;
}

const InsuranceVerification: React.FC<InsuranceVerificationProps> = ({ 
  patientId, 
  insuranceId = 'ins123',
  onVerificationComplete 
}) => {
  const [verification, setVerification] = useState<InsuranceVerificationType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    verifyInsurance();
  }, [patientId, insuranceId]);
  
  const verifyInsurance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await BillingService.verifyInsurance(patientId, { insuranceId });
      
      setVerification(result);
      
      if (onVerificationComplete) {
        onVerificationComplete(result);
      }
    } catch (err) {
      console.error('Insurance verification error:', err);
      setError('Failed to verify insurance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full"></div>
          <div className="ml-4 w-3/4 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/6"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4 text-red-600">
          <AlertCircle className="mr-2" />
          <h3 className="text-lg font-semibold">Verification Error</h3>
        </div>
        <p className="text-gray-700 mb-4">{error}</p>
        <button 
          onClick={verifyInsurance}
          className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!verification) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-3 rounded-full">
          <Shield className="text-blue-900 w-6 h-6" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">Insurance Verification</h3>
          <p className="text-sm text-gray-600">
            Verified on {new Date(verification.verificationDate).toLocaleDateString()}
          </p>
        </div>
        <div className="ml-auto">
          {verification.eligibility ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircle size={16} className="mr-1" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <AlertCircle size={16} className="mr-1" /> Inactive
            </span>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Coverage Details</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Deductible</p>
            <div className="flex items-center mt-1">
              <p className="font-medium">${verification.coverageDetails.deductible.toFixed(2)}</p>
              <p className="text-sm text-gray-500 ml-2">
                (${verification.coverageDetails.deductibleMet.toFixed(2)} met)
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(verification.coverageDetails.deductibleMet / verification.coverageDetails.deductible) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Out-of-Pocket Maximum</p>
            <div className="flex items-center mt-1">
              <p className="font-medium">${verification.coverageDetails.outOfPocketMax.toFixed(2)}</p>
              <p className="text-sm text-gray-500 ml-2">
                (${verification.coverageDetails.outOfPocketMet.toFixed(2)} met)
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(verification.coverageDetails.outOfPocketMet / verification.coverageDetails.outOfPocketMax) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Copay</p>
            <p className="text-lg font-medium">${verification.coverageDetails.copay.toFixed(2)}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Coinsurance</p>
            <p className="text-lg font-medium">{(verification.coverageDetails.coinsurance * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>
      
      {verification.authorizationRequired && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-md flex items-start">
          <Info size={20} className="text-yellow-700 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-700">Prior Authorization Required</p>
            <p className="text-sm text-yellow-600">
              {verification.authorizationStatus || 'Authorization status pending'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceVerification;