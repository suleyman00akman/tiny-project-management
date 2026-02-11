import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function TodoItem({ todo, updateTodo, deleteTodo, onViewDetails, allowInlineEdit = true }) {
    const { user, apiCall } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(todo.text);
    const [editAssignedTo, setEditAssignedTo] = useState(todo.assignedTo || '');
    const [editDueDate, setEditDueDate] = useState(todo.dueDate ? todo.dueDate.split('T')[0] : '');
    const [projectMembers, setProjectMembers] = useState([]);

    useEffect(() => {
        if (isEditing && projectMembers.length === 0) {
            // Fetch project members if we don't have them
            apiCall(`/api/projects/${todo.projectId}`)
                .then(res => res && res.ok ? res.json() : null)
                .then(data => {
                    if (data && data.Members) {
                        setProjectMembers(data.Members);
                    }
                });
        }
    }, [isEditing, todo.projectId, apiCall, projectMembers.length]);

    const handleSave = () => {
        updateTodo(todo.id, {
            text: editText,
            assignedTo: editAssignedTo,
            dueDate: editDueDate || null
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditText(todo.text);
        setEditAssignedTo(todo.assignedTo || '');
        setEditDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '');
        setIsEditing(false);
    };

    const statusColors = {
        'To Do': 'transparent',
        'In Progress': 'rgba(255, 193, 7, 0.1)',
        'Done': 'rgba(76, 175, 80, 0.1)'
    };

    const borderColors = {
        'To Do': 'rgba(255,255,255,0.1)',
        'In Progress': '#ffc107',
        'Done': '#4caf50'
    };

    const canEdit = user.role === 'Admin' || user.role === 'Manager' || todo.assignedTo === user.username || user.username === 'admin';
    const canInlineEdit = canEdit && allowInlineEdit;


    return (
        <li
            className="todo-item"
            style={{
                background: statusColors[todo.status] || statusColors['To Do'],
                borderColor: borderColors[todo.status] || borderColors['To Do']
            }}
        >
            <div className="todo-content">
                <div className="todo-header" style={{ flexGrow: 1 }}>
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                            <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--accent-primary)',
                                    borderRadius: '4px',
                                    padding: '0.4rem',
                                    width: '100%'
                                }}
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select
                                    value={editAssignedTo}
                                    onChange={(e) => setEditAssignedTo(e.target.value)}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '4px',
                                        padding: '0.2rem 0.4rem',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    <option value="">No Assignee</option>
                                    {projectMembers.map(m => (
                                        <option key={m.id} value={m.username} style={{ background: 'var(--bg-secondary)' }}>@{m.username}</option>
                                    ))}
                                </select>
                                <input
                                    type="date"
                                    value={editDueDate}
                                    onChange={(e) => setEditDueDate(e.target.value)}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '4px',
                                        padding: '0.2rem 0.4rem',
                                        fontSize: '0.8rem'
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span
                                className="todo-text"
                                onClick={() => {
                                    if (canInlineEdit) {
                                        setIsEditing(true);
                                    } else if (onViewDetails) {
                                        onViewDetails(todo);
                                    }
                                }}
                                style={{
                                    cursor: (canInlineEdit || onViewDetails) ? 'pointer' : 'default',
                                    fontSize: '1rem',
                                    fontWeight: '500'
                                }}
                            >
                                {todo.text}
                            </span>
                            {todo.assignedTo && <span className="assignee-badge" style={{ background: 'rgba(79, 107, 245, 0.2)', color: 'var(--accent-primary)', border: '1px solid rgba(79, 107, 245, 0.3)' }}>@{todo.assignedTo}</span>}
                            {todo.dueDate && <span className="due-date-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>📅 {new Date(todo.dueDate).toLocaleDateString()}</span>}
                            {canInlineEdit && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    style={{ background: 'transparent', border: 'none', opacity: 0.5, cursor: 'pointer', padding: '0 4px' }}
                                    title="Edit Inline"
                                >
                                    ✎
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="todo-controls">
                    <select
                        value={todo.status || 'To Do'}
                        onChange={(e) => updateTodo(todo.id, { status: e.target.value })}
                        className="status-select"
                        style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            padding: '0.2rem 0.5rem'
                        }}
                    >
                        <option value="To Do" style={{ background: 'var(--bg-secondary)' }}>To Do</option>
                        <option value="In Progress" style={{ background: 'var(--bg-secondary)' }}>In Progress</option>
                        <option value="Done" style={{ background: 'var(--bg-secondary)' }}>Done</option>
                    </select>

                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={todo.progress || 0}
                        onChange={(e) => updateTodo(todo.id, { progress: parseInt(e.target.value) })}
                        className="progress-slider"
                    />
                    <span className="progress-value">{todo.progress || 0}%</span>

                    {onViewDetails && (
                        <button
                            onClick={() => onViewDetails(todo)}
                            style={{ background: 'transparent', border: 'none', color: '#aebbf2', fontSize: '0.9em', cursor: 'pointer', marginLeft: '0.5rem' }}
                            title="Comments & Details"
                        >
                            💬
                        </button>
                    )}

                    {isEditing && (
                        <div style={{ display: 'flex', gap: '0.3rem', marginLeft: '0.5rem' }}>
                            <button onClick={handleSave} className="small" style={{ background: 'var(--accent-success)', color: 'white', padding: '2px 8px' }}>Save</button>
                            <button onClick={handleCancel} className="small secondary" style={{ padding: '2px 8px' }}>Cancel</button>
                        </div>
                    )}
                </div>
            </div>

            <button className="btn-delete" onClick={() => deleteTodo(todo.id)}>
                Delete
            </button>
        </li>
    );
}

export default TodoItem;
