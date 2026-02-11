import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const DepartmentManagement = () => {
    const { t } = useTranslation();
    const { user, apiCall } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            const res = await apiCall('/api/departments');
            if (res && res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (err) {
            console.error('Failed to load departments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await apiCall('/api/departments', {
                method: 'POST',
                body: JSON.stringify({ name: newDeptName })
            });

            if (res && res.ok) {
                setShowCreateModal(false);
                setNewDeptName('');
                loadDepartments();
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to create department');
            }
        } catch (err) {
            setError('Connection error');
        }
    };

    const handleSwitchDept = async (deptId) => {
        try {
            const res = await apiCall(`/api/departments/switch/${deptId}`, {
                method: 'POST'
            });
            if (res && res.ok) {
                window.location.href = '/dashboard';
            }
        } catch (err) {
            console.error('Switch failed:', err);
        }
    };

    if (!user?.isDepartmentManager && user?.role !== 'Super Admin') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Access Denied. Only Department Managers or Super Admins can manage departments.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>
                    My Departments
                </h1>
                {(user.role === 'Super Admin' || user.isDepartmentManager) && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-add"
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        + Create Department
                    </button>
                )}
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {departments.map((dept) => (
                        <div
                            key={dept.id}
                            className="glass-card"
                            style={{
                                padding: '1.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: dept.id === user.departmentId ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)'
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                    {dept.name}
                                    {dept.id === user.departmentId && (
                                        <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: 'var(--accent-primary)' }}>
                                            (Active)
                                        </span>
                                    )}
                                </h3>
                                <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                                    Manager: {dept.manager?.username || 'Unassigned'} | Created: {new Date(dept.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            {dept.id !== user.departmentId && (
                                <button
                                    onClick={() => handleSwitchDept(dept.id)}
                                    className="btn-secondary"
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    Switch to Department
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Department Modal Overlay */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-card" style={{ padding: '2rem', maxWidth: '500px', width: '90%' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Create Department</h2>
                        <form onSubmit={handleCreateDept}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Department Name</label>
                                <input
                                    type="text"
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', padding: '0.75rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px', color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            {error && (
                                <div style={{
                                    padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px',
                                    color: '#f87171', marginBottom: '1rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setError('');
                                        setNewDeptName('');
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: '0.75rem 1.5rem' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-add" style={{ padding: '0.75rem 1.5rem' }}>
                                    Create Department
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentManagement;
