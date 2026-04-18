import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Don't show navbar during active quiz to prevent distractions
    if (location.pathname === '/quiz') return null;

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
            <h2 className="text-gradient" style={{ cursor: 'pointer', margin: 0, fontSize: '1.5rem', whiteSpace: 'nowrap' }} onClick={() => navigate('/')}>
                AI Quiz Hub
            </h2>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                <span style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }} onClick={() => navigate('/setup')} onMouseOver={e=>e.target.style.color='white'} onMouseOut={e=>e.target.style.color='var(--text-secondary)'}>Setup Quiz</span>
                <span style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }} onClick={() => navigate('/leaderboard')} onMouseOver={e=>e.target.style.color='white'} onMouseOut={e=>e.target.style.color='var(--text-secondary)'}>Leaderboard</span>
                
                {user ? (
                    <>
                        <span style={{ cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '0.9rem' }} onClick={() => navigate('/dashboard')}>Dashboard</span>
                        <button className="btn-primary" onClick={handleLogout} style={{ padding: '0.3rem 0.8rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '0.9rem' }}>Logout</button>
                    </>
                ) : (
                    <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem' }}>Sign In</button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
