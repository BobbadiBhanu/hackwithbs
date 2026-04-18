import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';

const Leaderboard = () => {
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const leaderboardRef = ref(database, 'leaderboard');
        
        const unsubscribe = onValue(leaderboardRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const playersArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));

                // Sort: 1st by Global Total XP (DESC), 2nd by Average Time (ASC)
                playersArray.sort((a, b) => {
                    const xpA = a.totalXP || 0;
                    const xpB = b.totalXP || 0;
                    if (xpB !== xpA) {
                        return xpB - xpA;
                    }
                    return a.avgTime - b.avgTime;
                });

                setPlayers(playersArray);
            } else {
                setPlayers([]);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helper for Tier badges
    const getBadge = (xp) => {
        if (!xp) return '🥉 Bronze';
        if (xp >= 20000) return '💎 Diamond';
        if (xp >= 10000) return '🥇 Gold';
        if (xp >= 4000) return '🥈 Silver';
        return '🥉 Bronze';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '4rem 2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1000px', marginBottom: '2rem' }}>
                <h2 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>Global XP Leaderboard</h2>
                <button className="btn-primary" onClick={() => navigate('/setup')} style={{ background: 'transparent', border: '1px solid var(--accent-primary)' }}>New Quiz</button>
            </div>

            <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', padding: '0', overflowX: 'auto' }}>
                
                {isLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading live data...</div>
                ) : players.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No scores yet. Be the first!</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <tr>
                                <th style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Rank</th>
                                <th style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Player</th>
                                <th style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Tier</th>
                                <th style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Global XP</th>
                                <th style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Matches</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((p, idx) => (
                                <tr key={p.id} style={{ 
                                    background: idx === 0 ? 'rgba(234, 179, 8, 0.1)' : idx === 1 ? 'rgba(148, 163, 184, 0.1)' : idx === 2 ? 'rgba(180, 83, 9, 0.1)' : 'transparent',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'background 0.2s',
                                }}>
                                    <td style={{ padding: '1.25rem', fontWeight: 'bold', color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-secondary)' }}>
                                        #{idx + 1}
                                    </td>
                                    <td style={{ padding: '1.25rem', fontWeight: 'bold', fontSize: '1.1rem' }}>{p.username}</td>
                                    <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{getBadge(p.totalXP)}</td>
                                    <td style={{ padding: '1.25rem', color: 'var(--accent-secondary)', fontWeight: '800', fontSize: '1.2rem' }}>{p.totalXP || p.highScore || 0} XP</td>
                                    <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{p.gamesPlayed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

            </div>
        </div>
    );
};

export default Leaderboard;
