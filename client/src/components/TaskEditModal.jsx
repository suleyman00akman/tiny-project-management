import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_Base = "";

function TaskEditModal({ todo, onClose, onUpdate }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [allUsers, setAllUsers] = useState([]);

    // Edit State
    const [editText, setEditText] = useState(todo.text);
    const [editAssignedTo, setEditAssignedTo] = useState(todo.assignedTo || '');
    const [editAssignedToId, setEditAssignedToId] = useState(todo.assignedToId || null);
    const [editStatus, setEditStatus] = useState(todo.status || 'To Do');
    const [editStartDate, setEditStartDate] = useState(todo.startDate || '');
    const [editDueDate, setEditDueDate] = useState(todo.dueDate || '');
    const [editProgress, setEditProgress] = useState(todo.progress || 0);

    const { user, apiCall } = useAuth();
    const [project, setProject] = useState(null);

    useEffect(() => {
        if (user) {
            fetchComments();
            fetchUsers();
            if (todo.projectId) {
                fetchProjectDetails();
            }
        }
    }, [todo, user]);

    const fetchProjectDetails = async () => {
        const res = await apiCall(`${API_Base}/api/projects/${todo.projectId}`);
        if (res && res.ok) setProject(await res.json());
    };

    const fetchComments = async () => {
        const res = await apiCall(`${API_Base}/api/todos/${todo.id}/comments`);
        if (res && res.ok) setComments(await res.json());
    };

    const fetchUsers = async () => {
        try {
            const res = await apiCall('/api/users');
            if (res && res.ok) {
                const data = await res.json();
                setAllUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const res = await apiCall(`${API_Base}/api/todos/${todo.id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text: newComment })
        });

        if (res && res.ok) {
            setComments([...comments, await res.json()]);
            setNewComment("");
        }
    };

    const formatForInput = (isoString) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return '';
            const offset = d.getTimezoneOffset() * 60000;
            return (new Date(d - offset)).toISOString().slice(0, 16);
        } catch (e) {
            return '';
        }
    };

    const formatDisplayDate = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return 'Invalid Date'; }
    };

    const handleSave = async () => {
        try {
            const safeStart = editStartDate ? new Date(editStartDate).toISOString() : null;
            const safeDue = editDueDate ? new Date(editDueDate).toISOString() : null;

            const res = await apiCall(`${API_Base}/api/todos/${todo.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    text: editText,
                    assignedTo: editAssignedTo,
                    assignedToId: editAssignedToId,
                    status: editStatus,
                    startDate: safeStart,
                    dueDate: safeDue,
                    progress: editProgress
                })
            });

            if (res && res.ok) {
                const updatedTodo = await res.json();
                if (onUpdate) onUpdate(updatedTodo);
                onClose();
            } else {
                alert("Failed to update task.");
            }
        } catch (err) {
            console.error("Error updating task:", err);
            alert("Error occurred while updating task.");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${todo.text}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await apiCall(`${API_Base}/api/todos/${todo.id}`, {
                method: 'DELETE'
            });
            if (res && res.ok) {
                if (onUpdate) onUpdate(null); // Signal deletion
                onClose();
            } else {
                alert("Failed to delete task.");
            }
        } catch (err) {
            console.error("Delete failed", err);
            alert("Error occurred while deleting task.");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="flex-between mb-4">
                    <h2>Task Details</h2>
                    <div>
                        <button
                            onClick={handleDelete}
                            className="small danger"
                            style={{ marginRight: '0.5rem' }}
                        >
                            🗑️ Delete
                        </button>
                        <button className="icon-btn" onClick={onClose}>&times;</button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <label>
                        <span className="text-sm" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Task Name</span>
                        <input
                            type="text"
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <label>
                            <span className="text-sm" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Assigned To</span>
                            <select
                                value={editAssignedToId || ''}
                                onChange={e => {
                                    setEditAssignedToId(e.target.value);
                                    // Also update name for display immediately
                                    const u = allUsers.find(user => user.id.toString() === e.target.value);
                                    if (u) setEditAssignedTo(u.username);
                                    else setEditAssignedTo('');
                                }}
                                style={{ width: '100%' }}
                            >
                                <option value="">Unassigned</option>
                                {allUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.username}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className="text-sm" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Status</span>
                            <select
                                value={editStatus}
                                onChange={e => setEditStatus(e.target.value)}
                                style={{ width: '100%' }}
                            >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="In Review">In Review</option>
                                <option value="Done">Done</option>
                            </select>
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <label>
                            <span className="text-sm" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Start Date</span>
                            <input
                                type="datetime-local"
                                value={formatForInput(editStartDate)}
                                onChange={e => setEditStartDate(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </label>

                        <label>
                            <span className="text-sm" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Due Date</span>
                            <input
                                type="datetime-local"
                                value={formatForInput(editDueDate)}
                                onChange={e => setEditDueDate(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </label>
                    </div>

                    <label>
                        <span className="text-sm" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Progress: {editProgress}%</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={editProgress}
                            onChange={e => setEditProgress(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </label>

                    {project && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            <div><strong>Project:</strong> {todo.projectName || project.name}</div>
                            {editStartDate && project.startDate && new Date(editStartDate) < new Date(project.startDate) && (
                                <div style={{ color: 'var(--danger)', marginTop: '4px' }}>
                                    ⚠ Starts before Project ({new Date(project.startDate).toLocaleDateString()})
                                </div>
                            )}
                            {editDueDate && project.endDate && new Date(editDueDate) > new Date(project.endDate) && (
                                <div style={{ color: 'var(--danger)', marginTop: '4px' }}>
                                    ⚠ Ends after Project ({new Date(project.endDate).toLocaleDateString()})
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ alignSelf: 'flex-end', marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button onClick={onClose}>Cancel</button>
                        <button onClick={handleSave} className="primary">Save Changes</button>
                    </div>
                </div>

                <div className="card">
                    <h4 className="mb-4">Comments</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                        {comments.length === 0 ? <p className="text-sm text-muted">No comments yet.</p> : (
                            comments.map(c => (
                                <div key={c.id} style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                                    <div className="flex-between text-xs text-muted mb-4">
                                        <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{c.username}</span>
                                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm">{c.text}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment... (@username to mention)"
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="primary">Post</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TaskEditModal;
