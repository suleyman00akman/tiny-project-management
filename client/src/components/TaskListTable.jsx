import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

function TaskListTable({ tasks, projects, onTaskClick, onStatusChange, onDelete, readOnly = false }) {
    const { user } = useAuth(); // Keeping for potential future use or consistency

    // --- State for Sorting & Filtering ---
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [filters, setFilters] = useState({
        text: '',
        project: 'All',
        status: 'All',
        assignedTo: 'All'
    });

    const statusOptions = ['To Do', 'In Progress', 'In Review', 'Done'];

    // --- Derived Data for Dropdowns ---
    const uniqueUsers = useMemo(() => {
        if (!tasks) return ['All'];
        const users = new Set(tasks.map(t => t.assignedTo).filter(Boolean));
        return ['All', ...Array.from(users)];
    }, [tasks]);

    const uniqueProjects = useMemo(() => {
        if (!tasks || !projects) return ['All'];
        const uProjects = new Set(tasks.map(t => {
            const p = projects.find(p => p.id === t.projectId);
            return p ? p.name : 'Unknown';
        }));
        return ['All', ...Array.from(uProjects)];
    }, [tasks, projects]);

    // --- Filtering & Sorting Logic ---
    const sortedTasks = useMemo(() => {
        if (!tasks) return [];
        let sortableTasks = [...tasks];

        // 1. FILTERING
        sortableTasks = sortableTasks.filter(task => {
            // Text Search
            if (filters.text && !task.text.toLowerCase().includes(filters.text.toLowerCase())) return false;

            // Project Filter
            if (filters.project !== 'All') {
                const pName = projects.find(p => p.id === task.projectId)?.name || 'Unknown';
                if (pName !== filters.project) return false;
            }

            // Status Filter
            if (filters.status !== 'All') {
                // Handle case where task.status might be undefined/null
                const tStatus = task.status || 'To Do';
                if (tStatus !== filters.status) return false;
            }

            // User Filter
            if (filters.assignedTo !== 'All') {
                const tUser = task.assignedTo || 'Unassigned';
                // If filter is specific user, match. If filter is 'Unassigned', match that too? 
                // For now, let's assume 'All' covers everything.
                // If the dropdown has 'Unassigned' as an option, we can match it.
                // uniqueUsers logic above filters Boolean, so 'Unassigned' might not be in the list as a string.
                // Let's stick to exact match for now.
                if (task.assignedTo !== filters.assignedTo) return false;
            }

            return true;
        });

        // 2. SORTING
        if (sortConfig.key !== null) {
            sortableTasks.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle nested or special keys
                if (sortConfig.key === 'project') {
                    aValue = projects.find(p => p.id === a.projectId)?.name || '';
                    bValue = projects.find(p => p.id === b.projectId)?.name || '';
                }

                // Handle nulls
                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableTasks;
    }, [tasks, sortConfig, filters, projects]);

    // --- Handlers ---
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleStatusChange = async (task, newStatus) => {
        if (onStatusChange) {
            await onStatusChange(task.id, { status: newStatus });
        }
    };

    const handleDelete = async (task) => {
        if (window.confirm(`Are you sure you want to delete task "${task.text}"?`)) {
            if (onDelete) {
                await onDelete(task.id);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Done': return '#10b981';
            case 'In Progress': return '#f59e0b';
            case 'In Review': return '#a855f7';
            case 'To Do': return '#6366f1';
            default: return '#6b7280';
        }
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'var(--text-primary)',
        padding: '0.3rem',
        borderRadius: '4px',
        fontSize: '0.8rem',
        width: '100%',
        marginTop: '0.5rem'
    };

    if (!tasks || tasks.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
                No tasks available.
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '1rem', verticalAlign: 'top' }}>
                            <div onClick={() => requestSort('text')} style={{ cursor: 'pointer', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Task {sortConfig.key === 'text' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={filters.text}
                                onChange={e => setFilters({ ...filters, text: e.target.value })}
                                style={inputStyle}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </th>
                        <th style={{ padding: '1rem', verticalAlign: 'top' }}>
                            <div onClick={() => requestSort('project')} style={{ cursor: 'pointer', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Project {sortConfig.key === 'project' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                            </div>
                            <select
                                value={filters.project}
                                onChange={e => setFilters({ ...filters, project: e.target.value })}
                                style={inputStyle}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {uniqueProjects.map(p => <option key={p} value={p} style={{ background: '#222' }}>{p}</option>)}
                            </select>
                        </th>
                        <th style={{ padding: '1rem', verticalAlign: 'top' }}>
                            <div onClick={() => requestSort('status')} style={{ cursor: 'pointer', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Status {sortConfig.key === 'status' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                            </div>
                            <select
                                value={filters.status}
                                onChange={e => setFilters({ ...filters, status: e.target.value })}
                                style={inputStyle}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="All" style={{ background: '#222' }}>All Statuses</option>
                                {statusOptions.map(s => <option key={s} value={s} style={{ background: '#222' }}>{s}</option>)}
                            </select>
                        </th>
                        <th style={{ padding: '1rem', verticalAlign: 'top' }}>
                            <div onClick={() => requestSort('assignedTo')} style={{ cursor: 'pointer', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Assigned {sortConfig.key === 'assignedTo' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                            </div>
                            <select
                                value={filters.assignedTo}
                                onChange={e => setFilters({ ...filters, assignedTo: e.target.value })}
                                style={inputStyle}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {uniqueUsers.map(u => <option key={u} value={u} style={{ background: '#222' }}>{u}</option>)}
                            </select>
                        </th>
                        {!readOnly && <th style={{ padding: '1rem', verticalAlign: 'top', minWidth: '100px' }}>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedTasks.map(task => (
                        <tr key={task.id} style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            transition: 'background 0.2s',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79, 107, 245, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <td style={{ padding: '1rem' }}>
                                <span
                                    onClick={() => onTaskClick && onTaskClick(task)}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                    className="task-link"
                                >
                                    {task.text}
                                </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                                {projects.find(p => p.id === task.projectId)?.name}
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <select
                                    value={task.status || 'To Do'}
                                    onChange={(e) => !readOnly && handleStatusChange(task, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={readOnly}
                                    style={{
                                        background: 'transparent',
                                        border: `1px solid ${getStatusColor(task.status)}`,
                                        color: getStatusColor(task.status),
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        cursor: readOnly ? 'default' : 'pointer',
                                        opacity: readOnly ? 0.8 : 1
                                    }}
                                >
                                    {statusOptions.map(option => (
                                        <option key={option} value={option} style={{ background: '#222', color: getStatusColor(option) }}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                {task.assignedTo || '-'}
                            </td>
                            {!readOnly && (
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTaskClick && onTaskClick(task);
                                            }}
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="danger small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(task);
                                            }}
                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {sortedTasks.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
                    No tasks found matching filters.
                </div>
            )}
        </div>
    );
}

export default TaskListTable;
