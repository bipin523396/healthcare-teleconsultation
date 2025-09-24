import { supabase } from '../supabase';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId?: string;
  patientName?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'in-progress';
  type: 'in-person' | 'teleconsultation' | 'video' | 'audio';
  appointmentReason?: string;
  appointmentReasonText?: string;
  needsTranslator?: boolean;
  hasCaregiverJoining?: boolean;
  emailReminders?: boolean;
  smsReminders?: boolean;
  roomId?: string; // For video/audio calls
  joinUrl?: string; // URL for joining the teleconsultation
  created_at?: string;
  updated_at?: string;
}

class AppointmentService {
  async getAllAppointments(): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error retrieving appointments:', error);
      return [];
    }
  }

  async saveAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving appointment:', error);
      throw new Error('Failed to save appointment');
    }
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error('Failed to update appointment');
    }
  }

  async getTeleconsultationAppointments(patientId?: string): Promise<Appointment[]> {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .in('type', ['teleconsultation', 'video', 'audio'])
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      if (patientId) {
        query = query.eq('patientId', patientId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teleconsultation appointments:', error);
      return [];
    }
  }


  async deleteAppointment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  }
}

const appointmentService = new AppointmentService();
export default appointmentService;