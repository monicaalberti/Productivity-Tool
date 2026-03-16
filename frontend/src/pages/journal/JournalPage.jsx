import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JournalEditor from '../../components/JournalEditor';
import { useAuth } from '../../AuthContext';
import '../../styles/JournalPage.css'
import { IoIosAdd } from "react-icons/io";
import EntryPage from "./EntryPage";
import SidePanel from "../../components/SidePanel";
import { IoIosMenu } from "react-icons/io";

function JournalPage() {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [entries, setEntries] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const getPreview = (htmlContent, maxLength = 60) => {
        if (!htmlContent) return "";
        // Remove HTML tags
        const text = htmlContent.replace(/<[^>]+>/g, "");
        // Trim and shorten
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    };



    const handleSave = async () => {
        const token = await user.getIdToken();
            try {
                const response = await fetch('http://127.0.0.1:8000/journal/entries', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ content: content })
                });
                const data = await response.json();
                setContent(data);
                setEntries(prev => [data, ...prev]);
            } catch (e) {
                console.error("Error saving entry:", e);

            }
    }

    useEffect(() => {
        const getEntries = async () => {
            const token = await user.getIdToken();
            try {
                const response = await fetch('http://127.0.0.1:8000/journal/entries', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setEntries(data.entries);
            } catch (e) {
                console.error("Error fetching entries:", e);
            }
        }
        if (user) getEntries();
    }, [user])

    return (
        <div className="journal-container">
            <div className="journal-bg"></div>
            
            <div className="past-entries">
                <h3>Your Past Entries</h3>
                <div className="entry-box" id="new-entry" title="New entry" onClick={() => setSelectedEntry("New")}>
                    <IoIosAdd size={60} className="new-icon" />
                </div>
                {entries.length===0 ? (
                    <p>This is your first entry!</p>
                ) : (
                    entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((entry) => (
                        <div className="entry-box" key={entry.id} onClick={() => setSelectedEntry(entry)}>
                            <h4>{formatDate(entry.created_at)}</h4>
                            <p>{getPreview(entry.content)}</p>
                        </div>
                    ))
                )}
            </div>
            <div className="entry-editor">
                <div className="header">
                    <h1><a href="/"><span className="highlight">StudyWeave</span> - My Journal</a></h1>
                    <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
                </div>
                <div className="edit-space">
                    {selectedEntry && selectedEntry != "New" ? (
                        <EntryPage entry={selectedEntry} />
                    ) : (
                        <>
                            <JournalEditor content={content} setContent={setContent} />
                            <div className="buttons">
                                <button onClick={() => handleSave()}>Save</button>
                                <button onClick={() => navigate('/journal')}>Discard</button>
                            </div>
                        </>
                    )}
                </div>
                
            </div>
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
        
    )

}
export default JournalPage;