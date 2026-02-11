import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const CreateUserModal = ({ isOpen, onClose, onUserCreated, editingUser }) => {
    const { t } = useTranslation();
    const { user, apiCall } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Member');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);

    useEffect(() => {
        if (editingUser) {
            setUsername(editingUser.username || '');
            setEmail(editingUser.email || '');
            setRole(editingUser.role || 'Member');
            setPassword('');
            setSuccess(false);
            setError('');
        } else {
            setUsername('');
            setEmail('');
            setRole('Member');
            setPassword('');
            setSuccess(false);
            setError('');
        }
    }, [editingUser, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/organization/users';
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await apiCall(url, {
                method,
                body: JSON.stringify({
                    username,
                    email: email.trim(),
                    password: password || undefined,
                    role,
                    departmentId: user?.departmentId
                })
            });

            if (res && res.ok) {
                if (!editingUser) {
                    setCreatedUser({ email: email.trim(), password });
                    setSuccess(true);
                } else {
                    onUserCreated();
                    onClose();
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

    const handleDone = () => {
        setSuccess(false);
        setCreatedUser(null);
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('Member');
        onUserCreated();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '500px', width: '90%' }}>
                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>{t('auth.createSuccess')}</h2>
                        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>{t('auth.loginInstructions')}</p>

                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            textAlign: 'left',
                            marginBottom: '2rem',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '0.25rem' }}>
                                    {t('auth.loginId')}
                                </label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{createdUser?.email}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '0.25rem' }}>
                                    {t('auth.password')}
                                </label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{createdUser?.password}</div>
                            </div>
                        </div>

                        <button
                            onClick={handleDone}
                            className="btn-add"
                            style={{ width: '100%', padding: '1rem' }}
                        >
                            {t('auth.done')}
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                            {editingUser ? 'Edit Team Member' : 'Create New Team Member'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    {t('auth.fullName')}
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="John Doe"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    {t('auth.loginEmail')} ({t('auth.loginDescription')})
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={!!editingUser}
                                    placeholder="john@company.com"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                        opacity: editingUser ? 0.6 : 1
                                    }}
                                />
                                {!editingUser && email && (
                                    <small style={{ color: 'var(--accent-primary)', marginTop: '0.5rem', display: 'block' }}>
                                        {t('auth.loginPreview')}: <strong>{email.trim()}</strong>
                                    </small>
                                )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    {editingUser ? 'New Password (Leave blank to keep current)' : t('auth.password')}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required={!editingUser}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    Role
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="Member">Member</option>
                                    <option value="Project Manager">Project Manager</option>
                                    <option value="Department Manager">Department Manager</option>
                                </select>
                            </div>

                            {error && (
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    color: '#f87171',
                                    marginBottom: '1rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-secondary"
                                    style={{ padding: '0.75rem 1.5rem' }}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-add"
                                    style={{ padding: '0.75rem 1.5rem' }}
                                >
                                    {loading ? (editingUser ? "Saving..." : "Creating...") : (editingUser ? "Save Changes" : "Create User")}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreateUserModal;
