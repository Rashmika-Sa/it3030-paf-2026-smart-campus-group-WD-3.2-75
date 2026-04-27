import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import StudentDashboard from './pages/StudentDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ResourcePage from './pages/ResourcePage';
import AdminDashboard from './pages/AdminDashboard';


// Components
import Auth from './components/auth/Auth';
import ProtectedRoute from './components/ProtectedRoute';

const GOOGLE_CLIENT_ID = "309149820060-r2lcnmk9mumau7779v4ani3i6369ta33.apps.googleusercontent.com";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/auth" element={<Auth />} />

          {/* Standard User Routes (Role: USER) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <ResourcePage />
              </ProtectedRoute>
            }
          />

          {/* Technician Route */}
          <Route
            path="/technician-dashboard"
            element={
              <ProtectedRoute allowedRoles={['TECHNICIAN', 'ADMIN']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}