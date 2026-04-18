import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('user')) {
            navigate('/dashboard');
        }
    }, [navigate]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
            
            <h1 className="text-gradient" style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                AI-Powered Quiz Hub
            </h1>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', marginBottom: '3rem' }}>
                Test your knowledge across infinite domains. Let AI craft unique challenges, track your times, and climb the real-time leaderboard!
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                
                {/* Guest Pathway */}
                <div className="glass-panel" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Play as Guest</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Generate infinite quizzes and practice your skills. (Scores will not be tracked on the leaderboard).</p>
                    <button className="btn-primary" onClick={() => navigate('/setup')} style={{ width: '100%', marginTop: 'auto' }}>
                        Start Quick Quiz
                    </button>
                </div>

                {/* Authenticated Pathway */}
                <div className="glass-panel" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', border: '1px solid var(--accent-primary)' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>Compete & Rank Up</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to track your scores, get your average time charted, and dominate the realtime leaderboard.</p>
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: 'auto' }}>
                        <button className="btn-primary" onClick={() => navigate('/login')} style={{ flex: 1, background: 'transparent', border: '1px solid var(--accent-primary)' }}>
                            Login
                        </button>
                        <button className="btn-primary" onClick={() => navigate('/register')} style={{ flex: 1 }}>
                            Register
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Landing;
