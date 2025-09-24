import { Bill, Claim, Payment, InsuranceVerification } from '../types/Billing';

class BillingService {
  // Get all bills for a patient
  async getPatientBills(patientId: string): Promise<Bill[]> {
    // In a real implementation, this would be an API call
    // For now, we'll retrieve from localStorage or use mock data
    try {
      const storedBills = localStorage.getItem('patient_bills');
      if (storedBills) {
        const allBills = JSON.parse(storedBills) as Bill[];
        return allBills.filter(bill => bill.patientId === patientId);
      }
    } catch (error) {
      console.error('Error retrieving bills from storage:', error);
    }
    
    // Return mock data if no stored bills
    return this.getMockBills(patientId);
  }
  
  // Process a payment
  async processPayment(billId: string, paymentDetails: Payment): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with a payment gateway
      // For now, we'll simulate a successful payment
      
      // Get existing bills
      const storedBills = localStorage.getItem('patient_bills');
      let bills: Bill[] = [];
      
      if (storedBills) {
        bills = JSON.parse(storedBills) as Bill[];
      } else {
        // If no bills in storage, use mock data
        const patientId = 'patient123'; // This would come from the payment details
        bills = this.getMockBills(patientId);
      }
      
      // Update the bill status
      const updatedBills = bills.map(bill => {
        if (bill.id === billId) {
          return { ...bill, status: 'Paid' };
        }
        return bill;
      });
      
      // Save updated bills
      localStorage.setItem('patient_bills', JSON.stringify(updatedBills));
      
      // Save the payment record
      const storedPayments = localStorage.getItem('payments');
      let payments: Payment[] = [];
      
      if (storedPayments) {
        payments = JSON.parse(storedPayments) as Payment[];
      }
      
      payments.push({
        ...paymentDetails,
        status: 'Completed',
        transactionId: 'txn-' + Date.now()
      });
      
