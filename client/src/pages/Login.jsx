import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';

function Login() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        // Login now expects email, not username + workspace
        const success = await login(email, password);
        if (success) {
            navigate('/dashboard');
        } else {
            setModalConfig({
                isOpen: true,
                title: t('common.error'),
                message: "Login failed. Please check your credentials.",
                type: 'error'
            });
        }
    };

    return (
        <div className="login-container" style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at top left, #1a2a6c, #2a0845, #000000)',
            color: '#ffffff',
            padding: '2rem',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div className="glass-card" style={{
                padding: '3rem',
                width: '100%',
                maxWidth: '450px',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('login.title')}</h1>
                    <p style={{ color: '#8892b0', marginBottom: '1rem' }}>Enter your organization credentials</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#aebbf2', fontWeight: 500 }}>{t('auth.loginEmail')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth.loginEmailPlaceholder', 'john@company.com')}
                            required
                            style={{
                                padding: '0.8rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.2)',
                                color: '#ffffff',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#aebbf2', fontWeight: 500 }}>{t('login.password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                padding: '0.8rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.2)',
                                color: '#ffffff',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <button type="submit" className="btn-add" style={{
                        padding: '1.2rem',
                        marginTop: '1rem',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)'
                    }}>
                        {t('login.login')}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link to="/register-org" style={{ color: '#a855f7', textDecoration: 'none' }}>Register new Organization</Link>
                    </div>
                </form>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#8892b0' }}>
                {t('login.noAccount')} <Link to="/register-org" style={{ color: '#a855f7', fontWeight: 600, textDecoration: 'none' }}>{t('login.registerHere')}</Link>
            </div>
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </div>
    );
}

export default Login;
