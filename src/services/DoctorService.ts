import { Doctor } from '../types/Doctor';
import { supabase } from '../supabase';

class DoctorService {

  /**
   * Get all doctors from Supabase
   */
  async getAllDoctors(): Promise<Doctor[]> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error retrieving doctors:', error);
      return [];
    }
  }

  /**
   * Save a new doctor
   */
  async saveDoctor(doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    try {
      console.log('Saving doctor to Supabase:', doctor);
      
      const { data, error } = await supabase
        .from('doctors')
        .insert({
          name: doctor.name,
          specialty: doctor.specialty,
          imageUrl: doctor.imageUrl || null,
          availableDates: doctor.availableDates || [],
          qualifications: doctor.qualifications || [],
          experience: doctor.experience || 0,
          languages: doctor.languages || [],
          bio: doctor.bio || '',
          rating: doctor.rating || 5.0,
          email: doctor.email || '',
          phone: doctor.phone || '',
          consultationTypes: doctor.consultationTypes || [],
          fees: doctor.fees || 0,
          isActive: doctor.isActive !== undefined ? doctor.isActive : true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Doctor saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error saving doctor:', error);
      throw new Error(`Failed to save doctor: ${error.message}`);
    }
  }

  /**
   * Update an existing doctor
   */
  async updateDoctor(doctor: Doctor): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .update({
          name: doctor.name,
          specialty: doctor.specialty,
          imageUrl: doctor.imageUrl,
          availableDates: doctor.availableDates,
          qualifications: doctor.qualifications,
          experience: doctor.experience,
          languages: doctor.languages,
          bio: doctor.bio,
          rating: doctor.rating,
          email: doctor.email,
          phone: doctor.phone,
          consultationTypes: doctor.consultationTypes,
          fees: doctor.fees,
          isActive: doctor.isActive
        })
        .eq('id', doctor.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating doctor:', error);
      return null;
    }
  }

  /**
   * Delete a doctor by ID
   */
  async deleteDoctor(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error deleting doctor:', error);
      return false;
    }
  }

  /**
   * Get a doctor by ID
   */
  async getDoctorById(id: string): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error retrieving doctor by ID:', error);
      return null;
    }
  }

  /**
   * Toggle doctor active status
   */
  async toggleDoctorStatus(id: string): Promise<Doctor | null> {
    try {
      const doctor = await this.getDoctorById(id);
      if (!doctor) {
        return null;
      }

      return await this.updateDoctor({
        ...doctor,
        isActive: !doctor.isActive
      });
    } catch (error) {
      console.error('Error toggling doctor status:', error);
      return null;
    }
  }
}

const doctorService = new DoctorService();

export default doctorService;