import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

function CreateTaskModal({ onClose, onSuccess, initialProjectId }) {
    const { user, apiCall } = useAuth();
    const [projects, setProjects] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [formData, setFormData] = useState({
        projectId: initialProjectId || '',
        text: '',
        assignee: '',
        assigneeId: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: ''
    });

    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all organization users for assignee dropdown
                const usersRes = await apiCall('/api/users');
                if (usersRes && usersRes.ok) {
                    setAllUsers(await usersRes.json());
                }

                const res = await apiCall('/api/projects');
                if (res && res.ok) {
                    const data = await res.json();
                    setProjects(data);

                    const targetProjId = initialProjectId ? parseInt(initialProjectId) : (data.length > 0 ? data[0].id : '');
                    const selectedProj = data.find(p => p.id === targetProjId);

                    if (selectedProj) {
                        setFormData(prev => ({
                            ...prev,
                            projectId: selectedProj.id,
                            assignee: user.username,
                            assigneeId: user.id
                        }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data for task creation", err);
            }
        };
        fetchData();
    }, [apiCall, user.username, user.id, initialProjectId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'projectId') {
            // No longer need to locally constrain by project members here
            // since backend handles auto-adding.
        }

        if (name === 'assigneeId') {
            const selectedMember = allUsers.find(m => m.id.toString() === value);
            if (selectedMember) {
                setFormData(prev => ({ ...prev, assignee: selectedMember.username }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.projectId || !formData.text) return;

        try {
            const res = await apiCall(`/api/projects/${formData.projectId}/todos`, {
                method: 'POST',
                body: JSON.stringify({
                    text: formData.text,
                    assignedTo: formData.assignee,
                    assignedToId: formData.assigneeId || null,
                    startDate: formData.startDate || null,
                    dueDate: formData.dueDate || null
                })
            });

            if (res && res.ok) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Error',
                    message: "Failed to create task.",
                    type: 'error'
                });
            }
        } catch (err) {
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: "An error occurred while creating task.",
                type: 'error'
            });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
                <div className="flex-between mb-4">
                    <h3>Create New Task</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'white' }}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', opacity: 0.8 }}>Select Project</label>
                        <select
                            name="projectId"
                            value={formData.projectId}
                            onChange={handleChange}
                            required
                            style={{
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                width: '100%'
                            }}
                        >
                            <option value="" disabled style={{ background: 'var(--bg-secondary)' }}>Select Project</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', opacity: 0.8 }}>Task Title</label>
                        <input
                            type="text"
                            name="text"
                            value={formData.text}
                            onChange={handleChange}
                            placeholder="What needs to be done?"
                            required
                            style={{
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                width: '100%'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', opacity: 0.8 }}>Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    width: '100%'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', opacity: 0.8 }}>Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    width: '100%'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', opacity: 0.8 }}>Assignee</label>
                        <select
                            name="assigneeId"
                            value={formData.assigneeId}
                            onChange={handleChange}
                            required
                            style={{
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                width: '100%'
                            }}
                        >
                            <option value="" disabled style={{ background: 'var(--bg-secondary)' }}>Select Person</option>
                            {allUsers.map(m => (
                                <option key={m.id} value={m.id} style={{ background: 'var(--bg-secondary)' }}>{m.username} ({m.role})</option>
                            ))}
                        </select>
                        <small style={{ opacity: 0.5, fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>
                            Assigned users will be automatically added to the project.
                        </small>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="submit" className="btn-add">Create Task</button>
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

export default CreateTaskModal;
