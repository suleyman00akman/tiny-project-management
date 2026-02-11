import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

const API_Base = "";

function TaskDetails({ todo, onClose }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [isEditing, setIsEditing] = useState(false);

    // Edit State
    const [editText, setEditText] = useState(todo.text);
    const [editAssignedTo, setEditAssignedTo] = useState(todo.assignedTo || '');
    const [editStartDate, setEditStartDate] = useState(todo.startDate || '');
    const [editDueDate, setEditDueDate] = useState(todo.dueDate || '');

    const { user, apiCall } = useAuth();
    const [project, setProject] = useState(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

    useEffect(() => {
        if (user) {
            fetchComments();
            fetchProjectDetails();
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

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const res = await apiCall(`${API_Base}/api/todos/${todo.id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text: newComment, projectId: todo.projectId })
        });

        if (res && res.ok) {
            setComments([...comments, await res.json()]);
            setNewComment("");
        }
    };

    const handleCommentChange = async (e) => {
        const val = e.target.value;
        setNewComment(val);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.substring(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            const query = mentionMatch[1];
            setMentionQuery(query);
            setMentionIndex(cursorPosition - query.length - 1);

            if (query.length >= 1) {
                const res = await apiCall(`/api/users/search?q=${query}`);
                if (res && res.ok) {
                    setMentionSuggestions(await res.json());
                }
            } else {
                setMentionSuggestions([]);
            }
        } else {
            setMentionSuggestions([]);
        }
    };

    const selectMention = (username) => {
        const before = newComment.substring(0, mentionIndex);
        const after = newComment.substring(mentionIndex + mentionQuery.length + 1);
        setNewComment(`${before}@${username} ${after}`);
        setMentionSuggestions([]);
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

    const handleSaveEdit = async () => {
        try {
            const safeStart = editStartDate ? new Date(editStartDate).toISOString() : null;
            const safeDue = editDueDate ? new Date(editDueDate).toISOString() : null;

            const res = await apiCall(`${API_Base}/api/todos/${todo.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    text: editText,
                    assignedTo: editAssignedTo,
                    startDate: safeStart,
                    dueDate: safeDue
                })
            });

            if (res && res.ok) {
                setIsEditing(false);
                window.location.reload();
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Error',
                    message: "Failed to update task.",
                    type: 'error'
                });
            }
        } catch (err) {
            console.error("Error updating task:", err);
        }
    };

    const confirmDelete = async () => {
        try {
            const res = await apiCall(`${API_Base}/api/todos/${todo.id}`, {
                method: 'DELETE'
            });
            if (res && res.ok) {
                window.location.reload();
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Error',
                    message: "Failed to delete task.",
                    type: 'error'
                });
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleDeleteTask = () => {
        setModalConfig({
            isOpen: true,
            title: 'Delete Task?',
            message: `Are you sure you want to delete "${todo.text}"? This action cannot be undone.`,
            type: 'warning',
            onConfirm: confirmDelete
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="flex-between mb-4">
                    <h2>Task Details</h2>
                    <div>
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    style={{ marginRight: '0.5rem' }}
                                    className="small"
                                >
                                    ✎ Edit
                                </button>
                                <button
                                    onClick={handleDeleteTask}
                                    className="small danger"
                                    style={{ marginRight: '0.5rem' }}
                                >
                                    🗑️
                                </button>
                            </>
                        )}
                        <button className="icon-btn" onClick={onClose}>&times;</button>
                    </div>
                </div>

                {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        <label>
                            <span className="text-sm">Task Name</span>
                            <input type="text" value={editText} onChange={e => setEditText(e.target.value)} />
                        </label>
                        <label>
                            <span className="text-sm">Assigned To</span>
                            <input type="text" value={editAssignedTo} onChange={e => setEditAssignedTo(e.target.value)} />
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ flex: 1 }}>
                                <span className="text-sm">Start Date</span>
                                <input type="datetime-local" value={formatForInput(editStartDate)} onChange={e => setEditStartDate(e.target.value)} />
                            </label>
                            <label style={{ flex: 1 }}>
                                <span className="text-sm">Due Date</span>
                                <input type="datetime-local" value={formatForInput(editDueDate)} onChange={e => setEditDueDate(e.target.value)} />
                            </label>
                        </div>
                        <div style={{ alignSelf: 'flex-end', marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setIsEditing(false)}>Cancel</button>
                            <button onClick={handleSaveEdit} className="primary">Save Changes</button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-4">
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{todo.text}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--text-secondary)' }}>
                            <div className="card" style={{ padding: '1rem' }}>
                                <div className="text-xs mb-4">STATUS</div>
                                <span className={`badge ${todo.status === 'Done' ? 'badge-blue' : 'badge-purple'}`}>{todo.status}</span>
                            </div>
                            <div className="card" style={{ padding: '1rem' }}>
                                <div className="text-xs mb-4">PROGRESS</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{todo.progress}%</div>
                            </div>
                            <div className="card" style={{ padding: '1rem' }}>
                                <div className="text-xs mb-4">ASSIGNEE</div>
                                <div>{todo.assignedTo || 'Unassigned'}</div>
                            </div>
                            <div className="card" style={{ padding: '1rem' }}>
                                <div className="text-xs mb-4">TIMELINE</div>
                                <div className="text-xs">Start: {formatDisplayDate(todo.startDate)}</div>
                                <div className="text-xs">Due: {formatDisplayDate(todo.dueDate)}</div>

                                {project && (
                                    <>
                                        {todo.startDate && project.startDate && new Date(todo.startDate) < new Date(project.startDate) && (
                                            <div style={{ color: 'var(--danger)', marginTop: '4px', fontSize: '0.7rem' }}>
                                                ⚠ Starts before Project ({new Date(project.startDate).toLocaleDateString()})
                                            </div>
                                        )}
                                        {todo.dueDate && project.endDate && new Date(todo.dueDate) > new Date(project.endDate) && (
                                            <div style={{ color: 'var(--danger)', marginTop: '4px', fontSize: '0.7rem' }}>
                                                ⚠ Ends after Project ({new Date(project.endDate).toLocaleDateString()})
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    <h4 className="mb-4">Comments</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                        {comments.length === 0 ? <p className="text-sm text-muted">No comments yet.</p> : (
                            comments.map(c => (
                                <div key={c.id} style={{ marginBottom: '1rem', borderBottom: 'var(--glass-border)', paddingBottom: '0.5rem' }}>
                                    <div className="flex-between text-xs text-muted mb-4">
                                        <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{c.username}</span>
                                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm">{c.text}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <div style={{ position: 'relative' }}>
                        {mentionSuggestions.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: 0,
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--accent-primary)',
                                borderRadius: '8px',
                                padding: '0.5rem',
                                minWidth: '150px',
                                zIndex: 1000,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}>
                                {mentionSuggestions.map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => selectMention(u.username)}
                                        style={{
                                            padding: '0.5rem',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--glass-border)',
                                            fontSize: '0.8rem'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(0, 242, 255, 0.1)'}
                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                    >
                                        @{u.username}
                                    </div>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newComment}
                                onChange={handleCommentChange}
                                placeholder="Add a comment... (@username to mention)"
                            />
                            <button type="submit" className="primary">Post</button>
                        </form>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.onConfirm ? 'Delete' : 'OK'}
            />
        </div>
    );
}

export default TaskDetails;
