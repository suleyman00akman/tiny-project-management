import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function SimpleTaskItem({ todo, updateTodo, deleteTodo, onViewDetails, allowInlineEdit = true }) {
    const { user, apiCall } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(todo.text);
    const [editAssignee, setEditAssignee] = useState(todo.assignee || '');
    const [editDueDate, setEditDueDate] = useState(todo.dueDate || '');
    const [allUsers, setAllUsers] = useState([]);

    // Check if user can edit this task
    const canEdit = user && allowInlineEdit && (
        user.isDepartmentManager ||
        user.isSuperAdmin ||
        user.role === 'Admin' ||
        user.role === 'Manager' ||
        (user.role === 'Member' && todo.assignee === user.username)
    );

    // Fetch users for assignee dropdown when entering edit mode
    const handleEnterEditMode = async (e) => {
        e.stopPropagation(); // Prevent event bubbling

        if (!canEdit) return;

        // Fetch users for dropdown
        try {
            const response = await apiCall('/api/users');
            if (response && response.ok) {
                const users = await response.json();
                setAllUsers(users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }

        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.stopPropagation();

        const updatedTodo = {
            ...todo,
            text: editText,
            assignee: editAssignee || null,
            dueDate: editDueDate || null
        };

        await updateTodo(updatedTodo);
        setIsEditing(false);
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        setEditText(todo.text);
        setEditAssignee(todo.assignee || '');
        setEditDueDate(todo.dueDate || '');
        setIsEditing(false);
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm('Delete this task?')) {
            await deleteTodo(todo.id);
        }
    };

    const handleViewDetails = (e) => {
        e.stopPropagation();
        if (onViewDetails) {
            onViewDetails(todo);
        }
    };

    const handleStatusChange = async (e) => {
        e.stopPropagation();
        const newStatus = e.target.value;
        await updateTodo({ ...todo, status: newStatus });
    };

    return (
        <li
            style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                backgroundColor: isEditing ? 'rgba(30, 33, 43, 0.95)' : 'transparent',
                transition: 'background-color 0.2s',
                borderRadius: '8px',
                position: 'relative'
            }}
        >
            {/* Checkbox */}
            <input
                type="checkbox"
                checked={todo.status === 'Done'}
                onChange={(e) => {
                    e.stopPropagation();
                    updateTodo({ ...todo, status: e.target.checked ? 'Done' : 'To Do' });
                }}
                style={{ cursor: 'pointer' }}
            />

            {/* Task Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isEditing ? (
                    // EDIT MODE - Improved Styling
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.8rem',
                        background: 'var(--bg-secondary)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--accent-primary)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        zIndex: 10
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>EDIT TASK</span>
                        </div>

                        {/* Task Text Input */}
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            style={{
                                padding: '0.6rem',
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '1rem',
                                width: '100%',
                                outline: 'none'
                            }}
                            autoFocus
                            placeholder="Task description..."
                        />

                        {/* Assignee and Due Date */}
                        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Assignee</label>
                                <select
                                    value={editAssignee}
                                    onChange={(e) => setEditAssignee(e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '4px',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        width: '100%'
                                    }}
                                >
                                    <option value="">No assignee</option>
                                    {allUsers.map(u => (
                                        <option key={u.id} value={u.username}>{u.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Due Date</label>
                                <input
                                    type="date"
                                    value={editDueDate}
                                    onChange={(e) => setEditDueDate(e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '4px',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        width: '100%'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Save/Cancel Buttons */}
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleCancel}
                                style={{
                                    padding: '0.5rem 1.2rem',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    backgroundColor: 'var(--accent-primary)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    boxShadow: '0 2px 8px rgba(79, 107, 245, 0.4)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                ) : (
                    // VIEW MODE
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Task Text - Click to edit */}
                        <span
                            onClick={handleEnterEditMode}
                            style={{
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: canEdit ? 'pointer' : 'default',
                                textDecoration: todo.status === 'Done' ? 'line-through' : 'none',
                                opacity: todo.status === 'Done' ? 0.6 : 1,
                                color: canEdit ? '#aebbf2' : '#fff'
                            }}
                            title={canEdit ? 'Click to edit' : ''}
                        >
                            {todo.text}
                        </span>

                        {/* Edit Icon */}
                        {canEdit && (
                            <button
                                onClick={handleEnterEditMode}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#aebbf2',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: '0 4px',
                                    opacity: 0.6
                                }}
                                title="Edit"
                            >
                                ✎
                            </button>
                        )}

                        {/* Assignee Badge */}
                        {todo.assignee && (
                            <span style={{
                                padding: '0.2rem 0.5rem',
                                backgroundColor: 'rgba(174, 187, 242, 0.2)',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                color: '#aebbf2'
                            }}>
                                @{todo.assignee}
                            </span>
                        )}

                        {/* Due Date Badge */}
                        {todo.dueDate && (
                            <span style={{
                                padding: '0.2rem 0.5rem',
                                backgroundColor: 'rgba(255, 200, 100, 0.2)',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                color: '#ffc864'
                            }}>
                                📅 {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Status Dropdown */}
            {!isEditing && (
                <select
                    value={todo.status}
                    onChange={handleStatusChange}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        padding: '0.4rem',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(174, 187, 242, 0.3)',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                </select>
            )}

            {/* Comment Button */}
            {!isEditing && onViewDetails && (
                <button
                    onClick={handleViewDetails}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#aebbf2',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        padding: '0 0.5rem'
                    }}
                    title="Comments & Details"
                >
                    💬
                </button>
            )}

            {/* Delete Button */}
            {!isEditing && canEdit && (
                <button
                    onClick={handleDelete}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff6b6b',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        padding: '0 0.5rem',
                        opacity: 0.6
                    }}
                    title="Delete"
                >
                    🗑️
                </button>
            )}
        </li>
    );
}

export default SimpleTaskItem;
