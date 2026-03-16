import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import '../styles/AnalyticsPage.css'
import SidePanel from "../components/SidePanel";
import { IoIosMenu } from "react-icons/io";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, ResponsiveContainer, Pie, Cell, Legend } from "recharts";
import { Link } from 'react-router-dom';

function AnalyticsPage() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [sentimentTrends, setSentimentTrends] = useState([]);
    const [taskAnalytics, setTaskAnalytics] = useState([]);
    const STATUS_COLORS = {
        "BACKLOG":     "#a0aec0",
        "IN PROGRESS": "#6c63ff",
        "REVISING":    "#f6ad55",
        "DONE":        "#68d391",
    };

    useEffect(() => {
        const fetchSentimentTrends = async () => {
            const token = await user.getIdToken();
            try {
                const response = await fetch('http://127.0.0.1:8000/sentiment/analytics', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                console.log("Analytics data:", data);
                setSentimentTrends(data);
            } catch (e) {
                console.error("Error fetching analytics:", e);
            }
        };
        fetchSentimentTrends();
        const fetchTaskAnalytics = async () => {
            const token = await user.getIdToken();
            try {
                const response = await fetch('http://127.0.0.1:8000/tasks/analytics', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setTaskAnalytics(data.status_breakdown);
            } catch (e) {
                console.error("Error fetching analytics:", e);
            }
        };
        fetchTaskAnalytics();
    }, []);
    console.log(taskAnalytics);

    return (
        <div className="analytics-container">
            <div className="header">
                <h1><a href="/"><span className='highlight'>StudyWeave</span> - My Analytics</a></h1>
                <IoIosMenu className="menu-icon" size={40} onClick={() => setIsOpen(true)} />
            </div>
            <div className="trends-container-bg"></div>
            <div className="trends-container">
                <div className="progress-analytics">
                    <h3>Task Status</h3>
                    <p>Here is the snapshot of the status of your currect tasks.</p>
                    {taskAnalytics.length === 0 ? (
                        <p className="no-data">No tasks yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={taskAnalytics} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                                    {taskAnalytics.map((entry) => (
                                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#cbd5e0"} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}

                </div>
                <div className="sentiment-analytics">
                    <h3>Sentiment Trends Over Time</h3>
                    <p className="intro">These are your sentiment trends overtime, taken from your journal entries.<br/>
                    If you see a downward trend, make sure to take care of your wellbeing. Take regular breaks from studying, 
                    exercise regularly, and if the stress feels like too much, consider talking to friends, 
                    family or the university's student support services.</p>
                    {sentimentTrends.length > 0 ? (
                        <LineChart className="sentiment-chart" width={650} height={400} data={sentimentTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[-1, 1]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="sentiment_polarity" stroke="#8884d8" />
                        </LineChart>
                        
                    ) : (
                        <p>It looks like you have no entries on your journal yet.<br/> 
                        Start journalling today!</p>
                    )}
                    <Link className="journal-link" to="/journal">Go to Journal</Link>
                    
                </div>`
            </div>
            
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}
export default AnalyticsPage;