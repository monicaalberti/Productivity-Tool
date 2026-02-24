import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import '@mantine/core/styles.css';
import './styles/App.css';
import { MantineProvider } from '@mantine/core';
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import DocumentUpload from "./pages/DocumentUpload";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyAccount from "./pages/auth/VerifyAccount";
import Documents from "./pages/Documents";
import { AuthProvider } from "./AuthContext";
import Document from "./pages/Document";
import DocumentDashboard from "./pages/DocumentDashboard";
import SummarizePage from "./pages/SummarizePage";
import SummaryViewer from "./pages/SummaryViewer"
import TopicDashboard from "./pages/TopicDashboard"
import TopicSummarizePage from "./pages/TopicSummarizePage"
import TopicSummaryViewer from "./pages/TopicSummaryViewer"
import JournalPage from "./pages/JournalPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function App() {
  return (
    <MantineProvider>
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
            <Route path="/documents/:documentId/dashboard" element={<ProtectedRoute><DocumentDashboard /></ProtectedRoute>} />
            <Route path="/topics/:topicId/dashboard" element={<ProtectedRoute><TopicDashboard /></ProtectedRoute>} />
            <Route path="/documents/:documentId" element={<ProtectedRoute><Document /></ProtectedRoute>} />
            <Route path="/documents/:documentId/summary" element={<ProtectedRoute><SummarizePage /></ProtectedRoute>} />
            <Route path="/topics/:topicId/summary" element={<ProtectedRoute><TopicSummarizePage /></ProtectedRoute>} />
            <Route path="/documents/:documentId/summary/view" element={<ProtectedRoute><SummaryViewer /></ProtectedRoute>} />
            <Route path="/topics/:topicId/summary/view" element={<ProtectedRoute><TopicSummaryViewer /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </Router>
    </MantineProvider>
    
  );
}

export default App;
