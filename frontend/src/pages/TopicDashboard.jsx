import React, { useState } from "react";
import { IoIosMenu } from "react-icons/io";
import { useLocation, Link } from "react-router-dom"
import SidePanel from "../components/SidePanel";
import "../styles/TopicDashboard.css"
import { useAuth } from '../AuthContext';

function TopicDashboard() {
    const location = useLocation();
    const topicId = location?.state?.topicId;
    const topicName = location?.state?.topicLabel;
    const docs = location?.state?.documents;
    const summary = location?.state?.summary;
    
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <h1><a href="/">StudyWeave - Topic: {topicName}</a></h1>
            <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            <div className="topic-list">
                {docs.length === 0 ? (
                    <p>No documents in this topic so far.</p>
                ): (
                    docs.map((doc) => (
                        <div className="doc-item" key={doc.id}>
                            <h2>{doc.title}</h2>
                            <div className="dashboard-item">
                                <h3>PDF Viewer</h3>
                                <p>View the uploaded document here.</p>
                                <Link to={`/documents/${doc.id}`} className="view-link">View PDF</Link>
                            </div>
                            {doc.summary ? (
                                <div className="dashboard-item">
                                    <h3>Summary Viewer</h3>
                                    <p>You already saved a summary for this document. View it here or generate a new one.</p>
                                    <Link to={`/documents/${doc.id}/summary/view`} state={{documentTitle: doc.title, documentSummary: doc.summary}}>View Summary</Link><br/>
                                    <Link to={`/documents/${doc.id}/summary`} state={{documentTitle: doc.title}}>Generate a New Summary</Link>
                                </div>
                            ) : (
                                <div className="dashboard-item">
                                    <h3>Summary Generator</h3>
                                    <p>This document doesn't have a generated summary yet. Generate one now!</p>
                                    <Link to={`/documents/${doc.id}/summary`} state={{ documentTitle: doc.title }} className="view-link">Generate Summary</Link>
                                </div>
                            )}
                        </div>
                        ))
                        )}
            </div>
            {docs.length > 1 && (
                summary ? (
                    <div className="dashboard-item">
                        <h2>Collective Summary Viewer</h2>
                        <p>You already have a summary for this topic. View it here or generate a new one!</p>
                        <Link to={`/topics/${topicId}/summary/view`} state={{"topicSummary": summary}}>View Summary</Link>
                        <Link to={`/topics/${topicId}/summary`} state={{"topicName": topicName }}>Generate new Summary</Link>
                    </div>
                ) : (
                    <div className="dashboard-item">
                        <h2>Collective Summary Generator</h2>
                        <p>Generate a colelctive summary for all the documents in this topic.</p>
                        <Link to={`/topics/${topicId}/summary`} state={{"topicName": topicName }}>Generate Summary</Link>
                    </div>
                )
                
            )}
            {docs.length === 1 && (
                <div className="dashboard-item">
                    <h2>Collective Summary</h2>
                    <p>You currently have only one document belonging to this topic. When you upload more, you'll have the chance to generate a collective summary for this topic.</p>

                </div>
            )}
            
            
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
    }   
export default TopicDashboard;