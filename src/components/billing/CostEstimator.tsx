import React, { useState } from 'react';
import { Calculator, DollarSign, ChevronDown, ChevronUp, PlusCircle, MinusCircle } from 'lucide-react';
import BillingService from '../../services/BillingService';
import { InsuranceVerification } from '../../types/Billing';

interface CostEstimatorProps {
  patientId: string;
  insuranceVerification: InsuranceVerification | null;
}

const CostEstimator: React.FC<CostEstimatorProps> = ({ patientId, insuranceVerification }) => {
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>(['99213']); // Default to office visit
  const [isCalculating, setIsCalculating] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Common procedure codes with descriptions
  const commonProcedures = [
    { code: '99213', description: 'Office visit, established patient, low complexity' },
    { code: '99214', description: 'Office visit, established patient, moderate complexity' },
    { code: '99215', description: 'Office visit, established patient, high complexity' },
    { code: '99441', description: 'Phone evaluation, 5-10 minutes' },
    { code: '99442', description: 'Phone evaluation, 11-20 minutes' },
    { code: '99443', description: 'Phone evaluation, 21-30 minutes' },
    { code: '90791', description: 'Psychiatric diagnostic evaluation' },
    { code: '90837', description: 'Psychotherapy, 60 minutes' },
    { code: '99453', description: 'Remote monitoring setup' },
    { code: '99454', description: 'Remote monitoring device supply' },
    { code: '99457', description: 'Remote monitoring treatment management, first 20 minutes' },
    { code: '85025', description: 'Complete blood count (CBC)' },
    { code: '80053', description: 'Comprehensive metabolic panel' }
  ];
  
  // Toggle procedure selection
  const toggleProcedure = (code: string) => {
    if (selectedProcedures.includes(code)) {
      setSelectedProcedures(selectedProcedures.filter(c => c !== code));
    } else {
      setSelectedProcedures([...selectedProcedures, code]);
    }
  };
  
  // Generate cost estimate
  const generateEstimate = async () => {
    if (selectedProcedures.length === 0) {
      return;
    }
    
    try {
      setIsCalculating(true);
      
      const result = await BillingService.generateCostEstimate(
        selectedProcedures,
        insuranceVerification
      );
      
      setEstimate(result);
      setIsExpanded(true);
    } catch (error) {
      console.error('Error generating cost estimate:', error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div 
        className="p-4 bg-blue-900 text-white flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Calculator className="mr-2" />
          <h3 className="font-semibold">Cost Estimator</h3>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Select procedures to estimate your out-of-pocket costs based on your insurance coverage.
          </p>
          
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Select Procedures</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {commonProcedures.map(procedure => (
                <div 
                  key={procedure.code}
                  className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleProcedure(procedure.code)}
                >
                  <div className="flex-shrink-0 mr-2">
                    {selectedProcedures.includes(procedure.code) ? (
                      <MinusCircle size={18} className="text-blue-600" />
                    ) : (
                      <PlusCircle size={18} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{procedure.description}</p>
                    <p className="text-xs text-gray-500">Code: {procedure.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={generateEstimate}
            disabled={selectedProcedures.length === 0 || isCalculating}
            className={`w-full py-2 rounded-md font-medium ${isCalculating || selectedProcedures.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'} text-white transition-colors`}
          >
            {isCalculating ? 'Calculating...' : 'Calculate Estimate'}
          </button>
          
          {estimate && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Cost Estimate</h4>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-semibold">${estimate.totalCost.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-800">Insurance Pays:</span>
                    <span className="font-semibold text-blue-800">${estimate.insuranceResponsibility.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-800">Your Estimated Cost:</span>
                    <span className="font-semibold text-yellow-800">${estimate.patientResponsibility.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Procedure Breakdown</h5>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {estimate.lineItems.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.description}</p>
                              <p className="text-xs text-gray-500">Code: {item.code}</p>
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                            ${item.price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                <p className="flex items-center">
                  <DollarSign size={16} className="mr-1" />
                  This is an estimate based on your insurance information and may not reflect the final cost.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CostEstimator;