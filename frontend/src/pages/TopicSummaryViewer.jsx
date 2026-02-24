import React, { useState } from 'react'
import { useLocation } from "react-router-dom"
import SidePanel from '../components/SidePanel';
import { IoIosMenu } from "react-icons/io";
import "../styles/SummaryViewer.css"

function TopicSummaryViewer() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const summary = location?.state?.topicSummary;
    const title = location?.state?.topicName;

    return (
        <div>
            <h1>StudyWeave - {title}</h1>
            <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            <p>{summary}</p>
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>


    )

}
export default TopicSummaryViewer;