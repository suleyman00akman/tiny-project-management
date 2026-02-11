import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

function MemberBrief({ tasks, user, projects, onTaskClick }) {
    const today = new Date().toISOString().split('T')[0];

    const myTasks = useMemo(() => {
        return tasks.filter(t => t.assignedTo === user.username && t.status !== 'Done');
    }, [tasks, user]);

    const dueSoon = useMemo(() => {
        return myTasks.filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate).toISOString().split('T')[0];
            return due <= today; // Due today or overdue
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }, [myTasks, today]);

    const upNext = useMemo(() => {
        return myTasks.filter(t => !dueSoon.includes(t))
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [myTasks, dueSoon]);

    const completedThisWeek = useMemo(() => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return tasks.filter(t =>
            t.assignedTo === user.username &&
            t.status === 'Done' &&
            new Date(t.updatedAt) >= oneWeekAgo
        ).length;
    }, [tasks, user]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Greeting & Quick Stats */}
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        Hello, {user.username}! 👋
                    </h1>
                    <p style={{ opacity: 0.7 }}>Here is your daily brief.</p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{myTasks.length}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Active Tasks</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{completedThisWeek}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Done This Week</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Due Soon / Overdue */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e' }}>
                        🔥 My Focus (Due Soon)
                    </h2>
                    {dueSoon.length === 0 ? (
                        <div style={{ opacity: 0.5, fontStyle: 'italic' }}>No urgent tasks. Great job!</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {dueSoon.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    style={{
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px',
                                        borderLeft: '4px solid #f43f5e',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    className="task-item-hover"
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{task.text}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.6 }}>
                                        <span>Op: {projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'}</span>
                                        <span style={{ color: '#f43f5e' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Up Next */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                        📝 Up Next
                    </h2>
                    {upNext.length === 0 ? (
                        <div style={{ opacity: 0.5, fontStyle: 'italic' }}>You are all caught up!</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {upNext.slice(0, 5).map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    style={{
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px',
                                        borderLeft: '4px solid var(--accent-primary)',
                                        cursor: 'pointer'
                                    }}
                                    className="task-item-hover"
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{task.text}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.6 }}>
                                        <span>{projects.find(p => p.id === task.projectId)?.name}</span>
                                        <span>{task.status}</span>
                                    </div>
                                </div>
                            ))}
                            {upNext.length > 5 && (
                                <div style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>
                                    + {upNext.length - 5} more tasks
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MemberBrief;
