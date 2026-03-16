import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SidePanel from "../components/SidePanel";
import LoadingSpinner from "../components/LoadingSpinner";
import { GrNext } from "react-icons/gr";
import { IoIosMenu } from "react-icons/io";
import { useAuth } from '../AuthContext';
import "../styles/ExercisesPage.css";


function ExercisesPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [exercises, setExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAnswer, setUserAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { user } = useAuth();

    const taskId = useParams().taskId;

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const token = await user.getIdToken();
                const response = await fetch(`http://127.0.0.1:8000/tasks/${taskId}/exercises`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                setExercises(result.exercises);
            } catch (err) {
                console.error("Error fetching exercises:", err);
                setError("Failed to fetch exercises");
            } finally {
                setIsLoading(false);
            }
        };
        fetchExercises();
    }, [taskId]);

    const currentExercise = exercises[currentIndex];

    const handleSubmit = () => {
        if (!userAnswer.trim()) return;
        setSubmitted(true);
    };

    const handleNext = () => {
        setUserAnswer("");
        setSubmitted(false);
        setCurrentIndex((prev) => prev + 1);
    };

    const isLastExercise = currentIndex === exercises.length - 1;

    return (
        <div>
            <div className="header">
                <h1><a href="/"><span className="highlight">StudyWeave</span> - Exercises</a></h1>
                <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
            </div>
            <div className="exercise-page-bg-img"></div>

            {isLoading ? (
                <LoadingSpinner />
            ) : !currentExercise ? (
                <p>No exercises found.</p>
            ) : (
                <div className="exercise-container">
                    <p>{currentIndex + 1} / {exercises.length}</p>
                    <div className="exercise-form">
                        <h4>{currentExercise.question}</h4>
                        <textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            disabled={submitted}
                        />
                        {!submitted ? (
                            <button onClick={handleSubmit} disabled={!userAnswer.trim()}>
                                Submit Answer
                            </button>
                        ) : (
                            <div className="solution">
                                <strong>Solution:</strong>
                                <p>{currentExercise.solution}</p>
                            </div>
                        )}
                        {(isLastExercise && submitted) && (
                            <>
                                <p>🎉 You've completed all exercises!<br />
                                    Is your knowledge on this topic as good as you believed? If not, move the task back to REVISING!
                                </p>
                                <Link to={`/documents`} className="view-link">Leave Page</Link>
                            </>
                        )}
                    </div>
                  
                    <GrNext size={45} onClick={handleNext} style={{opacity: isLastExercise ? 0.3 : 1,}} className="thank-you-next"/>  
                    
                </div>
            )}

            <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}

export default ExercisesPage;