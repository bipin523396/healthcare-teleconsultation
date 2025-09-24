// Billing system data models

export interface Bill {
  id: string;
  patientId: string;
  date: string;
  service: string;
  procedureCodes: string[];
  diagnosisCodes: string[];
  doctor: string;
  amount: number;
  patientResponsibility: number;
  insuranceResponsibility: number;
  status: 'Paid' | 'Pending' | 'Failed' | 'Partially Paid';
  insurance: string;
  telehealth: boolean;
  placeOfService: string;
  modifiers: string[];
}

export interface Claim {
  id: string;
  billId: string;
  submissionDate: string;
  status: 'Submitted' | 'In Process' | 'Denied' | 'Paid';
  payer: string;
  amount: number;
  denialReason?: string;
  remittanceAdvice?: string;
}

export interface Payment {
  id: string;
  billId: string;
  date: string;
  amount: number;
  method: 'Credit Card' | 'Bank Transfer' | 'PayPal' | 'Insurance';
  status: 'Completed' | 'Failed' | 'Pending';
  transactionId?: string;
}

export interface InsuranceVerification {
  patientId: string;
  insuranceId: string;
  verificationDate: string;
  eligibility: boolean;
  coverageDetails: {
    deductible: number;
    deductibleMet: number;
    copay: number;
    coinsurance: number;
    outOfPocketMax: number;
    outOfPocketMet: number;
  };
  authorizationRequired: boolean;
  authorizationStatus?: string;
}

export interface MonitoringEvent {
  id: string;
  patientId: string;
  deviceId: string;
  deviceType: string;
  timestamp: string;
  dataType: string;
  value: number;
  unit: string;
  billable: boolean;
  billingCode?: string;
}