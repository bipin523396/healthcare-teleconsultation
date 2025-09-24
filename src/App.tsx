import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PatientDashboard from './pages/PatientDashboard';
import FaceScanPage from './pages/FaceScanPage';
import EmergencyPage from './pages/EmergencyPage';
import BillingPage from './pages/BillingPage';
import AppointmentsPage from './pages/AppointmentsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import Layout from './components/Layout';
import AdminDoctorManagementPage from './pages/AdminDoctorManagementPage';
import TelehealthSessionPage from './pages/TelehealthSessionPage';
import DoctorContactPage from './pages/DoctorContactPage';
import HealthMonitoringPage from './pages/HealthMonitoringPage';
import Support from './pages/Support';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/face-scan" element={<Layout><FaceScanPage /></Layout>} />
        <Route path="/patient-dashboard" element={<Layout><PatientDashboard /></Layout>} />
        <Route path="/emergency" element={<Layout><EmergencyPage /></Layout>} />
        <Route path="/billing" element={<Layout><BillingPage /></Layout>} />
        <Route path="/appointments" element={<Layout><AppointmentsPage /></Layout>} />
        <Route path="/records" element={<Layout><MedicalRecordsPage /></Layout>} />
        <Route path="/admin/doctors" element={<Layout><AdminDoctorManagementPage /></Layout>} />
        <Route path="/telehealth/:appointmentId" element={<TelehealthSessionPage />} />
        <Route path="/teleconsult" element={<Layout><TelehealthSessionPage /></Layout>} />
        <Route path="/monitoring" element={<Layout><HealthMonitoringPage /></Layout>} />
        <Route path="/support" element={<Layout><Support /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App