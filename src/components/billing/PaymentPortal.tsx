import React, { useState } from 'react';
import { CreditCard, Calendar, Lock } from 'lucide-react';
import BillingService from '../../services/BillingService';
import { Bill, Payment } from '../../types/Billing';

interface PaymentPortalProps {
  bill: Bill;
  onPaymentComplete: (success: boolean) => void;
  onCancel: () => void;
}

const PaymentPortal: React.FC<PaymentPortalProps> = ({ bill, onPaymentComplete, onCancel }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? '/' + v.slice(2, 4) : '');
    }
    
    return v;
  };
  
  // Handle card number change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };
  
  // Handle expiry date change
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatExpiryDate(e.target.value);
    setExpiryDate(formattedValue);
  };
  
  // Process payment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      setError('Please fill in all fields');
      return;
    }
    
    if (cardNumber.replace(/\s+/g, '').length < 16) {
      setError('Please enter a valid card number');
      return;
    }
    
    if (cvv.length < 3) {
      setError('Please enter a valid CVV');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Create payment object
      const payment: Payment = {
        id: 'payment-' + Date.now(),
        billId: bill.id,
        date: new Date().toISOString(),
        amount: bill.patientResponsibility,
        method: 'Credit Card',
        status: 'Pending',
        transactionId: undefined
      };
      
      // Process payment through service
      const success = await BillingService.processPayment(bill.id, payment);
      
      // Simulate processing delay
      setTimeout(() => {
        setIsProcessing(false);
        onPaymentComplete(success);
      }, 2000);
      
    } catch (error) {
      setIsProcessing(false);
      setError('Payment processing failed. Please try again.');
      console.error('Payment error:', error);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Secure Payment</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-700">Payment Summary</h3>
            <span className="text-sm text-gray-500">Bill #{bill.id}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{bill.service}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Date:</span>
              <span>{bill.date}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Provider:</span>
              <span>{bill.doctor}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg mt-4">
              <span>Amount Due:</span>
              <span className="text-blue-900">${bill.patientResponsibility.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="cardNumber">
              Card Number
            </label>
            <div className="relative">
              <input
                id="cardNumber"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
              />
              <CreditCard className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="cardName">
              Cardholder Name
            </label>
            <input
              id="cardName"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="John Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="expiryDate">
                Expiry Date
              </label>
              <div className="relative">
                <input
                  id="expiryDate"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
                  maxLength={5}
                />
                <Calendar className="absolute right-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="cvv">
                CVV
              </label>
              <div className="relative">
                <input
                  id="cvv"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={4}
                />
                <Lock className="absolute right-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Lock size={16} className="mr-1" />
              <span>Secure, encrypted payment</span>
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className={`px-6 py-2 rounded-md font-medium ${isProcessing ? 'bg-gray-400' : 'bg-blue-900 hover:bg-blue-800'} text-white`}
            >
              {isProcessing ? (
                <>
                  <span className="inline-block animate-spin mr-2">&#9696;</span>
                  Processing...
                </>
              ) : (
                `Pay $${bill.patientResponsibility.toFixed(2)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentPortal;