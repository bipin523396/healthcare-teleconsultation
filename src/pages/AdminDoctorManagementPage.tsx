import React, { useState, useEffect, useRef } from 'react';
import doctorService from '../services/DoctorService';
// Make saveDoctors method accessible
declare module '../services/DoctorService' {
  interface DoctorService {
    saveDoctors(doctors: Doctor[]): void;
  }
}
import { Doctor } from '../types/Doctor';
import { User, Calendar, X, Check, Upload, Edit, Trash2, Eye, EyeOff, Camera, Save } from 'lucide-react';

// Doctor interface is now imported from types/Doctor.ts

const AdminDoctorManagementPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // Load doctors from service when component mounts
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const loadedDoctors = await doctorService.getAllDoctors();
        console.log('Loaded doctors from storage:', loadedDoctors);
        setDoctors(loadedDoctors);
      } catch (error) {
        console.error('Error loading doctors:', error);
        setDoctors([]);
      }
    };
    fetchDoctors();
  }, []);

  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  
  // Form state for adding/editing a doctor
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    imageUrl: '',
    imageFile: null as File | null,
    imagePreview: '',
    qualifications: '',
    experience: 0,
    languages: '',
    bio: '',
    email: '',
    phone: '',
    fees: 0,
    consultationTypes: {
      inPerson: false,
      teleconsultation: false,
      video: false,
      audio: false
    },
    availableDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    startTime: '09:00',
    endTime: '17:00',
    isActive: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when changing tabs
  useEffect(() => {
    if (activeTab === 'add') {
      resetForm();
    } else if (activeTab === 'edit' && editingDoctor) {
      populateFormWithDoctor(editingDoctor);
    }
  }, [activeTab, editingDoctor]);

  const resetForm = () => {
    setFormData({
      name: '',
      specialty: '',
      imageUrl: '',
      imageFile: null,
      imagePreview: '',
      qualifications: '',
      experience: 0,
      languages: '',
      bio: '',
      email: '',
      phone: '',
      fees: 0,
      consultationTypes: {
        inPerson: false,
        teleconsultation: false,
        video: false,
        audio: false
      },
      availableDays: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
      },
      startTime: '09:00',
      endTime: '17:00',
      isActive: true
    });
  };

  const populateFormWithDoctor = (doctor: Doctor) => {
    setFormData({
      name: doctor.name,
      specialty: doctor.specialty,
      imageUrl: doctor.imageUrl,
      imageFile: null,
      imagePreview: doctor.imageUrl,
      qualifications: doctor.qualifications.join(', '),
      experience: doctor.experience,
      languages: doctor.languages.join(', '),
      bio: doctor.bio,
      email: doctor.email || '',
      phone: doctor.phone || '',
      fees: doctor.fees || 0,
      consultationTypes: {
        inPerson: doctor.consultationTypes?.includes('in-person') || false,
        teleconsultation: doctor.consultationTypes?.includes('teleconsultation') || false,
        video: doctor.consultationTypes?.includes('video') || false,
        audio: doctor.consultationTypes?.includes('audio') || false
      },
      availableDays: {
        monday: true, // In a real app, this would be populated from the doctor's schedule
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      },
      startTime: '09:00',
      endTime: '17:00',
      isActive: doctor.isActive || true
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert image to Base64 string instead of blob URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          imageFile: file,
          imagePreview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.startsWith('consultationTypes.')) {
      const type = name.split('.')[1];
      setFormData({
        ...formData,
        consultationTypes: {
          ...formData.consultationTypes,
          [type]: checked
        }
      });
    } else if (name.startsWith('availableDays.')) {
      const day = name.split('.')[1];
      setFormData({
        ...formData,
        availableDays: {
          ...formData.availableDays,
          [day]: checked
        }
      });
    } else if (name === 'isActive') {
      setFormData({
        ...formData,
        isActive: checked
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.specialty || !formData.qualifications || !formData.languages || !formData.bio) {
      alert('Please fill in all required fields marked with *');
      return;
    }
    
    // Convert form data to Doctor object
    const consultationTypes: ('in-person' | 'teleconsultation' | 'video' | 'audio')[] = [];
    if (formData.consultationTypes.inPerson) consultationTypes.push('in-person');
    if (formData.consultationTypes.teleconsultation) consultationTypes.push('teleconsultation');
    if (formData.consultationTypes.video) consultationTypes.push('video');
    if (formData.consultationTypes.audio) consultationTypes.push('audio');
    
    if (consultationTypes.length === 0) {
      alert('Please select at least one consultation type');
      return;
    }
    
    // Check if at least one day is selected
    const hasSelectedDay = Object.values(formData.availableDays).some(value => value);
    if (!hasSelectedDay) {
      alert('Please select at least one available day');
      return;
    }
    
    // Generate available dates based on selected days (for demo purposes)
    const availableDates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = date.getDay();
      
      // Check if this day is selected in availableDays
      if (
        (dayOfWeek === 0 && formData.availableDays.sunday) ||
        (dayOfWeek === 1 && formData.availableDays.monday) ||
        (dayOfWeek === 2 && formData.availableDays.tuesday) ||
        (dayOfWeek === 3 && formData.availableDays.wednesday) ||
        (dayOfWeek === 4 && formData.availableDays.thursday) ||
        (dayOfWeek === 5 && formData.availableDays.friday) ||
        (dayOfWeek === 6 && formData.availableDays.saturday)
      ) {
        // Format date as YYYY-MM-DD
        const formattedDate = date.toISOString().split('T')[0];
        availableDates.push(formattedDate);
      }
    }
    
    // Use the Base64 image data directly
    let imageUrl = formData.imageUrl;
    if (formData.imageFile && formData.imagePreview) {
      // Use the Base64 data directly
      imageUrl = formData.imagePreview;
    }
    
    try {
      if (activeTab === 'add') {
        // Create doctor object without ID (service will generate one)
        const doctorData = {
          name: formData.name,
          specialty: formData.specialty,
          imageUrl: imageUrl || 'https://randomuser.me/api/portraits/lego/1.jpg', // Default image
          availableDates,
          qualifications: formData.qualifications.split(',').map(q => q.trim()),
          experience: formData.experience,
          languages: formData.languages.split(',').map(l => l.trim()),
          bio: formData.bio,
          email: formData.email,
          phone: formData.phone,
          consultationTypes,
          fees: formData.fees,
          isActive: formData.isActive,
          rating: 5.0 // New doctors start with 5.0
        };
        
        // Save to backend service
        const savedDoctor = await doctorService.saveDoctor(doctorData);
        console.log('Doctor saved successfully:', savedDoctor);
        
        // Update local state with the newly saved doctor
        const updatedDoctors = [...doctors, savedDoctor];
        setDoctors(updatedDoctors);
        
        // Show success message
        const successMessage = document.getElementById('success-message');
        if (successMessage) {
          successMessage.classList.remove('hidden');
          document.getElementById('success-message-text')!.innerText = 'Doctor added successfully!';
          setTimeout(() => {
            successMessage.classList.add('hidden');
          }, 3000);
        } else {
          alert('Doctor added successfully!');
        }
      } else if (activeTab === 'edit' && editingDoctor) {
        // Create updated doctor object with existing ID
        const updatedDoctor: Doctor = {
          id: editingDoctor.id,
          name: formData.name,
          specialty: formData.specialty,
          imageUrl: imageUrl || 'https://randomuser.me/api/portraits/lego/1.jpg',
          availableDates,
          qualifications: formData.qualifications.split(',').map(q => q.trim()),
          experience: formData.experience,
          languages: formData.languages.split(',').map(l => l.trim()),
          bio: formData.bio,
          rating: editingDoctor.rating,
          email: formData.email,
          phone: formData.phone,
          consultationTypes,
          fees: formData.fees,
          isActive: formData.isActive
        };
        
        // Update in backend service
        const result = await doctorService.updateDoctor(updatedDoctor);
        console.log('Doctor updated successfully:', result);
        
        if (result) {
          // Update local state
          const updatedDoctors = doctors.map(doc => doc.id === editingDoctor.id ? result : doc);
          setDoctors(updatedDoctors);
          
          // Show success message
          const successMessage = document.getElementById('success-message');
          if (successMessage) {
            successMessage.classList.remove('hidden');
            document.getElementById('success-message-text')!.innerText = 'Doctor updated successfully!';
            setTimeout(() => {
              successMessage.classList.add('hidden');
            }, 3000);
          } else {
            alert('Doctor updated successfully!');
          }
        } else {
          alert('Error updating doctor. Doctor not found.');
        }
      }
      
      // Add a small delay before resetting form and going back to list view
      // This ensures the state updates have time to complete
      setTimeout(async () => {
        resetForm();
        setActiveTab('list');
        setEditingDoctor(null);
        
        // Refresh the doctor list from storage to ensure we have the latest data
        const refreshedDoctors = await doctorService.getAllDoctors();
        setDoctors(refreshedDoctors);
      }, 500);
    } catch (error) {
      console.error('Error saving doctor:', error);
      const errorMessage = error instanceof Error ? error.message : 'There was an error saving the doctor. Please try again.';
      
      // Show error message in the UI
      const successMessage = document.getElementById('success-message');
      if (successMessage) {
        successMessage.classList.remove('hidden');
        successMessage.classList.remove('bg-green-100', 'border-green-400', 'text-green-700');
        successMessage.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
        document.getElementById('success-message-text')!.innerText = errorMessage;
        setTimeout(() => {
          successMessage.classList.add('hidden');
          successMessage.classList.remove('bg-red-100', 'border-red-400', 'text-red-700');
          successMessage.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
        }, 3000);
      } else {
        alert(errorMessage);
      }
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setActiveTab('edit');
  };

  const handleDelete = async (doctorId: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const success = await doctorService.deleteDoctor(doctorId);
        if (success) {
          setDoctors(doctors.filter(doc => doc.id !== doctorId));
          alert('Doctor deleted successfully!');
        } else {
          alert('Error deleting doctor. Doctor not found.');
        }
      } catch (error) {
        console.error('Error deleting doctor:', error);
        alert('Error deleting doctor. Please try again.');
      }
    }
  };

  const handleToggleActive = async (doctorId: string, currentStatus: boolean) => {
    try {
      const doctors = await doctorService.getAllDoctors();
      const doctor = doctors.find(d => d.id === doctorId);
      if (!doctor) {
        alert('Doctor not found.');
        return;
      }
      const updatedDoctor = await doctorService.updateDoctor({
        ...doctor,
        isActive: !currentStatus
      });
      if (updatedDoctor) {
        setDoctors(doctors.map(doc => 
          doc.id === doctorId ? updatedDoctor : doc
        ));
      } else {
        alert('Error updating doctor status.');
      }
    } catch (error) {
      console.error('Error toggling doctor status:', error);
      alert('Error updating doctor status. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-900">Doctor Management</h1>
        <div className="flex space-x-3">
          {activeTab === 'list' && (
            <button 
              onClick={async () => {
                try {
                  // Fetch current doctors from backend
                  const currentDoctors = await doctorService.getAllDoctors();
                  
                  // Update each doctor in the backend
                  for (const doctor of currentDoctors) {
                    await doctorService.updateDoctor(doctor);
                  }
                  
                  // Show success message
                  const successMessage = document.getElementById('success-message');
                  if (successMessage) {
                    successMessage.classList.remove('hidden');
                    document.getElementById('success-message-text')!.innerText = 'All changes saved successfully!';
                    setTimeout(() => {
                      successMessage.classList.add('hidden');
                    }, 3000);
                  } else {
                    alert('All changes saved successfully!');
                  }
                } catch (error) {
                  console.error('Error saving changes:', error);
                  alert('Error saving changes. Please try again.');
                }
              }} 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Save className="mr-2" size={18} />
              Save Page
            </button>
          )}
          
          {activeTab === 'list' ? (
            <button 
              onClick={() => setActiveTab('add')} 
              className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Add New Doctor
            </button>
          ) : (
            <button 
              onClick={() => {
                setActiveTab('list');
                setEditingDoctor(null);
              }} 
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to List
            </button>
          )}
        </div>
      </div>
      
      {/* Success Message */}
      <div id="success-message" className="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
        <div className="flex items-center">
          <Check className="mr-2" size={20} />
          <span id="success-message-text" className="block sm:inline">
            {activeTab === 'add' ? 'Doctor added successfully!' : 'Doctor updated successfully!'}
          </span>
        </div>
        <button 
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          onClick={() => document.getElementById('success-message')?.classList.add('hidden')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Doctor List View */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={doctor.imageUrl} alt={doctor.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                        <div className="text-sm text-gray-500">{doctor.experience} years exp.</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.specialty}</div>
                    <div className="text-sm text-gray-500">{doctor.qualifications.join(', ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.email}</div>
                    <div className="text-sm text-gray-500">{doctor.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(doctor)} 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleToggleActive(doctor.id, doctor.isActive || false)} 
                      className={`${doctor.isActive ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'} mr-3`}
                    >
                      {doctor.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button 
                      onClick={() => handleDelete(doctor.id)} 
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Doctor Form */}
      {(activeTab === 'add' || activeTab === 'edit') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-6">
            {activeTab === 'add' ? 'Add New Doctor' : `Edit Doctor: ${editingDoctor?.name}`}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-800">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialty*</label>
                  <div className="flex">
                    <input
                      type="text"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter specialty (e.g., Cardiologist, Neurologist)"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">You can enter any specialty</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Photo</label>
                  <div className="mb-2">
                    {formData.imagePreview ? (
                      <div className="relative w-32 h-32 mx-auto mb-2">
                        <img 
                          src={formData.imagePreview} 
                          alt="Doctor preview" 
                          className="w-32 h-32 rounded-full object-cover border-2 border-blue-900"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, imagePreview: '', imageFile: null})}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                          title="Remove image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="w-32 h-32 mx-auto mb-2 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-blue-500"
                        onClick={triggerFileInput}
                      >
                        <Camera size={40} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button 
                      type="button" 
                      onClick={triggerFileInput}
                      className="w-full bg-blue-50 text-blue-900 p-2 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center"
                    >
                      <Upload size={20} className="mr-2" />
                      Upload Photo
                    </button>
                  </div>
                  
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Or enter image URL</label>
                    <input
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="https://example.com/doctor-photo.jpg"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Upload image (max 2MB) or enter URL</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications*</label>
                  <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="MD, FACC, Board Certified"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience*</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Languages Spoken*</label>
                  <input
                    type="text"
                    name="languages"
                    value={formData.languages}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="English, Spanish"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                </div>
              </div>
              
              {/* Contact & Professional Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-800">Contact & Professional Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)*</label>
                  <input
                    type="number"
                    name="fees"
                    value={formData.fees}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio*</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleCheckboxChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active (Available for Booking)</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Consultation Types & Availability */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-blue-800 mb-3">Consultation Types & Availability</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Types*</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="consultationTypes.inPerson"
                        checked={formData.consultationTypes.inPerson}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">In-Person Visit</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="consultationTypes.teleconsultation"
                        checked={formData.consultationTypes.teleconsultation}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Teleconsultation</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="consultationTypes.video"
                        checked={formData.consultationTypes.video}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Video Call</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="consultationTypes.audio"
                        checked={formData.consultationTypes.audio}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Audio Call</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Days*</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="availableDays.monday"
                        checked={formData.availableDays.monday}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Monday</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="availableDays.tuesday"
                        checked={formData.availableDays.tuesday}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Tuesday</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="availableDays.wednesday"
                        checked={formData.availableDays.wednesday}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Wednesday</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="availableDays.thursday"
                        checked={formData.availableDays.thursday}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Thursday</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="availableDays.friday"
                        checked={formData.availableDays.friday}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Friday</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="availableDays.saturday"
                        checked={formData.availableDays.saturday}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Saturday</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="availableDays.sunday"
                        checked={formData.availableDays.sunday}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Sunday</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours Start*</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours End*</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('list');
                  setEditingDoctor(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors flex items-center"
              >
                <Save className="mr-2" size={18} />
                {activeTab === 'add' ? 'Save Doctor' : 'Update Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDoctorManagementPage;