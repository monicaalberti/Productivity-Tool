import React, { useState } from 'react';
import { IoIosMenu } from 'react-icons/io';
import SidePanel from '../../components/SidePanel';
import { useLocation } from 'react-router-dom';
import Tree from 'react-d3-tree';
import "../../styles/MindMap.css";
import { MdOutlineFileDownload } from "react-icons/md";
import { useRef } from 'react';

function MindMapViewer() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const documentMindmap = JSON.parse(location?.state?.documentMindmap);
    const treeContainerRef = useRef(null);

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
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mindmap.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className='minmap-container'>
            <div className="header">
                <h1><a href="/"><span className="highlight">StudyWeave</span> - Mindmap</a></h1>
                <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            </div>
            <div className='map-viewer-bg-img'></div>

            <div className="mindmap-wrapper">
                <div className="map-container-box" ref={treeContainerRef}>
                    <Tree
                        data={documentMindmap}
                        orientation="vertical"
                        nodeSize={{ x: 250, y: 50 }}
                        separation={{ siblings: 1, nonSiblings: 1.5 }}
                        zoom={0.5}
                        pathFunc="step"
                        enableLegacyTransitions={true}
                        transitionDuration={500}
                    />
                </div>
                <MdOutlineFileDownload className="download-icon" size={30} title="Download Mindmap" onClick={handleDownload} />
            </div>

            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}
export default MindMapViewer;