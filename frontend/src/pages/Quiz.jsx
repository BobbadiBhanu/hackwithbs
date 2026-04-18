import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { database } from '../firebase';
import { ref, get, child, set } from 'firebase/database';

const Quiz = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const config = location.state?.config;

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0); 
    const [correctCount, setCorrectCount] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    
    const [timeLeft, setTimeLeft] = useState(0);
    const [timeSpent, setTimeSpent] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0); 
    const [firebaseError, setFirebaseError] = useState("");
    
    // Gamification states
    const [currentStreak, setCurrentStreak] = useState(0);
    const [lives, setLives] = useState(3);
    const [ghostTime, setGhostTime] = useState(0);

    const hasFetched = useRef(false);

    useEffect(() => {
        if (!config) {
            navigate('/setup');
            return;
        }

        if (hasFetched.current) return;
        hasFetched.current = true;

        if (config.mode === 'Boss') setLives(3);

        const fetchData = async () => {
            try {
                // Fetch AI Quiz
                const res = await api.post('/quiz/generate', config);
                setQuestions(res.data.questions);
                const totalTime = (config.mode === 'Boss' ? 10 : config.length) * 15;
                setTimeLeft(totalTime);
                setQuestionStartTime(totalTime);
                
                // Fetch Ghost if Classic
                if (config.mode === 'Classic' || config.mode === 'Syllabus') {
                    const ghostRes = await api.get(`/quiz/ghost/${config.domain}`);
                    setGhostTime(ghostRes.data.timeTaken || 20);
                }

                setIsLoading(false);
            } catch (err) {
                alert("Failed to build the arena. The AI might be on cooldown.");
                navigate('/setup');
            }
        };

        fetchData();
    }, [config, navigate]);

    // Browser navigation guard (Warn on refresh/close)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isFinished && !isLoading) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isFinished, isLoading]);

    // Fast Time's up & Boss Death watcher
    useEffect(() => {
        if (isLoading || isFinished || questions.length === 0) return;
        
        if (timeLeft <= 0 || (config.mode === 'Boss' && lives <= 0)) {
            const remainingBlanks = Array(Math.max(0, questions.length - userAnswers.length)).fill(null);
            setUserAnswers(prev => [...prev, ...remainingBlanks]);
            finishQuiz(score, timeSpent);
        }
    }, [timeLeft, lives, isLoading, isFinished, questions.length, config]);

    // Dedicated Timer
    useEffect(() => {
        if (isLoading || isFinished || timeLeft <= 0 || (config.mode === 'Boss' && lives <= 0)) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
            setTimeSpent(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isLoading, isFinished, timeLeft, lives, config]);

    const handleAnswer = (optionIndex) => {
        const correct = questions[currentIndex].correctOptionIndex === optionIndex;
        let pointsEarned = 0;
        let newCorrectCount = correctCount;
        let newStreak = currentStreak;
        let newLives = lives;

        const timeTakenForThisQuestion = questionStartTime - timeLeft;
        const maxTimePerQ = 15;

        if (correct) {
            newCorrectCount++;
            newStreak++;
            
            const speedRatio = Math.max(0, 1 - (timeTakenForThisQuestion / maxTimePerQ));
            const speedBonus = Math.round(speedRatio * 500);
            const multiplier = newStreak >= 3 ? 1.5 : 1.0;
            
            pointsEarned = Math.round((500 + speedBonus) * multiplier);
        } else {
            newStreak = 0;
            if (config.mode === 'Boss') newLives--;
        }

        const newScore = score + pointsEarned;
        setScore(newScore);
        setCorrectCount(newCorrectCount);
        setCurrentStreak(newStreak);
        setLives(newLives);

        setUserAnswers(prev => [...prev, optionIndex]);
        setQuestionStartTime(timeLeft); 

        // Important: if Boss lives hit 0, don't change question index to avoid out of bounds before effect catches
        if (newLives > 0 && currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            finishQuiz(newScore, timeSpent);
        }
    };

    const finishQuiz = async (finalTotalXP, finalTime) => {
        setIsFinished(true);
        setIsLoading(true); 

        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            try {
                const dbRef = ref(database);
                const snapshot = await get(child(dbRef, `leaderboard/${user.id}`));
                let data = snapshot.exists() ? snapshot.val() : {};
                
                const gamesPlayed = (data.gamesPlayed || 0) + 1;
                const totalTimePlayed = (data.totalTimePlayed || 0) + finalTime;
                
                await set(ref(database, `leaderboard/${user.id}`), {
                    username: user.username,
                    totalXP: (data.totalXP || 0) + finalTotalXP,
                    avgTime: Number((totalTimePlayed / gamesPlayed).toFixed(2)),
                    gamesPlayed: gamesPlayed,
                    totalTimePlayed: totalTimePlayed,
                    lastPlayedAt: Date.now()
                });

                await api.post('/quiz/history', {
                    domain: config.mode === 'Syllabus' ? 'Custom Syllabus' : config.domain,
                    subdomain: config.mode,
                    score: finalTotalXP,
                    totalQuestions: currentIndex + 1, // How far they made it
                    timeTaken: finalTime
                });
            } catch (err) {
                setFirebaseError("Warning: Could not save score to Firebase. Your rules are likely locked.");
            }
        }
        setIsLoading(false);
    };

    if (isLoading && !isFinished) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2 className="text-gradient">Loading the Arena...</h2></div>;
    }

    if (isFinished) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '2rem', overflowY: 'auto' }}>
                <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '800px', width: '100%' }}>
                    
                    {config.mode === 'Boss' && lives <= 0 ? (
                        <h2 style={{ fontSize: '3rem', color: 'var(--danger)', margin: 0 }}>DEFEATED</h2>
                    ) : (
                        <h2 className="text-gradient" style={{ fontSize: '3rem', margin: 0 }}>Match Completed!</h2>
                    )}
                    
                    {firebaseError && <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', marginTop: '1rem' }}>{firebaseError}</div>}

                    <div style={{ margin: '2rem 0', display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', flexWrap: 'wrap', gap: '1rem' }}>
                        <div><p style={{ color: 'var(--text-secondary)' }}>Accuracy</p><h3 style={{ fontSize: '2rem', color: 'var(--success)' }}>{correctCount} / {questions.length}</h3></div>
                        <div><p style={{ color: 'var(--text-secondary)' }}>XP Earned</p><h3 style={{ fontSize: '2rem', color: 'var(--accent-secondary)' }}>+{score} XP</h3></div>
                        <div><p style={{ color: 'var(--text-secondary)' }}>Time Taken</p><h3 style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>{timeSpent}s</h3></div>
                    </div>

                    <div style={{ textAlign: 'left', marginTop: '2rem' }}>
                        <h3 className="text-gradient" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Detailed Review</h3>
                        {questions.slice(0, currentIndex + (config.mode==='Boss' && lives===0 ? 0 : 1)).map((q, idx) => {
                            const userPickedIdx = userAnswers[idx];
                            const isCorrect = userPickedIdx === q.correctOptionIndex;
                            const didNotAnswer = userPickedIdx === null || userPickedIdx === undefined;

                            return (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.4' }}>{idx + 1}. {q.question}</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                                        <div style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                                            <strong>Your Answer:</strong> {didNotAnswer ? "Time Ran Out" : q.options[userPickedIdx]}
                                            {isCorrect && " ✅"} {!isCorrect && !didNotAnswer && " ❌"}
                                        </div>
                                        {!isCorrect && <div style={{ color: 'var(--success)' }}><strong>Correct Answer:</strong> {q.options[q.correctOptionIndex]}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                        <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: '1px solid var(--accent-primary)' }}>Dashboard</button>
                        <button className="btn-primary" onClick={() => navigate('/setup')}>New Quiz</button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    
    // Classic vs Boss Progress Bar logic
    const totalPossibleTime = (config.mode === 'Boss' ? 10 : config.length) * 15;
    const timePercentage = (timeLeft / totalPossibleTime) * 100;
    const ghostPercentage = ghostTime > 0 ? Math.min(100, (timeSpent / ghostTime) * 100) : 0;

    const surrenderQuiz = () => {
        if(window.confirm("Are you sure you want to abandon the match? You will lose this XP!")) {
            finishQuiz(score, timeSpent);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
            
            {/* Action Bar */}
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
                <button onClick={surrenderQuiz} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    🏳️ Surrender Match
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Q {currentIndex + 1}/{questions.length}</span>
                    {config.mode === 'Boss' && (
                        <span style={{ color: '#ef4444', fontSize: '1.2rem', letterSpacing: '4px' }}>
                            {'🩷'.repeat(lives)}{'🖤'.repeat(3 - lives)}
                        </span>
                    )}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {currentStreak >= 3 && <span style={{ color: '#fb923c', fontWeight: 'bold', animation: 'pulseRotate 2s infinite' }}>🔥 {currentStreak}x</span>}
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>⭐ {score} XP</span>
                    <span style={{ color: timeLeft < 10 ? 'var(--danger)' : 'var(--accent-primary)', fontWeight: 'bold', fontSize: '1.2rem', marginLeft: '1rem' }}>⏱ {timeLeft}s</span>
                </div>
            </div>

            {/* Your Engine Progress Bar */}
            <div style={{ width: '100%', maxWidth: '800px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', height: '100%', width: '100%', background: `linear-gradient(90deg, transparent ${100 - timePercentage}%, var(--danger) ${100 - timePercentage}%, var(--accent-primary) 100%)`, transition: 'all 1s linear' }} />
            </div>

            {/* Ghost Tracker */}
            {config.mode === 'Classic' && ghostTime > 0 && (
                <div style={{ width: '100%', maxWidth: '800px', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>👻 Ghost</span>
                    <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${ghostPercentage}%`, background: 'rgba(255, 255, 255, 0.4)', transition: 'width 1s linear' }} />
                    </div>
                </div>
            )}
            {config.mode !== 'Classic' && <div style={{ marginBottom: '2rem' }} />}

            <div className="glass-panel" style={{ width: '100%', maxWidth: '800px' }}>
                {config.mode === 'Boss' && currentIndex === questions.length - 1 && (
                    <span style={{ background: 'var(--danger)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem', display: 'inline-block' }}>FINAL BOSS STAGE</span>
                )}
                
                <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', lineHeight: '1.5' }}>{currentQ?.question}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {currentQ?.options.map((opt, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', textAlign: 'left', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Quiz;
