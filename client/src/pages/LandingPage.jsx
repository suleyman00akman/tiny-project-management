import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LandingPage() {
    const { loginDemo } = useAuth();
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <nav style={{
                padding: '2rem 4rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(90deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    TinyPM
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <button
                        onClick={async () => {
                            const success = await loginDemo();
                            if (success) window.location.href = '/dashboard';
                        }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '20px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        🚀 Try Demo
                    </button>
                    <Link to="/login" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>Login</Link>
                    <Link to="/register-org" style={{
                        background: '#6366f1',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '20px',
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: '500'
                    }}>
                        Get Started
                    </Link>
                </div>
            </nav>

            <header style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '0 2rem'
            }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', maxWidth: '900px', lineHeight: 1.1 }}>
                    Project Management for <br />
                    <span style={{ color: '#a855f7' }}>Modern Organizations</span>
                </h1>
                <p style={{ fontSize: '1.2rem', opacity: 0.7, maxWidth: '600px', marginBottom: '3rem', lineHeight: 1.6 }}>
                    Structure your company with Departments, Projects, and Teams.
                    Manage access with precise Role-Based Control.
                </p>

                <div style={{ display: 'flex', gap: '2rem', marginBottom: '5rem' }}>
                    <button
                        onClick={async () => {
                            const success = await loginDemo();
                            if (success) window.location.href = '/dashboard';
                        }}
                        style={{
                            padding: '1.2rem 2.5rem',
                            fontSize: '1.1rem',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        🚀 Launch Demo
                    </button>
                    <Link to="/register-org" className="btn-add" style={{
                        padding: '1.2rem 2.5rem',
                        fontSize: '1.1rem',
                        textDecoration: 'none',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.5)',
                        transition: 'transform 0.2s'
                    }}>
                        Get Started Free
                    </Link>
                </div>
            </header>
        </div>
    );
}

export default LandingPage;
