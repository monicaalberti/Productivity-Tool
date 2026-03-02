import React, { useEffect, useState } from 'react';
import { IoIosMenu } from 'react-icons/io';
import SidePanel from '../components/SidePanel';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Tree from 'react-d3-tree';
import "../styles/MindMap.css";

function MindMap() {
    const [isOpen, setIsOpen] = useState(false);
    const { documentId } = useParams();
    const { user } = useAuth();
    const [mindMapData, setMindMapData] = useState(null);

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
            console.log(data);
        };

        fetchMindMapData();
    }, [documentId, user]);

    const transformMindmap = (data) => {
    return {
        name: data.title || "Untitled",
        children: (data.topic_map || []).map(topicItem => ({
        name: topicItem.topic || "No topic",
        children: (topicItem.subtopics || []).map(sub => ({
            name: sub
        }))
        }))
    };
    };
    console.log("mindMapData", mindMapData);

    return (
        <div className='minmap-container'>
            <h1><a href="/">StudyWeave - Mindmap</a></h1>
            <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            {mindMapData ? (
                <div className="mindmap-wrapper">
                    <Tree 
                        data={mindMapData} 
                        orientation="vertical" 
                        nodeSize={{ x: 250, y: 50 }} // Tighten the vertical gap (y)
                        separation={{ siblings: 1, nonSiblings: 1.5 }} // Bring brothers/sisters closer
                        zoom={0.5} // Start zoomed out so you see the complexity
                        pathFunc="step" // Use the "circuit board" look for better organization
                        enableLegacyTransitions={true}
                        transitionDuration={500}
                    />
                </div>
            ) : (
                <p>Loading mindmap...</p>
            )}
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}
export default MindMap;