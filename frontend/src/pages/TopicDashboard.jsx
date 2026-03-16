import React, { useState } from "react";
import { IoIosMenu } from "react-icons/io";
import { useLocation, Link, useParams } from "react-router-dom"
import SidePanel from "../components/SidePanel";
import "../styles/TopicDashboard.css"
import { LuLayoutDashboard } from "react-icons/lu";
import { FaRegFilePdf } from "react-icons/fa";
import { FaSitemap } from "react-icons/fa";
import { CiTextAlignLeft } from "react-icons/ci";

function TopicDashboard() {
    const location = useLocation();
    const topicId = useParams().topicId;
    const topicName = location?.state?.topicLabel;
    const docs = location?.state?.documents;
    const summary = location?.state?.topicSummary;
    const mindmap = location?.state?.topicMindmap;
    
    const [isOpen, setIsOpen] = useState(false);

    const formatTitle = (title) => {
        return title.replace(/_/g, ' ').replace(/-/g, ' ').replace('.pdf', '');
    };

    return (
        <div>
            <div className="header">
                <h1><a href="/"><span className="highlight">StudyWeave</span> - Topic: {topicName}</a></h1>
                <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            </div>
            <div className="topics-dashboard-background"></div>
            <div className="topics-container">
                {docs.length === 0 ? (
                    <p>No documents in this topic so far.</p>
                ): (
                    docs.map((doc) => (
                        <div className="doc" key={doc.id}>
                            <div className="background">
                                <h2>{formatTitle(doc.title)}</h2>
                                <Link to={`/documents/${doc.id}/dashboard`} className="view-link">Go to Dashboard <LuLayoutDashboard size={20} /></Link>
                                <div className="dashboard-box">
                                    <h3>PDF Viewer</h3>
                                    <p>Open PDF view of the document!</p>
                                    <div className="button-wrapper">
                                        <Link to={`/documents/${doc.id}`} className="view-link">View PDF <FaRegFilePdf size={20} /></Link>
                                    </div>
                                </div>
                                {doc.summary ? (
                                    <div className="dashboard-box">
                                        <h3>Summary Viewer</h3>
                                        <p>View your summary here or generate a new one!</p>
                                        <div className="button-wrapper">
                                            <Link className="view-link" to={`/documents/${doc.id}/summary/view`} state={{documentTitle: doc.title, documentSummary: doc.summary}}>View Summary <CiTextAlignLeft size={20} /></Link><br/>
                                            <Link className="view-link" to={`/documents/${doc.id}/summary`} state={{documentTitle: doc.title}}>Generate a New Summary <CiTextAlignLeft size={20} /></Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="dashboard-box">
                                        <h3>Summary Generator</h3>
                                        <p>Generate a summary for this document!</p>
                                        <Link className="view-link" to={`/documents/${doc.id}/summary`} state={{ documentTitle: doc.title }}>Generate Summary <CiTextAlignLeft size={20} /></Link>
                                    </div>
                                )}
                                {doc.mindmap ? (
                                    <div className="topic-dashboard-box">
                                        <h3>Mindmap Viewer</h3>
                                        <p>View your mindmap here or generate a new one!</p>
                                        <div className="button-wrapper">
                                            <Link className="view-link" to={`/documents/${doc.id}/mindmap/view`} state={{documentTitle: doc.title, documentMindmap: doc.mindmap}}>View Mindmap <FaSitemap size={20} /></Link><br/>
                                            <Link className="view-link" to={`/documents/${doc.id}/mindmap`} state={{documentTitle: doc.title}}>Generate a New Mindmap <FaSitemap size={20} /></Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="topic-dashboard-box">
                                        <h3>Mindmap Generator</h3>
                                        <p>Generate a mindmap for this document!</p>
                                        <div className="button-wrapper">
                                            <Link to={`/documents/${doc.id}/mindmap`} state={{ documentTitle: doc.title }} className="view-link">Generate Mindmap <FaSitemap size={20} /></Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        ))
                        )}
            </div>
            <div className="topic-services-container">
                <h2>Topic-wide Services:</h2>
                <div className="topic-services">
                    {docs.length > 1 && (
                        summary ? (
                            <div className="topic-dashboard-item">
                                <h2>Collective Summary Viewer</h2>
                                <p>You already have a summary for this topic. View it here or generate a new one!</p>
                                <div className="button-wrapper">
                                    <Link className="view-link" to={`/topics/${topicId}/summary/view`} state={{"topicName": topicName, "topicSummary": summary}}>View Summary <CiTextAlignLeft size={20} /></Link><br/>
                                    <Link className="view-link" to={`/topics/${topicId}/summary`} state={{"topicName": topicName }}>Generate new Summary <CiTextAlignLeft size={20} /></Link>
                                </div>
                            </div>
                        ) : (
                            <div className="topic-dashboard-item">
                                <h2>Collective Summary Generator</h2>
                                <p>Generate a colelctive summary for all the documents in this topic.</p>
                                <div className="button-wrapper">
                                    <Link className="view-link" to={`/topics/${topicId}/summary`} state={{"topicName": topicName }}>Generate Summary <CiTextAlignLeft size={20} /></Link>
                                </div>
                            </div>
                        )
                        
                    )}
                    {docs.length === 1 && (
                        <div className="topic-dashboard-item">
                            <h2>Collective Summary</h2>
                            <p>You currently have only one document belonging to this topic. When you upload more, you'll have the chance to generate a collective summary for this topic.</p>
                        </div>
                    )}

                    {mindmap ? (
                        <div className="topic-dashboard-item">
                            <h2>Mindmap Viewer</h2>
                            <p>You already have a generated mindmap for this topic. View it here or generate a new one!</p>
                            <Link className="view-link" to={`/topics/${topicId}/mindmap/view`} state={{"topicName": topicName, "topicMindmap": mindmap}}>View Mindmap</Link><br/>
                            <Link className="view-link" to={`/topics/${topicId}/mindmap`} state={{"topicName": topicName }}>Generate new Mindmap</Link>
                        </div>
                    ) : (
                        <div className="topic-dashboard-item">
                            <h2>Mindmap Generator</h2>
                            <p>Generate a mindmap for this topic.</p>
                            <Link className="view-link" to={`/topics/${topicId}/mindmap`} state={{"topicName": topicName }}>Generate Mindmap</Link>
                        </div>
                    )}
                    <div className="topic-dashboard-item">
                        <h2>Kanban Board</h2>
                        <p>View the Kanban board for this topic, pre-populated with system-generated 
                            tasks that you can customize and move around as you progress through them.<br/>
                            If this is your first time opening this page, it might take a few minutes for the tasks to get generated!</p>
                            <Link className="view-link" to={`/topics/${topicId}/kanban`} state={{"topicName": topicName}}>View Kanban Board</Link>
                    </div>
            </div>
            
            
            </div>
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
    }   
export default TopicDashboard;