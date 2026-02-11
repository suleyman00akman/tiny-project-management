import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const DepartmentWizard = () => {
    const { t } = useTranslation();
    const { user, apiCall } = useAuth();
    const navigate = useNavigate();
    const [departmentName, setDepartmentName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await apiCall('/api/departments', {
                method: 'POST',
                body: JSON.stringify({ name: departmentName })
            });

            if (res && res.ok) {
                // Fetch updated user data to get the new departmentId
                const userRes = await apiCall('/api/me');
                if (userRes && userRes.ok) {
                    const updatedUser = await userRes.json();
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/dashboard';
                }
            } else {
                const data = await res.json();
                setError(data.message || t('common.error'));
            }
        } catch (err) {
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
            padding: '2rem'
        }}>
            <div className="glass-card" style={{
                maxWidth: '500px',
                width: '100%',
                padding: '2.5rem'
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, #00f2ff, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {t('department.createFirst', 'Create Your First Department')}
                </h1>
                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                    {user?.username}, {t('department.noDepartments', "You don't have any departments yet. Create your first one!")}
                </p>

                <form onSubmit={handleCreateDepartment}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            {t('department.name', 'Department Name')}
                        </label>
                        <input
                            type="text"
                            value={departmentName}
                            onChange={(e) => setDepartmentName(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                            placeholder="My Department"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#f87171',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-add"
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        {loading ? t('common.loading') : t('department.create', 'Create Department')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DepartmentWizard;
