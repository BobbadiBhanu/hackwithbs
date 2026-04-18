import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (error) {
            console.error('Error during registration', error.response?.data?.message);
            alert(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Join the Arena</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="text" name="username" placeholder="Username" onChange={handleChange} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                    <input type="email" name="email" placeholder="Email" onChange={handleChange} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                    <input type="password" name="password" placeholder="Password" onChange={handleChange} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Register Now</button>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Already have an account? <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => navigate('/login')}>Login here</span>.</p>
                </form>
            </div>
        </div>
    );
};

export default Register;