      localStorage.setItem('payments', JSON.stringify(payments));
      
      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      return false;
    }
  }
  
  // Generate and submit insurance claim
  async submitClaim(billId: string): Promise<Claim> {
    try {
      // In a real implementation, this would submit to a clearinghouse via EDI
      // For now, we'll simulate claim creation
      
      // Get the bill details
      const storedBills = localStorage.getItem('patient_bills');
      let bill: Bill | undefined;
      
      if (storedBills) {
        const bills = JSON.parse(storedBills) as Bill[];
        bill = bills.find(b => b.id === billId);
      }
      
      if (!bill) {
        throw new Error('Bill not found');
      }
      
      // Create a new claim
      const newClaim: Claim = {
        id: 'claim-' + Date.now(),
        billId: billId,
        submissionDate: new Date().toISOString(),
        status: 'Submitted',
        payer: bill.insurance,
        amount: bill.insuranceResponsibility
      };
      
      // Save the claim
      const storedClaims = localStorage.getItem('claims');
      let claims: Claim[] = [];
      
      if (storedClaims) {
        claims = JSON.parse(storedClaims) as Claim[];
      }
      
      claims.push(newClaim);
      localStorage.setItem('claims', JSON.stringify(claims));
      
      return newClaim;
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  }
  
  // Verify insurance eligibility
  async verifyInsurance(patientId: string, insuranceDetails: any): Promise<InsuranceVerification> {
    // In a real implementation, this would call an eligibility API
    // For now, we'll return mock verification data
    
    const verification: InsuranceVerification = {
      patientId,
      insuranceId: insuranceDetails.insuranceId || 'ins123',
      verificationDate: new Date().toISOString(),
      eligibility: true,
      coverageDetails: {
        deductible: 1500,
        deductibleMet: 500,
        copay: 25,
        coinsurance: 0.2, // 20%
        outOfPocketMax: 5000,
        outOfPocketMet: 1200
      },
      authorizationRequired: false
    };
    
    return verification;
  }
  
  // Generate cost estimate
  async generateCostEstimate(procedureCodes: string[], patientInsurance: any): Promise<any> {
    // In a real implementation, this would use fee schedules and contract rates
    // For now, we'll use mock pricing data
    
    const mockPricing: Record<string, number> = {
      '99213': 120, // Office visit, established patient
      '99214': 180, // Office visit, established patient, moderate complexity
      '99215': 240, // Office visit, established patient, high complexity
      '99441': 55,  // Phone evaluation, 5-10 minutes
      '99442': 90,  // Phone evaluation, 11-20 minutes
      '99443': 130, // Phone evaluation, 21-30 minutes
      '90791': 200, // Psychiatric diagnostic evaluation
      '90837': 150, // Psychotherapy, 60 minutes
      '99453': 20,  // Remote monitoring setup
      '99454': 70,  // Remote monitoring device supply
      '99457': 50,  // Remote monitoring treatment management, first 20 minutes
      '99458': 40,  // Remote monitoring treatment management, additional 20 minutes
      '85025': 35,  // Complete blood count (CBC)
      '80053': 40   // Comprehensive metabolic panel
    };
    
    let totalCost = 0;
    let patientResponsibility = 0;
    let insuranceResponsibility = 0;
    
    const lineItems = procedureCodes.map(code => {
      const price = mockPricing[code] || 100; // Default price if code not found
      totalCost += price;
      
      return {
        code,
        description: this.getProcedureDescription(code),
        price
      };
    });
    
    // Calculate patient responsibility based on insurance
    if (patientInsurance && patientInsurance.coverageDetails) {
      const { deductible, deductibleMet, copay, coinsurance } = patientInsurance.coverageDetails;
      
      const remainingDeductible = Math.max(0, deductible - deductibleMet);
      const deductibleAmount = Math.min(remainingDeductible, totalCost);
      
      const amountAfterDeductible = totalCost - deductibleAmount;
      const coinsuranceAmount = amountAfterDeductible * coinsurance;
      
      patientResponsibility = deductibleAmount + coinsuranceAmount + copay;
      insuranceResponsibility = totalCost - patientResponsibility;
    } else {
      // No insurance, patient responsible for full amount
      patientResponsibility = totalCost;
    }
    
    return {
      totalCost,
      patientResponsibility,
      insuranceResponsibility,
      lineItems
    };
  }
  
  // Helper method to get procedure descriptions
  private getProcedureDescription(code: string): string {
    const descriptions: Record<string, string> = {
      '99213': 'Office visit, established patient, low complexity',
      '99214': 'Office visit, established patient, moderate complexity',
      '99215': 'Office visit, established patient, high complexity',
      '99441': 'Phone evaluation, 5-10 minutes',
      '99442': 'Phone evaluation, 11-20 minutes',
      '99443': 'Phone evaluation, 21-30 minutes',
      '90791': 'Psychiatric diagnostic evaluation',
      '90837': 'Psychotherapy, 60 minutes',
      '99453': 'Remote monitoring setup',
      '99454': 'Remote monitoring device supply',
      '99457': 'Remote monitoring treatment management, first 20 minutes',
      '99458': 'Remote monitoring treatment management, additional 20 minutes',
      '85025': 'Complete blood count (CBC)',
      '80053': 'Comprehensive metabolic panel'
    };
    
    return descriptions[code] || `Procedure code ${code}`;
  }
  
  // Helper method to generate mock bills
  private getMockBills(patientId: string): Bill[] {
    return [
      {
        id: 'BILL-001',
        patientId,
        date: '2024-06-15',
        service: 'General Consultation',
        procedureCodes: ['99213'],
        diagnosisCodes: ['J00', 'R05'],
        doctor: 'Dr. Sarah Johnson',
        amount: 150.00,
        patientResponsibility: 30.00,
        insuranceResponsibility: 120.00,
        status: 'Paid',
        insurance: 'BlueCross',
        telehealth: false,
        placeOfService: '11', // Office
        modifiers: []
      },
      {
        id: 'BILL-002',
        patientId,
        date: '2024-06-10',
        service: 'Teleconsultation',
        procedureCodes: ['99214'],
        diagnosisCodes: ['I10'],
        doctor: 'Dr. Michael Chen',
        amount: 75.00,
        patientResponsibility: 15.00,
        insuranceResponsibility: 60.00,
        status: 'Pending',
        insurance: 'Aetna',
        telehealth: true,
        placeOfService: '02', // Telehealth
        modifiers: ['95'] // Synchronous telemedicine service
      },
      {
        id: 'BILL-003',
        patientId,
        date: '2024-06-05',
        service: 'Lab Tests',
        procedureCodes: ['85025', '80053'],
        diagnosisCodes: ['E11.9', 'Z00.00'],
        doctor: 'Dr. Emily Patel',
        amount: 250.00,
        patientResponsibility: 50.00,
        insuranceResponsibility: 200.00,
        status: 'Failed',
        insurance: 'UnitedHealth',
        telehealth: false,
        placeOfService: '11', // Office
        modifiers: []
      },
      {
        id: 'BILL-004',
        patientId,
        date: '2024-06-20',
        service: 'Remote Patient Monitoring',
        procedureCodes: ['99457', '99458'],
        diagnosisCodes: ['I10', 'E11.9'],
        doctor: 'Dr. James Wilson',
        amount: 90.00,
        patientResponsibility: 18.00,
        insuranceResponsibility: 72.00,
        status: 'Pending',
        insurance: 'Medicare',
        telehealth: false,
        placeOfService: '11', // Office
        modifiers: []
      }
    ];
  }
}

export default new BillingService();