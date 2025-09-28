import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./Components/Navbar";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import { PublicRoute, ProtectedRoute } from './Components/RouteGuards';

function App() {
  // Get Google Client ID from environment variable
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <div className="flex flex-col h-screen">
                  <Navbar />
                </div>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
