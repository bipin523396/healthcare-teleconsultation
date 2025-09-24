import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, X, Check, RefreshCw, Video, Phone } from 'lucide-react';
import doctorService from '../services/DoctorService';
import appointmentService, { Appointment } from '../services/AppointmentService';

interface Doctor {
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
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'teleconsultation' | 'video' | 'audio'>('in-person');
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'book' | 'upcoming' | 'past'>('book');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [appointmentReasonText, setAppointmentReasonText] = useState<string>('');
  const [appointmentReason, setAppointmentReason] = useState<string>('');
  const [needsTranslator, setNeedsTranslator] = useState<boolean>(false);
  const [hasCaregiverJoining, setHasCaregiverJoining] = useState<boolean>(false);
  const [emailReminders, setEmailReminders] = useState<boolean>(true);
  const [smsReminders, setSmsReminders] = useState<boolean>(false);
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Load doctors and appointments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loadedDoctors, loadedAppointments] = await Promise.all([
          doctorService.getAllDoctors(),
          appointmentService.getAllAppointments()
        ]);
        setDoctors(loadedDoctors);
        setAppointments(loadedAppointments);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    fetchData();
  }, []);
  
  // Generate time slots
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const time = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      slots.push({ time, available: Math.random() > 0.3 });
      
      if (hour < endHour) {
        const halfHourTime = `${hour % 12 === 0 ? 12 : hour % 12}:30 ${hour < 12 ? 'AM' : 'PM'}`;
        slots.push({ time: halfHourTime, available: Math.random() > 0.3 });
      }
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate('');
    setSelectedTime('');
    setBookingStep(2);
  };
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setBookingStep(3);
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setBookingStep(4);
  };
  
  const handleTypeSelect = (type: 'in-person' | 'teleconsultation' | 'video' | 'audio') => {
    setAppointmentType(type);
  };
  
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    
    setLoading(true);
    
    try {
      const newAppointment = await appointmentService.saveAppointment({
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        date: selectedDate,
        time: selectedTime,
        status: 'upcoming',
        type: appointmentType,
        appointmentReason,
        appointmentReasonText,
        needsTranslator,
        hasCaregiverJoining,
        emailReminders,
        smsReminders
      });
      
      setAppointments([...appointments, newAppointment]);
      setLoading(false);
      setBookingSuccess(true);
      
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedTime('');
        setBookingStep(1);
        setActiveTab('upcoming');
      }, 3000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setLoading(false);
      alert('Failed to book appointment. Please try again.');
    }
  };
  
  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      const appointment = appointments.find(app => app.id === appointmentId);
      if (appointment) {
        const updatedAppointment = await appointmentService.updateAppointment({
          ...appointment,
          status: 'cancelled'
        });
        if (updatedAppointment) {
          setAppointments(appointments.map(app => 
            app.id === appointmentId ? updatedAppointment : app
          ));
          // Switch to past appointments tab to show the cancelled appointment
          setActiveTab('past');
        }
      }
    }
  };
  
  const handleDeleteAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this appointment?')) {
      const success = await appointmentService.deleteAppointment(appointmentId);
      if (success) {
        setAppointments(appointments.filter(app => app.id !== appointmentId));
      }
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Appointments</h1>
        <p className="text-gray-600">
          Book, manage, and track your medical appointments all in one place.
        </p>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'book'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-blue-900'
              }`}
              onClick={() => setActiveTab('book')}
            >
              Book Appointment
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'upcoming'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-blue-900'
              }`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Appointments ({appointments.filter(app => app.status === 'upcoming').length})
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'past'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-blue-900'
              }`}
              onClick={() => setActiveTab('past')}
            >
              Past Appointments ({appointments.filter(app => app.status === 'completed' || app.status === 'cancelled').length})
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Book Appointment Tab */}
          {activeTab === 'book' && (
            <div>
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <Check className="mx-auto mb-2" size={48} />
                    <h3 className="text-lg font-semibold">Appointment Booked Successfully!</h3>
                    <p>Your appointment with {selectedDoctor?.name} on {formatDate(selectedDate)} at {selectedTime} has been confirmed.</p>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Step 1: Select Doctor */}
                  {bookingStep === 1 && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Doctor</h2>
                      
                      {/* Filters */}
                      <div className="mb-6 flex flex-wrap gap-4">
                        <select 
                          className="border rounded-lg px-3 py-2"
                          value={specialtyFilter}
                          onChange={(e) => setSpecialtyFilter(e.target.value)}
                        >
                          <option value="">All Specialties</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="Pediatrics">Pediatrics</option>
                        </select>
                        
                        <select 
                          className="border rounded-lg px-3 py-2"
                          value={languageFilter}
                          onChange={(e) => setLanguageFilter(e.target.value)}
                        >
                          <option value="">All Languages</option>
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="Hindi">Hindi</option>
                        </select>
                      </div>
                      
                      {/* Doctor List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors
                          .filter(doctor => 
                            (!specialtyFilter || doctor.specialty === specialtyFilter) &&
                            (!languageFilter || doctor.languages.includes(languageFilter))
                          )
                          .map(doctor => (
                            <div key={doctor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                 onClick={() => handleDoctorSelect(doctor)}>
                              <div className="flex items-center mb-3">
                                <img 
                                  src={doctor.imageUrl} 
                                  alt={doctor.name}
                                  className="w-16 h-16 rounded-full object-cover mr-4"
                                />
                                <div>
                                  <h3 className="text-lg font-semibold text-blue-900">{doctor.name}</h3>
                                  <p className="text-gray-600">{doctor.specialty}</p>
                                  <div className="flex items-center mt-1">
                                    <span className="text-yellow-500">★</span>
                                    <span className="text-sm text-gray-600 ml-1">{doctor.rating}</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{doctor.experience} years experience</p>
                              <p className="text-sm text-gray-500 line-clamp-2">{doctor.bio}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Step 2: Select Date */}
                  {bookingStep === 2 && selectedDoctor && (
                    <div>
                      <button 
                        className="text-blue-900 mb-4 flex items-center"
                        onClick={() => setBookingStep(1)}
                      >
                        ← Back to Doctor Selection
                      </button>
                      
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date</h2>
                      <p className="text-gray-600 mb-6">Booking with {selectedDoctor.name}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedDoctor.availableDates.map(date => (
                          <button
                            key={date}
                            className={`p-4 border rounded-lg text-center hover:bg-blue-50 transition-colors ${
                              selectedDate === date ? 'border-blue-900 bg-blue-50' : 'border-gray-300'
                            }`}
                            onClick={() => handleDateSelect(date)}
                          >
                            <div className="font-semibold">{formatDate(date)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Step 3: Select Time */}
                  {bookingStep === 3 && selectedDate && (
                    <div>
                      <button 
                        className="text-blue-900 mb-4 flex items-center"
                        onClick={() => setBookingStep(2)}
                      >
                        ← Back to Date Selection
                      </button>
                      
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Time</h2>
                      <p className="text-gray-600 mb-6">{formatDate(selectedDate)}</p>
                      
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {timeSlots.map(slot => (
                          <button
                            key={slot.time}
                            className={`p-3 border rounded-lg text-center transition-colors ${
                              !slot.available 
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : selectedTime === slot.time
                                ? 'border-blue-900 bg-blue-50 text-blue-900'
                                : 'border-gray-300 hover:bg-blue-50'
                            }`}
                            onClick={() => slot.available && handleTimeSelect(slot.time)}
                            disabled={!slot.available}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Step 4: Appointment Details */}
                  {bookingStep === 4 && (
                    <div>
                      <button 
                        className="text-blue-900 mb-4 flex items-center"
                        onClick={() => setBookingStep(3)}
                      >
                        ← Back to Time Selection
                      </button>
                      
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Details</h2>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="font-semibold mb-2">Appointment Summary</h3>
                        <p><strong>Doctor:</strong> {selectedDoctor?.name}</p>
                        <p><strong>Date:</strong> {formatDate(selectedDate)}</p>
                        <p><strong>Time:</strong> {selectedTime}</p>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Appointment Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { type: 'in-person', label: 'In-Person Visit', icon: User },
                              { type: 'teleconsultation', label: 'Teleconsultation', icon: Phone },
                              { type: 'video', label: 'Video Call', icon: Video },
                              { type: 'audio', label: 'Audio Call', icon: Phone }
                            ].map(({ type, label, icon: Icon }) => (
                              <button
                                key={type}
                                className={`p-4 border rounded-lg text-center transition-colors ${
                                  appointmentType === type
                                    ? 'border-blue-900 bg-blue-50 text-blue-900'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                                onClick={() => handleTypeSelect(type as any)}
                              >
                                <Icon className="mx-auto mb-2" size={24} />
                                <div className="text-sm font-medium">{label}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Reason for Visit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                          <select 
                            className="w-full border rounded-lg px-3 py-2 mb-2"
                            value={appointmentReason}
                            onChange={(e) => setAppointmentReason(e.target.value)}
                          >
                            <option value="">Select reason</option>
                            <option value="routine-checkup">Routine Checkup</option>
                            <option value="follow-up">Follow-up Visit</option>
                            <option value="new-symptoms">New Symptoms</option>
                            <option value="medication-review">Medication Review</option>
                            <option value="other">Other</option>
                          </select>
                          <textarea
                            className="w-full border rounded-lg px-3 py-2"
                            rows={3}
                            placeholder="Please describe your symptoms or reason for visit..."
                            value={appointmentReasonText}
                            onChange={(e) => setAppointmentReasonText(e.target.value)}
                          />
                        </div>
                        
                        {/* Additional Options */}
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="translator"
                              checked={needsTranslator}
                              onChange={(e) => setNeedsTranslator(e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor="translator" className="text-sm">I need a translator</label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="caregiver"
                              checked={hasCaregiverJoining}
                              onChange={(e) => setHasCaregiverJoining(e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor="caregiver" className="text-sm">A caregiver will be joining</label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="email-reminders"
                              checked={emailReminders}
                              onChange={(e) => setEmailReminders(e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor="email-reminders" className="text-sm">Send email reminders</label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="sms-reminders"
                              checked={smsReminders}
                              onChange={(e) => setSmsReminders(e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor="sms-reminders" className="text-sm">Send SMS reminders</label>
                          </div>
                        </div>
                        
                        {/* Book Button */}
                        <button
                          className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center"
                          onClick={handleBookAppointment}
                          disabled={loading}
                        >
                          {loading ? (
                            <RefreshCw className="animate-spin mr-2" size={20} />
                          ) : (
                            <Calendar className="mr-2" size={20} />
                          )}
                          {loading ? 'Booking...' : 'Book Appointment'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Upcoming Appointments Tab */}
          {activeTab === 'upcoming' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
              
              {appointments.filter(app => app.status === 'upcoming').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto mb-2" size={48} />
                  <p>You don't have any upcoming appointments.</p>
                  <button 
                    className="mt-4 text-blue-900 font-medium hover:underline"
                    onClick={() => setActiveTab('book')}
                  >
                    Book an Appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments
                    .filter(app => app.status === 'upcoming')
                    .map(appointment => (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-blue-900">{appointment.doctorName}</h3>
                            <p className="text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
                            <div className="mt-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                appointment.type === 'in-person' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {appointment.type === 'in-person' ? 'In-Person Visit' : appointment.type}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <button 
                              className="border border-blue-900 text-blue-900 px-3 py-1 rounded text-sm hover:bg-blue-50 transition-colors"
                            >
                              Reschedule
                            </button>
                            <button 
                              className="border border-red-500 text-red-500 px-3 py-1 rounded text-sm hover:bg-red-50 transition-colors"
                              onClick={() => handleCancelAppointment(appointment.id)}
                            >
                              Cancel
                            </button>
                            <button 
                              className="border border-gray-500 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-100 transition-colors flex items-center"
                              onClick={() => handleDeleteAppointment(appointment.id)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          
          {/* Past Appointments Tab */}
          {activeTab === 'past' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Appointments</h2>
              
              {appointments.filter(app => app.status === 'completed' || app.status === 'cancelled').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto mb-2" size={48} />
                  <p>You don't have any past appointments.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments
                    .filter(app => app.status === 'completed' || app.status === 'cancelled')
                    .map(appointment => (
                      <div key={appointment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{appointment.doctorName}</h3>
                            <p className="text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
                            <div className="mt-2 flex space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {appointment.status === 'completed' ? 'Completed' : 'Cancelled'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                appointment.type === 'in-person' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {appointment.type === 'in-person' ? 'In-Person Visit' : appointment.type}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <button 
                              className="border border-gray-500 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-100 transition-colors flex items-center"
                              onClick={() => handleDeleteAppointment(appointment.id)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;