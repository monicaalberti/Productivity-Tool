import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { IoIosMenu } from "react-icons/io";
import SidePanel from '../../components/SidePanel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

function TopicSummarizePage() {
    const { topicId } = useParams();
    const location = useLocation()
    const { user } = useAuth();
    const [collectiveSummary, setCollectiveSummary] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const topicName = location.state?.topicName || "Unknown Topic";

    const handleSave = async () => {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`http://127.0.0.1:8000/topics/${topicId}/summary`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ summary: collectiveSummary })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);  
            }
            const result = await response.json();
            console.log('Summary saved successfully:', result);
            navigate(`/documents`);
        } catch (err) {
            console.error("Error saving summary:", err);
            setError("Failed to save summary");
        }   
        };

    useEffect(() => {
        const generateSummary = async () =>  {
            try {
                const token = await user.getIdToken();

                const response = await fetch(
                    `http://127.0.0.1:8000/topics/${topicId}/summary`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                setCollectiveSummary(result.summary);
            } catch (error) {
                console.error("Error generating summary:", error);
                setError("Failed to generate summary.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            generateSummary();
        }
    }, [topicId, user]);


    return (
        <div className="summarize-page">
            <div className="header">
                <h1><a href="/">StudyWeave - {topicName}</a></h1>
                <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            </div>

            {loading && (
                <LoadingSpinner />
            )}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!loading && !error && (
                <div
                    style={{
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                        padding: "1rem",
                        maxHeight: "400px",
                        overflowY: "auto",
                        backgroundColor: "#f9f9f9",
                    }}
                >
                    <ReactMarkdown>{collectiveSummary || "No summary available."}</ReactMarkdown>
                </div>
            )}

            <button onClick={() => handleSave()} style={{ marginTop: "1rem" }}>
                Save
            </button>
            <button onClick={() => navigate("/documents")} style={{ marginTop: "1rem" }}>
                Discard
            </button>
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}

export default TopicSummarizePage;
