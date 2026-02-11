import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

function EditProjectModal({ project, onClose, onUpdate }) {
    const { user, apiCall } = useAuth();
    // ...
    const [allUsers, setAllUsers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        isArchived: false,
        members: []
    });
    const [memberRoles, setMemberRoles] = useState({});

    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await apiCall('/api/users');
                if (res && res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setAllUsers(data);
                    } else {
                        console.error("Users API returned non-array:", data);
                        setAllUsers([]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch users", err);
                setAllUsers([]);
            }
        };
        fetchUsers();

        if (project) {
            setFormData(prev => ({
                ...prev,
                name: project.name || '',
                startDate: project.startDate ? project.startDate.split('T')[0] : '',
                endDate: project.endDate ? project.endDate.split('T')[0] : '',
                isArchived: project.isArchived || false,
                members: (project.Members && Array.isArray(project.Members)) ? project.Members.map(m => m.id) : []
            }));

            // Initialize member roles from project data
            if (project.Members && Array.isArray(project.Members)) {
                const roles = {};
                project.Members.forEach(m => {
                    roles[m.id] = m.ProjectMembers?.role || 'Member';
                });
                setMemberRoles(roles);
            }
        }
    }, [project]);

    // Safety check for render
    if (!project) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMemberToggle = (userId) => {
        setFormData(prev => {
            const currentMembers = prev.members || [];
            if (currentMembers.includes(userId)) {
                // Remove member and their role
                setMemberRoles(prevRoles => {
                    const newRoles = { ...prevRoles };
                    delete newRoles[userId];
                    return newRoles;
                });
                return { ...prev, members: currentMembers.filter(id => id !== userId) };
            } else {
                // Add member with default role
                setMemberRoles(prevRoles => ({
                    ...prevRoles,
                    [userId]: 'Member'
                }));
                return { ...prev, members: [...currentMembers, userId] };
            }
        });
    };

    const handleRoleChange = (userId, newRole) => {
        setMemberRoles(prev => ({
            ...prev,
            [userId]: newRole
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Include member roles in the request
            const dataToSend = {
                ...formData,
                memberRoles: memberRoles
            };

            const res = await apiCall(`/api/projects/${project.id}`, {
                method: 'PUT',
                body: JSON.stringify(dataToSend)
            });
            if (res.ok) {
                const updated = await res.json();
                onUpdate(updated);
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Error',
                    message: "Failed to update project.",
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
            <div className="glass-card modal-content" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                <h2 className="mb-4">Edit Project</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <label>
                        Project Name
                        <input name="name" value={formData.name} onChange={handleChange} required />
                    </label>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ flex: 1 }}>
                            Start Date
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
                        </label>
                        <label style={{ flex: 1 }}>
                            End Date
                            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
                        </label>
                    </div>

                    <div className="checkbox-wrapper">
                        <input
                            type="checkbox"
                            id="archiveCheck"
                            name="isArchived"
                            checked={formData.isArchived}
                            onChange={handleChange}
                        />
                        <label htmlFor="archiveCheck">Archived</label>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label className="mb-2 block">Project Members (Select to Add/Remove)</label>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'var(--glass-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            {allUsers && Array.isArray(allUsers) && allUsers.map(u => (
                                <div key={u.id} style={{
                                    marginBottom: '0.6rem',
                                    padding: '0.8rem',
                                    borderRadius: '6px',
                                    background: formData.members.includes(u.id) ? 'rgba(79, 107, 245, 0.1)' : 'transparent',
                                    border: formData.members.includes(u.id) ? '1px solid rgba(79, 107, 245, 0.3)' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <input
                                            type="checkbox"
                                            id={`user-${u.id}`}
                                            checked={formData.members.includes(u.id)}
                                            onChange={() => handleMemberToggle(u.id)}
                                            disabled={u.id === project?.managerId}
                                            style={{ width: 'auto', margin: 0 }}
                                        />
                                        <label htmlFor={`user-${u.id}`} style={{ cursor: 'pointer', flex: 1 }}>
                                            {u.username} {u.id === project?.managerId && <span style={{ fontSize: '0.8em', opacity: 0.7 }}>(Project Manager)</span>}
                                        </label>
                                        {formData.members.includes(u.id) && u.id !== project?.managerId && (
                                            <select
                                                value={memberRoles[u.id] || 'Member'}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    padding: '0.4rem 0.6rem',
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(174, 187, 242, 0.3)',
                                                    borderRadius: '4px',
                                                    color: '#fff',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="Member">Member</option>
                                                <option value="Manager">Project Manager</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" className="primary">Save Changes</button>
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

export default EditProjectModal;
