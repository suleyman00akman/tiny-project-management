import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

function CreateProjectModal({ onClose, onSuccess }) {
    const { user, apiCall } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        members: [] // User IDs
    });
    const [allUsers, setAllUsers] = useState([]);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await apiCall('/api/users');
                if (res && res.ok) {
                    const data = await res.json();
                    setAllUsers(data);
                }
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, [apiCall]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMemberToggle = (userId) => {
        setFormData(prev => {
            const currentMembers = prev.members || [];
            if (currentMembers.includes(userId)) {
                return { ...prev, members: currentMembers.filter(id => id !== userId) };
            } else {
                return { ...prev, members: [...currentMembers, userId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return;

        try {
            const res = await apiCall('/api/projects', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (res && res.ok) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Error',
                    message: "Failed to create project. Please check your permissions.",
                    type: 'error'
                });
            }
        } catch (err) {
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: "An error occurred during the operation.",
                type: 'error'
            });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
                <div className="flex-between mb-4">
                    <h3>Create New Project</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'white' }}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Project Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter project name..."
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Project Members</label>
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            {allUsers.filter(u => u.id !== user.id).map(u => (
                                <div key={u.id} className="checkbox-wrapper" style={{ padding: '0.4rem' }}>
                                    <input
                                        type="checkbox"
                                        id={`new-proj-user-${u.id}`}
                                        checked={formData.members.includes(u.id)}
                                        onChange={() => handleMemberToggle(u.id)}
                                        style={{ width: 'auto', marginRight: '0.5rem' }}
                                    />
                                    <label htmlFor={`new-proj-user-${u.id}`} style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                                        {u.username} ({u.role})
                                    </label>
                                </div>
                            ))}
                            {allUsers.filter(u => u.id !== user.id).length === 0 && (
                                <div style={{ fontSize: '0.8rem', opacity: 0.6, textAlign: 'center', padding: '1rem' }}>
                                    No other users found to add.
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="submit" className="btn-add">Create Project</button>
                    </div>
                </form>

                <Modal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                />
            </div>
        </div>
    );
}

export default CreateProjectModal;
