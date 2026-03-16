import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import SidePanel from '../components/SidePanel';
import "../styles/DocumentDashboard.css";
import { IoIosMenu } from "react-icons/io";
import { FaRegFilePdf } from "react-icons/fa";
import { FaSitemap } from "react-icons/fa";
import { CiTextAlignLeft } from "react-icons/ci";
import { BsKanban } from "react-icons/bs";


function DocumentDashboard() {
    const { documentId } = useParams();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const documentTitle = (location?.state?.documentTitle || "Document Details");
    const documentSummary = location?.state?.documentSummary;
    const documentMindmap = location?.state?.documentMindmap;

    const formatTitle = (title) => {
        return title.replace(/_/g, ' ').replace(/-/g, ' ').replace('.pdf', '');
    };        
    
    return (
        <div>
            <div className="header">
                <h1><a href="/"><span className="highlight">StudyWeave</span> - {formatTitle(documentTitle)}</a></h1>
                <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            </div>
            <div className="document-dashboard-background"></div>
            <div className="document-dashboard-grid">
                <div className="dashboard-item">
                    <h2>PDF Viewer</h2>
                    <p>View the uploaded document here.</p>
                    <div className="button-wrapper">
                        <Link to={`/documents/${documentId}`} className="view-button">View PDF <FaRegFilePdf size={20}/></Link>
                    </div>
                </div>
                {documentSummary ? (
                    <div className="dashboard-item">
                        <h2>Summary Viewer</h2>
                        <p>You already saved a summary for this document. View it here or generate a new one.</p>
                        <div className="button-wrapper">
                            <Link to={`/documents/${documentId}/summary/view`} className="view-button" state={{documentTitle: formatTitle(documentTitle), documentSummary: documentSummary}}>View Summary <CiTextAlignLeft size={20}/></Link><br/>
                            <Link to={`/documents/${documentId}/summary`} className="view-button" state={{documentTitle: formatTitle(documentTitle)}}>Generate a New Summary <CiTextAlignLeft size={20}/></Link>
                        </div>
                    </div>
                ) : (
                    <div className="dashboard-item">
                        <h2>Summary Generator</h2>
                        <p>This document doesn't have a generated summary yet. Generate one now!</p>
                        <div className="button-wrapper">
                            <Link to={`/documents/${documentId}/summary`} className="view-button" state={{ documentTitle: formatTitle(documentTitle) }}>Generate Summary <CiTextAlignLeft size={20}/></Link>
                        </div>
                    </div>
                )}

                {documentMindmap ? (
                    <div className="dashboard-item">
                        <h2>Mindmap Viewer</h2>
                        <p>You already saved a mindmap for this document. View it here or generate a new one.</p>
                        <div className="button-wrapper">
                            <Link to={`/documents/${documentId}/mindmap/view`} className="view-button" state={{documentTitle: formatTitle(documentTitle), documentMindmap: documentMindmap}}>View Mindmap <FaSitemap size={20}/></Link><br/>
                            <Link to={`/documents/${documentId}/mindmap`} className="view-button" state={{documentTitle: formatTitle(documentTitle)}}>Generate a New Mindmap <FaSitemap size={20}/></Link>
                        </div>
                    </div>

                ) : (
                    <div className="dashboard-item">
                        <h2>Mindmap</h2>
                        <p>Visualize the structure of the document with a mindmap.</p>
                        <div className="button-wrapper">
                            <Link to={`/documents/${documentId}/mindmap`} className="view-button" state={{ documentTitle: formatTitle(documentTitle) }}>Generate Mindmap <FaSitemap size={20}/></Link>
                        </div>
                    </div>

                )}

                <div className="dashboard-item">
                    <h2>Kanban Board</h2>
                    <p>Track your progress on a Kanban board using system-generated actionable tasks!</p>
                    <div className="button-wrapper">
                        <Link to={`/documents/${documentId}/kanban`} className="view-button" state={{ documentTitle: formatTitle(documentTitle)}}>View Kanban Board <BsKanban size={20}/></Link>
                    </div>
                </div>

            
            </div>
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>

    );
}
export default DocumentDashboard;