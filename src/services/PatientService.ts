// PatientService.ts - Service for managing patient data

export interface Patient {
  id: string;
  name: string;
  age: string;
  contact: string;
  medicalHistory: string;
  currentIssue: string;
  faceId: string; // Unique identifier for the face
  lastVisit?: string;
  doctor?: string;
  medication?: string;
  registrationDate: string;
}

class PatientService {
  private readonly STORAGE_KEY = 'healthcare_patients';
  
  // Get all patients from local storage
  async getAllPatients(): Promise<Patient[]> {
    try {
      const response = await fetch('http://localhost:5001/api/medical/patients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      return await response.json();
    } catch (error) {
      console.error('Error retrieving patients:', error);
      return [];
    }
  }
  
  // Save all patients to local storage
  saveAllPatients(patients: Patient[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patients));
  }
  
  // Add a new patient
  async addPatient(patient: Omit<Patient, 'id' | 'registrationDate'>): Promise<Patient> {
    try {
      const response = await fetch('http://localhost:5001/api/medical/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(patient)
      });
      if (!response.ok) throw new Error('Failed to add patient');
      return await response.json();
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  }
  
  // Find a patient by face ID
  findPatientByFaceId(faceId: string): Patient | null {
    const patients = this.getAllPatients();
    return patients.find(patient => patient.faceId === faceId) || null;
  }
  
  // Update patient information
  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient | null> {
    try {
      const response = await fetch(`http://localhost:5001/api/medical/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update patient');
      return await response.json();
    } catch (error) {
      console.error('Error updating patient:', error);
      return null;
    }
  }
  
  // Generate a unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  // In a real application, this would be a call to a face recognition API
  // For simulation purposes, we'll use a simple hash of the image data
  generateFaceId(imageData: string): string {
    // Simple hash function for demo purposes
    // In a real app, this would be replaced with actual face recognition
    let hash = 0;
    for (let i = 0; i < imageData.length; i++) {
      const char = imageData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}

// Create a singleton instance
const patientService = new PatientService();
export default patientService;