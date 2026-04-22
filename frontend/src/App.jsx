import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import LandingPage from './pages/LandingPage'; 
import Auth from './components/auth/Auth';

export default function App() {
  
  const GOOGLE_CLIENT_ID = "309149820060-r2lcnmk9mumau7779v4ani3i6369ta33.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}