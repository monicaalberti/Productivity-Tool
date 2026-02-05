import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import SidePanel from '../components/SidePanel';
import "../styles/DocumentDashboard.css";
import { IoIosMenu } from "react-icons/io";


function DocumentDashboard() {
    const { documentId } = useParams();
    const { user } = useAuth();
    const [content, setContent] = useState();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const documentTitle = (location?.state?.documentTitle || "Document Details").split('.pdf')[0];
    const documentSummary = location?.state?.documentSummary;

    async function fetchContent(documentId) {
    const token = await user.getIdToken();
    const response = await fetch(`http://127.0.0.1:8000/documents/${documentId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) {
        console.error("Failed to fetch document:", response.statusText);
        return;
    }

    const blob = await response.blob();      
    const url = URL.createObjectURL(blob); 
    setContent(url);
}

    useEffect(() => {
        fetchContent(documentId);
    }, [documentId]);
    
    return (
        <div>
            <h1><a href="/">StudyWeave - {documentTitle}</a></h1>
            <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            <div className="dashboard-grid">
                <div className="dashboard-item">
                    <h2>PDF Viewer</h2>
                    <p>View the uploaded document here.</p>
                    <Link to={`/documents/${documentId}`} className="view-link">View PDF</Link>
                </div>
                {documentSummary ? (
                    <div className="dashboard-item">
                        <h2>Summary Viewer</h2>
                        <p>You already saved a summary for this document. View it here!</p>
                        <Link to={`/documents/${documentId}/summary/view`} state={{documentTitle: documentTitle, documentSummary: documentSummary}}>View Summary</Link>
                    </div>
                ) : (
                    <div className="dashboard-item">
                        <h2>Summary Generator</h2>
                        <p>This document doesn't have a generated summary yet. Generate one now!</p>
                        <Link to={`/documents/${documentId}/summary`} state={{ documentTitle: documentTitle }} className="view-link">Generate Summary</Link>
                    </div>
                )}
                
            
            </div>
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>

    );
}
export default DocumentDashboard;