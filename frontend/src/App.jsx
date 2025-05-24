import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from './contexts/SocketContext';
import { Navbar } from "./Components/Navbar";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import ChatPage from "./pages/ChatPage";
import { PublicRoute, ProtectedRoute } from './Components/RouteGuards';

function App() {
  // Get Google Client ID from environment variable
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <SocketProvider>
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
              <Route path="/chat/:chatId" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
