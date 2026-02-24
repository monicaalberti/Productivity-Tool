import React, { useState, useEffect } from 'react';
import '../styles/DocumentList.css';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import SidePanel from './SidePanel';
import { TiDeleteOutline } from "react-icons/ti";

function DocumentList({ topicView }) {
    const [documents, setDocuments] = useState([]); 
    const [topics, setTopics] = useState([]); 
    const { user } = useAuth(); 
    const [isOpen, setIsOpen] = useState(false);
    
    // Fetch all documents
    async function fetchDocuments() {  
        const token = await user.getIdToken();     
        fetch("http://127.0.0.1:8000/documents", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => setDocuments(data))
        .catch(error => console.error("Error fetching documents:", error));
    }

    async function fetchTopics() {
        const token = await user.getIdToken();
        fetch("http://127.0.0.1:8000/topics", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(t => setTopics(t))
        .catch(error => console.error("Error fetching topics:", error));
    }

    async function deleteDoc(docId) {
        const isConfirmed = confirm("Are you sure you want to delete this document?")
        if (isConfirmed) {
            try {
                const token = await user.getIdToken();
                const response = await fetch(`http://127.0.0.1:8000/documents/${docId}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error("Failed to delete document");
                }
                setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
                fetchTopics();
            } catch (error) {
                console.error("Error deleting document:", error);
            }
        }
    }

    useEffect(() => {
        fetchDocuments();
        fetchTopics();
    }, []); 

    return (
        <div className="document-list">
            {topicView ? (
                <div className="docs-list">
                    {topics.length === 0 ? (
                        <p>No topics to group yet. Try to refresh.</p>
                    ) : (
                        topics.map((topic) => (
                            topic.documents.length >= 1 && (
                                <div className="topic-item" key={topic.id}> 
                                <h2 className="topic-name">{topic.name}</h2>
                                <ul>
                                {topic.documents.map((doc) => (
                                    <li key={doc.id}><Link to={`/documents/${doc.id}`} className="view-link">{doc.title}</Link></li>
                                ))}
                                </ul>
                                <Link 
                                    to={`/topics/${topic.id}/dashboard`} 
                                    state={{topicId: topic.id, topicLabel: topic.name, documents: topic.documents, topicSummary: topic.summary}} 
                                    className="view-link"
                                >
                                    View More
                                </Link>
                            </div>
                            ) 
                        ))
                    )}
                </div>
            ) : (
                <div className="docs-list">
                    {documents.length === 0 ? (
                        <p>No documents uploaded yet.</p>
                    ) : (
                        documents.map((doc) => (
                            <div className="doc-item" key={doc.id}> 
                                <h2 className="document-name">{doc.title}</h2>
                                <TiDeleteOutline 
                                    className="delete-icon" 
                                    title="Delete"
                                    size={25}
                                    onClick={() => deleteDoc(doc.id)} 
                                />
                                <p>Upload date: {new Date(doc.upload_date).toLocaleDateString()}</p>
                                <Link to={`/documents/${doc.id}`} className="view-link">Open PDF</Link><br/>
                                <Link 
                                    to={`/documents/${doc.id}/dashboard`} 
                                    state={{documentTitle: doc.title, documentSummary: doc.summary}} 
                                    className="view-link"
                                >
                                    View More
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            )}
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}   

export default DocumentList;
