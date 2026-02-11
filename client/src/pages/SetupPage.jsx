import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

function SetupPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ departmentName: '', username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const handleNext = () => setStep(2);
    const handleNextStep2 = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStep(4);
            } else {
                const data = await res.json();
                setModalConfig({
                    isOpen: true,
                    title: 'Setup Error',
                    message: data.message || "An error occurred during setup.",
                    type: 'error'
                });
            }
        } catch (err) {
            setModalConfig({
                isOpen: true,
                title: 'Connection Error',
                message: "Failed to connect to server. Please check your internet connection.",
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '500px', marginTop: '10vh' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                    TinyPM Setup
                </h1>

                {step === 1 && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            Welcome to <strong>TinyPM</strong>!<br />
                            It looks like this is a fresh installation.<br />
                            Let's set up your <strong>Department</strong> to get started.
                        </p>
                        <button className="btn-add" onClick={handleNext} style={{ width: '100%', padding: '1rem' }}>
                            Start Setup →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleNextStep2} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Create Department</h3>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Department Name</label>
                            <input
                                type="text"
                                required
                                value={formData.departmentName}
                                onChange={e => setFormData({ ...formData, departmentName: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-add"
                            style={{ padding: '1rem', marginTop: '1rem' }}
                        >
                            Next →
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Create Administrator</h3>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Username</label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
                            >
                                ← Back
                            </button>
                            <button
                                type="submit"
                                className="btn-add"
                                disabled={loading}
                                style={{ flex: 2, padding: '1rem' }}
                            >
                                {loading ? 'Creating...' : 'Finish Setup'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 4 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h3 style={{ marginBottom: '1rem' }}>Setup Complete!</h3>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                            Your department <strong>{formData.departmentName}</strong> is ready.<br />
                            You can now log in as the administrator.
                        </p>
                        <button
                            className="btn-add"
                            onClick={() => window.location.href = '/login'}
                            style={{ width: '100%', padding: '1rem' }}
                        >
                            Go to Login →
                        </button>
                    </div>
                )}
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

export default SetupPage;
