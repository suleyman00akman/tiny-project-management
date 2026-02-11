import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

function BigPictureView({ projects, allTasks }) {

    // Stats Computation
    const stats = useMemo(() => {
        const total = allTasks.length;
        if (total === 0) return { total: 0, todo: 0, progress: 0, review: 0, done: 0 };

        return {
            total,
            todo: allTasks.filter(t => t.status === 'To Do').length,
            progress: allTasks.filter(t => t.status === 'In Progress').length,
            review: allTasks.filter(t => t.status === 'In Review').length,
            done: allTasks.filter(t => t.status === 'Done').length
        };
    }, [allTasks]);

    // Calculate percentages for the chart
    const percentages = useMemo(() => {
        if (stats.total === 0) return { todo: 0, progress: 0, review: 0, done: 0 };
        return {
            todo: (stats.todo / stats.total) * 100,
            progress: (stats.progress / stats.total) * 100,
            review: (stats.review / stats.total) * 100,
            done: (stats.done / stats.total) * 100
        };
    }, [stats]);

    // Conic Gradient for Pie Chart
    const pieChartStyle = {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: `conic-gradient(
            #6366f1 0% ${percentages.todo}%, 
            #f59e0b ${percentages.todo}% ${percentages.todo + percentages.progress}%, 
            #a855f7 ${percentages.todo + percentages.progress}% ${percentages.todo + percentages.progress + percentages.review}%, 
            #10b981 ${percentages.todo + percentages.progress + percentages.review}% 100%
        )`,
        position: 'relative',
        boxShadow: '0 0 20px rgba(0,0,0,0.3)',
        transition: 'all 0.5s ease'
    };

    return (
        <div className="glass-card mb-4" style={{ padding: '2rem', background: 'linear-gradient(145deg, rgba(20,20,35,0.6), rgba(30,30,50,0.4))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Big Picture
                    </h2>
                    <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>
                        Department Overview & Health
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>{projects.length}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Active Projects</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'center' }}>

                {/* Left: Status Distribution Chart */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={pieChartStyle}>
                        {/* Inner circle for Donut effect */}
                        <div style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '70%', height: '70%',
                            background: 'var(--bg-secondary)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column'
                        }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.total}</span>
                            <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>TASKS</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1' }}></div>
                            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>To Do ({stats.todo})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></div>
                            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>In Progress ({stats.progress})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a855f7' }}></div>
                            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>In Review ({stats.review})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Done ({stats.done})</span>
                        </div>
                    </div>
                </div>

                {/* Right: Project Health Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', opacity: 0.6, fontWeight: 'normal' }}>PROJECT</th>
                                <th style={{ padding: '1rem', opacity: 0.6, fontWeight: 'normal' }}>PROGRESS</th>
                                <th style={{ padding: '1rem', opacity: 0.6, fontWeight: 'normal' }}>STATUS</th>
                                <th style={{ padding: '1rem', opacity: 0.6, fontWeight: 'normal', textAlign: 'right' }}>TASKS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(p => {
                                const pTasks = allTasks.filter(t => t.projectId === p.id);
                                const pTotal = pTasks.length;
                                const pDone = pTasks.filter(t => t.status === 'Done').length;
                                const progress = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

                                let statusColor = '#6b7280';
                                let statusText = 'Not Started';
                                if (progress === 100 && pTotal > 0) { statusColor = '#10b981'; statusText = 'Completed'; }
                                else if (progress > 75) { statusColor = '#3b82f6'; statusText = 'On Track'; }
                                else if (progress > 25) { statusColor = '#f59e0b'; statusText = 'In Progress'; }
                                else if (pTotal > 0) { statusColor = '#6366f1'; statusText = 'Just Started'; }

                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <Link to={`/project/${p.id}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: '500' }}>
                                                {p.name}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '1rem', width: '30%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${progress}%`, height: '100%', background: statusColor, borderRadius: '3px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', opacity: 0.8, minWidth: '35px' }}>{progress}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '12px',
                                                background: `${statusColor}20`,
                                                color: statusColor,
                                                border: `1px solid ${statusColor}40`
                                            }}>
                                                {statusText}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', opacity: 0.7 }}>
                                            {pDone} / {pTotal}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default BigPictureView;
