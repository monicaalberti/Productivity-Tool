import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { IoMdClose } from "react-icons/io";
import "../styles/Document.css";
       

function Document() {
    const { documentId } = useParams();
    const { user } = useAuth();
    const [content, setContent] = useState();

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
        <div className="pdf-viewer">
            <IoMdClose className="pdf-close-button" size={40} title="Close PDF Viewer" onClick={() => window.history.back()} />
            <iframe
                src={content}
                width="100%"
                height="685"
                className="pdf-iframe"
            />
        </div>
    );
}
export default Document;