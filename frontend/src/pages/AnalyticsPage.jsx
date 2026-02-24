import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import '../styles/AnalyticsPage.css'
import SidePanel from "../components/SidePanel";
import { IoIosMenu } from "react-icons/io";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Link } from 'react-router-dom';

function AnalyticsPage() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [sentimentTrends, setSentimentTrends] = useState([]);

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
    }, []);

    return (
        <div className="analytics-container">
            <h1>Studyweave - My Analytics</h1>
            <IoIosMenu className="menu-icon" size={30} onClick={() => setIsOpen(true)} />
            <p>Welcome to your analytics dashboard!</p>
            <div className="progress-analytics">

            </div>
            <div className="sentiment-analytics">
                <h3>Sentiment Trends Over Time</h3>
                <p>These are your sentiment trends overtime, taken from your journal entries.<br/>
                If you see a downward trend, make sure to take care of your wellbeing. Take regular breaks from studying, 
                exercise regularly, and if the stress feels like too much, consider talking to friends, 
                family or the university's student support services.</p>
                <LineChart className="sentiment-chart" width={600} height={300} data={sentimentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[-1, 1]} label={{value: "Sentiment Polarity", angle: -90, position: 'insideLeft'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sentiment_polarity" stroke="#8884d8" />
                </LineChart>
                <Link className="redirect-link" to="/journal">Go to Journal</Link>
            </div>
            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}
export default AnalyticsPage;