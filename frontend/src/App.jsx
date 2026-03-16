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
import Documents from "./pages/Documents";
import { AuthProvider } from "./AuthContext";
import Document from "./pages/Document";
import DocumentDashboard from "./pages/DocumentDashboard";
import SummarizePage from "./pages/summaries/SummarizePage";
import SummaryViewer from "./pages/summaries/SummaryViewer"
import TopicDashboard from "./pages/TopicDashboard"
import TopicSummarizePage from "./pages/summaries/TopicSummarizePage"
import TopicSummaryViewer from "./pages/summaries/TopicSummaryViewer"
import JournalPage from "./pages/journal/JournalPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MindMap from "./pages/mindmap/MindMap";
import MindMapViewer from "./pages/mindmap/MindMapViewer";
import KanbanPage from "./pages/kanban-pages/KanbanPage";
import DocumentKanban from "./pages/kanban-pages/DocumentKanban";
import TopicKanban from "./pages/kanban-pages/TopicKanban";
import TopicMindMap from "./pages/mindmap/TopicMindMap";
import TopicMindMapViewer from "./pages/mindmap/TopicMindMapViewer";
import ExercisesPage from "./pages/ExercisesPage"; 

function App() {
  return (
    <MantineProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
            <Route path="/documents/:documentId/mindmap" element={<ProtectedRoute><MindMap /></ProtectedRoute>} />
            <Route path="/documents/:documentId/mindmap/view" element={<ProtectedRoute><MindMapViewer /></ProtectedRoute>} />
            <Route path="/topics/:topicId/mindmap" element={<ProtectedRoute><TopicMindMap /></ProtectedRoute>} />
            <Route path="/topics/:topicId/mindmap/view" element={<ProtectedRoute><TopicMindMapViewer /></ProtectedRoute>} />
            <Route path="/documents/:documentId/kanban" element={<ProtectedRoute><DocumentKanban /></ProtectedRoute>} />
            <Route path="/topics/:topicId/kanban" element={<ProtectedRoute><TopicKanban /></ProtectedRoute>} />
            <Route path="/kanban" element={<ProtectedRoute><KanbanPage /></ProtectedRoute>} />
            <Route path="/tasks/:taskId/exercises" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </Router>
    </MantineProvider>
    
  );
}

export default App;
