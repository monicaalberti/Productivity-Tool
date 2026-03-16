import React, { useEffect, useState } from 'react';
import { IoIosMenu } from 'react-icons/io';
import SidePanel from '../../components/SidePanel';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Tree from 'react-d3-tree';
import "../../styles/MindMap.css";
import LoadingSpinner from '../../components/LoadingSpinner';
import { MdOutlineFileDownload } from "react-icons/md";

function TopicMindMap() {
    const [isOpen, setIsOpen] = useState(false);
    const topicId = useParams().topicId;
    const { user } = useAuth();
    const [mindMapData, setMindMapData] = useState(null);
    const navigate = useNavigate();

    const handleSave = async () => {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`http://127.0.0.1:8000/topics/${topicId}/mindmap`, {
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

    const handleDownload = () => {
        const svg = treeContainerRef.current?.querySelector('svg');
        if (!svg) return;

        const bbox = svg.getBBox();
        const padding = 40;

        const cloned = svg.cloneNode(true);

        cloned.setAttribute('width', bbox.width + padding * 2);
        cloned.setAttribute('height', bbox.height + padding * 2);
        cloned.setAttribute(
            'viewBox',
            `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`
        );

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(cloned);

        if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(
                /^<svg/,
                '<svg xmlns="http://www.w3.org/2000/svg"'
            );
        }

        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'mindmap.svg';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const fetchMindMapData = async () => {
            const token = await user.getIdToken();
            const response = await fetch(`http://127.0.0.1:8000/topics/${topicId}/mindmap`, {
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
    }, [topicId, user]);

    return (
        <div className='minmap-container'>
            <h1><a href="/"><span className='highlight'>StudyWeave</span> - Mindmap</a></h1>
            <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            {mindMapData ? (
                <div className="wrapper">
                    <div className="button-container">
                        <button className="save-button" onClick={handleSave}>Save</button>
                        <button className="save-button" onClick={() => navigate('/documents')}>Discard</button>
                        <MdOutlineFileDownload className="download-icon" size={30} title="Download Mindmap" onClick={handleDownload} />
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
                <LoadingSpinner />
            )}
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}
export default TopicMindMap;