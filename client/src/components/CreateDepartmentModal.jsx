import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CreateDepartmentModal = ({ isOpen, onClose, onDepartmentCreated }) => {
    const { apiCall } = useAuth();
    const [name, setName] = useState('');
    const [managerId, setManagerId] = useState('');
    const [managers, setManagers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchManagers();
        }
    }, [isOpen]);

    const fetchManagers = async () => {
        try {
            const res = await apiCall('/api/organization/users?role=Department Manager');
            if (res && res.ok) {
                const data = await res.json();
                setManagers(data);
                if (data.length > 0) setManagerId(data[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch managers", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await apiCall('/api/departments', {
                method: 'POST',
                body: JSON.stringify({ name, managerId })
            });

            if (res && res.ok) {
                setName('');
                onDepartmentCreated();
                onClose();
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to create department');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
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
            zIndex: 1100
        }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '400px', width: '90%' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                    Create New Department
                </h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Department Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)'
                            }}
                            placeholder="Engineering / Marketing / etc."
                            autoFocus
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Department Manager
                        </label>
                        <select
                            value={managerId}
                            onChange={(e) => setManagerId(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <option value="">Select Manager</option>
                            {managers.map(m => (
                                <option key={m.id} value={m.id} style={{ background: '#1a1a2e' }}>{m.username}</option>
                            ))}
                        </select>
                        <small style={{ opacity: 0.5, fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>
                            Only users with 'Department Manager' role are listed.
                        </small>
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#f87171',
                            marginBottom: '1rem',
                            fontSize: '0.85rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ padding: '0.6rem 1.2rem' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-add"
                            style={{ padding: '0.6rem 1.2rem' }}
                        >
                            {loading ? "Creating..." : "Create Department"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateDepartmentModal;
