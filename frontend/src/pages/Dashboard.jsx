import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { database } from '../firebase';
import { ref, get, child } from 'firebase/database';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = {
    'DBMS': '#8b5cf6',
    'DSA': '#10b981',
    'Java': '#f59e0b',
    'General Tech': '#ef4444',
    'Default': '#64748b'
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState(null);
    const [userStats, setUserStats] = useState({ totalXP: 0, gamesPlayed: 0, avgTime: 0 });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);

        const fetchHistory = async () => {
            try {
                const res = await api.get(`/quiz/history/${parsedUser.id}`);
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to load history", err);
            }
        };

        const fetchStats = async () => {
            try {
                const dbRef = ref(database);
                const snapshot = await get(child(dbRef, `leaderboard/${parsedUser.id}`));
                if (snapshot.exists()) {
                    setUserStats(snapshot.val());
                }
            } catch(e) {}
        };

        fetchHistory();
        fetchStats();
    }, [navigate]);

    if (!user) return null;

    // --- Data Processing for Visualizations ---
    
    // 1. Pie Chart: Domain Distribution
    const domainCounts = history.reduce((acc, curr) => {
        acc[curr.domain] = (acc[curr.domain] || 0) + 1;
        return acc;
    }, {});
    
    const pieData = Object.keys(domainCounts).map(domain => ({
        name: domain,
        value: domainCounts[domain]
    }));

    // 2. Line Chart: XP Progression Over Time (Reversed so oldest is first)
    const progressionData = [...history].reverse().map((match, idx) => ({
        name: `M${idx + 1}`,
        xp: match.score,
        domain: match.domain
    }));

    // 3. Achievements Logic
    const achievements = [
        { id: 1, title: 'First Blood', desc: 'Complete your first match', unlocked: userStats.gamesPlayed >= 1 },
        { id: 2, title: 'Veteran', desc: 'Play 5 ranked matches', unlocked: userStats.gamesPlayed >= 5 },
        { id: 3, title: 'Rich in XP', desc: 'Earn 5,000 Global XP', unlocked: userStats.totalXP >= 5000 },
        { id: 4, title: 'Speed Demon', desc: 'Average time under 10s', unlocked: userStats.gamesPlayed > 0 && userStats.avgTime < 10 },
    ];

    const getBadge = (xp) => {
        if (!xp) return '🥉 Bronze';
        if (xp >= 20000) return '💎 Diamond';
        if (xp >= 10000) return '🥇 Gold';
        if (xp >= 4000) return '🥈 Silver';
        return '🥉 Bronze';
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header Banner */}
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: '5px solid var(--accent-primary)' }}>
                <div>
                    <h2 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>Command Center</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>Welcome back, <strong>{user.username}</strong>.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '1rem 2rem', borderRadius: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Global XP</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{userStats.totalXP || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Tier</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{getBadge(userStats.totalXP)}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
                        <button className="btn-primary" onClick={() => navigate('/setup')} style={{ padding: '0.75rem 1.5rem' }}>Enter Arena</button>
                    </div>
                </div>
            </div>

            {/* Visualizations Section */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                
                {/* Domain Focus Pie Chart */}
                <div className="glass-panel" style={{ flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Concept Focus</h3>
                    {pieData.length > 0 ? (
                        <div style={{ flex: 1, minHeight: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['Default']} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No data available. Play some matches!</div>
                    )}
                </div>

                {/* XP Progression Line Chart */}
                <div className="glass-panel" style={{ flex: 2, minWidth: '500px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>XP Performance History</h3>
                    {progressionData.length > 0 ? (
                        <div style={{ flex: 1, minHeight: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                                    <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                                    <RechartsTooltip 
                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        labelStyle={{ color: 'var(--accent-secondary)' }}
                                    />
                                    <Line type="monotone" dataKey="xp" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-secondary)' }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>You must play games to plot performance.</div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Achievements & History Log */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                
                {/* Achievements List */}
                <div className="glass-panel" style={{ flex: 1, minWidth: '350px' }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Achievements</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {achievements.map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: `1px solid ${a.unlocked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)'}`, opacity: a.unlocked ? 1 : 0.5, transition: 'all 0.3s' }}>
                                <div style={{ fontSize: '2rem' }}>{a.unlocked ? '🏆' : '🔒'}</div>
                                <div>
                                    <h4 style={{ color: a.unlocked ? 'white' : 'var(--text-secondary)', margin: '0 0 0.2rem 0' }}>{a.title}</h4>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{a.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* History Log */}
                <div className="glass-panel" style={{ flex: 1, minWidth: '350px' }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Match Records</h3>
                    {history.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No history logs yet.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                            {history.slice(0, 8).map(item => (
                                <li key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `3px solid ${COLORS[item.domain] || 'var(--text-secondary)'}` }}>
                                    <div>
                                        <strong>{item.domain}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({item.subdomain})</span>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{new Date(item.completedAt).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>+{item.score} XP</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.timeTaken}s</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
