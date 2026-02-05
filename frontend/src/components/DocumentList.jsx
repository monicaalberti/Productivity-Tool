import React, { useState, useEffect } from 'react';
import '../styles/DocumentList.css';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import SidePanel from './SidePanel';

function DocumentList() {
    const [documents, setDocuments] = useState([]);  
    const { user } = useAuth(); 
    const [isOpen, setIsOpen] = useState(false);
    
    async function fetchDocuments() {  
        const token = await user.getIdToken();     
        console.log("Fetching documents with token:", token);
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

    useEffect(() => {
        fetchDocuments();
    }, []); 

    console.log("Documents:", documents);

    return (
        <div className="document-list">
        <div className="docs-list">
            {documents.length === 0 ? (
                <p>No documents uploaded yet.</p>
            ) : (
                documents.map((doc) => (
                    <div className="doc-item" key={doc.id}> 
                        <h2 className="document-name">{doc.title}</h2>
                        <p>Upload date: {new Date(doc.upload_date).toLocaleDateString()}</p>
                        <Link to={`/documents/${doc.id}`} className="view-link">Open PDF</Link><br/>
                        <Link to={`/documents/${doc.id}/dashboard`} state={{documentTitle: doc.title, documentSummary: doc.summary}} className="view-link">View More</Link>
                    </div>
                ))
            )}
            
        </div>   
        <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
    }   

export default DocumentList;