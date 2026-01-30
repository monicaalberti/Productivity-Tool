import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './styles/App.css';
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import DocumentUpload from "./pages/DocumentUpload";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyAccount from "./pages/auth/VerifyAccount";
import Documents from "./pages/Documents";
import { AuthProvider } from "./AuthContext";
import Document from "./pages/Document";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* MAIN PAGE (first page user sees) */}
          <Route path="/" element={<Dashboard />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyAccount />} />
          <Route path="/upload" element={<ProtectedRoute><DocumentUpload /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/documents/:documentId" element={<ProtectedRoute><Document /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
