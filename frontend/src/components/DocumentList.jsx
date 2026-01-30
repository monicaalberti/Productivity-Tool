import React, { useState, useEffect } from 'react';
import '../styles/DocumentList.css';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

function DocumentList() {
    const [documents, setDocuments] = useState([]);  
    const { user } = useAuth(); 
    
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

    useEffect(() => {
        fetchDocuments();
    }, []); 

    console.log("Documents:", documents);

    return (
        <div className="document-list">
        <h2>Your Uploaded Documents</h2>
        <div className="docs-list">
            {documents.length === 0 ? (
                <p>No documents uploaded yet.</p>
            ): (
                documents.map((doc) => (
                    <div className="doc-item" key={doc.id}> 
                        <h2 className="document-name">{doc.title}</h2>
                        <p>Upload date: {new Date(doc.upload_date).toLocaleDateString()}</p>
                        <Link to={`/documents/${doc.id}`} className="view-link">Open Document</Link>
                    </div>
                ))
            )}
            
        </div>   
        </div>
    );
    }   

export default DocumentList;