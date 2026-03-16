import React, { useEffect, useState } from 'react';
import { IoIosMenu } from 'react-icons/io';
import SidePanel from '../../components/SidePanel';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Tree from 'react-d3-tree';
import "../../styles/MindMap.css";
import LoadingSpinner from '../../components/LoadingSpinner';
import { MdOutlineFileDownload } from "react-icons/md";

function MindMap() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { documentId } = useParams();
    const { user } = useAuth();
    const [mindMapData, setMindMapData] = useState(null);
    const navigate = useNavigate();

    const handleSave = async () => {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`http://127.0.0.1:8000/documents/${documentId}/mindmap`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mindMapData)
            });
            if (!response.ok) {
                throw new Error("Failed to save mindmap");
            }
            const result = await response.json();
            console.log('Mindmap saved successfully:', result);
            navigate(`/documents`);
        } catch (err) {
            console.error("Error saving mindmap:", err);
        }
    };

    useEffect(() => {
        const fetchMindMapData = async () => {
            const token = await user.getIdToken();
            const response = await fetch(`http://127.0.0.1:8000/documents/${documentId}/mindmap`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setMindMapData(data.mindmap);
            setIsLoading(false);
            console.log(data);
        };

        fetchMindMapData();
    }, [documentId, user]);

    return (
        <div className='minmap-container'>
            <div className="header">
                <h1><a href="/"><span className='highlight'>StudyWeave</span> - Mindmap</a></h1>
                <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            </div>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                mindMapData ? (
                    <div className="wrapper">
                        <div className="button-container">
                            <button className="save-button" onClick={handleSave}>Save</button>
                            <button className="save-button" onClick={() => navigate('/documents')}>Discard</button>
                        </div>
                        <div className="mindmap-wrapper">
                            <Tree 
                                data={mindMapData} 
                                orientation="vertical" 
                                nodeSize={{ x: 250, y: 50 }}
                                separation={{ siblings: 1, nonSiblings: 1.5 }}
                                zoom={0.5}
                                pathFunc="step"
                                enableLegacyTransitions={true}
                                transitionDuration={500}
                            />
                        </div>
                    </div>
                ) : (
                    <p>No Mindmap to display at the moment. Try to refresh!</p>
                )
            )}
            
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}
export default MindMap;