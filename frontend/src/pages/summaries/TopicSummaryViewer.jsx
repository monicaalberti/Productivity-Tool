import React, { useState } from 'react'
import { useLocation } from "react-router-dom"
import SidePanel from '../../components/SidePanel';
import { IoIosMenu } from "react-icons/io";
import "../../styles/SummaryViewer.css"
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../AuthContext';
import { useParams } from 'react-router-dom';
import { MdOutlineFileDownload } from "react-icons/md";

function TopicSummaryViewer() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const summary = location?.state?.topicSummary;
    const title = location?.state?.topicName;
    const { user } = useAuth();
    const { topicId } = useParams();

    const downloadPDF = async () => {
        const token = await user.getIdToken();

        const response = await fetch(
            `http://127.0.0.1:8000/topics/${topicId}/summary/download`,
            {
            headers: {
                Authorization: `Bearer ${token}`
            }
            }
        );

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "summary.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    return (
        <div>
            <div className="header">
                <h1><a href="/"><span className='highlight'>StudyWeave</span> - {title}</a></h1>
                <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            </div>
            <div className='summary-viewer-bg-img'></div>
            <div className="summary-download">
                <div className="summary-container">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
                <MdOutlineFileDownload className="download-icon" size={40} title="Download Summary" onClick={downloadPDF} />
            </div>
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>


    )

}
export default TopicSummaryViewer;