import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';

function Register() {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const { register, login } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        const result = await register(username, password);
        if (result.success) {
            // Auto-login after registration
            const loginSuccess = await login(username, password);
            if (loginSuccess) {
                // Redirect to department wizard
                navigate('/department-wizard');
            }
        } else {
            setModalConfig({
                isOpen: true,
                title: t('common.error'),
                message: result.message || t('register.error'),
                type: 'error'
            });
        }
    };

    const closeModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
    };

    return (
        <div className="register-container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at top right, #1a2a6c, #2a0845, #000000)',
            color: '#ffffff',
            padding: '2rem',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div className="glass-card" style={{
                padding: '3rem',
                width: '100%',
                maxWidth: '500px',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('register.title')}</h1>
                    <p style={{ color: '#8892b0' }}>Start your journey with Tiny PM</p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#aebbf2', fontWeight: 500 }}>{t('register.username')}</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            required
                            style={{
                                padding: '0.8rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.2)',
                                color: '#ffffff',
                                outline: 'none',
                                width: '100%'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#aebbf2', fontWeight: 500 }}>{t('register.password')}</label>
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
                                outline: 'none',
                                width: '100%'
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
                        {t('register.register')}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#8892b0' }}>
                    {t('register.alreadyHaveAccount')} <Link to="/login" style={{ color: '#a855f7', fontWeight: 600, textDecoration: 'none' }}>{t('register.loginHere')}</Link>
                </div>
            </div>

            <Modal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </div>
    );
}

export default Register;
