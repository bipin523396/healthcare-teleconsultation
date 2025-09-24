export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  imageUrl: string;
  availableDates: string[];
  qualifications: string[];
  experience: number;
  languages: string[];
  bio: string;
  rating: number;
  email: string;
  phone: string;
  consultationTypes: ('in-person' | 'teleconsultation' | 'video' | 'audio')[];
  fees: number;
  isActive: boolean;
}