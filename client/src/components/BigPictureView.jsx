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

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'flex-start' }}>

                {/* Left: Charts Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                    {/* Status Chart */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', paddingTop: '1rem' }}>
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1' }}></div>
                                <span style={{ fontSize: '1rem', opacity: 0.9 }}>To Do ({stats.todo})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                <span style={{ fontSize: '1rem', opacity: 0.9 }}>In Progress ({stats.progress})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a855f7' }}></div>
                                <span style={{ fontSize: '1rem', opacity: 0.9 }}>In Review ({stats.review})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                                <span style={{ fontSize: '1rem', opacity: 0.9 }}>Done ({stats.done})</span>
                            </div>
                        </div>
                    </div>

                    {/* User Distribution Bar Chart */}
                    <div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.8 }}>Team Size per Project</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                            {projects.map(p => {
                                const pTasks = allTasks.filter(t => t.projectId === p.id);
                                const uniqueUsers = new Set(pTasks.map(t => t.assignedTo).filter(Boolean)).size;
                                const maxUsers = Math.max(...projects.map(prj => {
                                    const ts = allTasks.filter(t => t.projectId === prj.id);
                                    return new Set(ts.map(t => t.assignedTo).filter(Boolean)).size;
                                }), 1); // Avoid div by zero
                                const heightObj = (uniqueUsers / maxUsers) * 100;

                                return (
                                    <div key={p.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', width: '30px' }}>
                                        <div style={{
                                            width: '100%',
                                            height: `${heightObj}%`,
                                            background: 'var(--accent-primary)',
                                            borderRadius: '4px 4px 0 0',
                                            opacity: 0.6,
                                            minHeight: '4px',
                                            transition: 'height 0.3s'
                                        }} title={`${p.name}: ${uniqueUsers} users`}></div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>

                {/* Right: Project Health Table */}
                <div style={{ overflowX: 'auto', flex: 1, minWidth: '600px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '1.2rem', opacity: 0.7, fontWeight: 'normal', letterSpacing: '0.5px' }}>PROJECT</th>
                                <th style={{ padding: '1.2rem', opacity: 0.7, fontWeight: 'normal', letterSpacing: '0.5px' }}>TEAM</th>
                                <th style={{ padding: '1.2rem', opacity: 0.7, fontWeight: 'normal', letterSpacing: '0.5px' }}>PROGRESS</th>
                                <th style={{ padding: '1.2rem', opacity: 0.7, fontWeight: 'normal', letterSpacing: '0.5px' }}>STATUS</th>
                                <th style={{ padding: '1.2rem', opacity: 0.7, fontWeight: 'normal', textAlign: 'right', letterSpacing: '0.5px' }}>TASKS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(p => {
                                const pTasks = allTasks.filter(t => t.projectId === p.id);
                                const pTotal = pTasks.length;
                                const pDone = pTasks.filter(t => t.status === 'Done').length;

                                // Calculate Progress based on average of task progress percentages
                                const totalProgressSum = pTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
                                const progress = pTotal > 0 ? Math.round(totalProgressSum / pTotal) : 0;

                                const userCount = new Set(pTasks.map(t => t.assignedTo).filter(Boolean)).size;

                                let statusColor = '#6b7280';
                                let statusText = 'Not Started';
                                if (progress === 100 && pTotal > 0) { statusColor = '#10b981'; statusText = 'Completed'; }
                                else if (progress > 75) { statusColor = '#3b82f6'; statusText = 'On Track'; }
                                else if (progress > 25) { statusColor = '#f59e0b'; statusText = 'In Progress'; }
                                else if (pTotal > 0) { statusColor = '#6366f1'; statusText = 'Just Started'; }

                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'default' }}>
                                        <td style={{ padding: '1.2rem' }}>
                                            <Link to={`/project/${p.id}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: '500', fontSize: '1.05rem', display: 'block' }}>
                                                {p.name}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '1.2rem', opacity: 0.8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1.1rem' }}>👤</span>
                                                {userCount}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem', width: '30%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${progress}%`, height: '100%', background: statusColor, borderRadius: '4px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.9rem', opacity: 0.9, minWidth: '40px', textAlign: 'right' }}>{progress}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '20px',
                                                background: `${statusColor}15`,
                                                color: statusColor,
                                                border: `1px solid ${statusColor}30`,
                                                fontWeight: '500'
                                            }}>
                                                {statusText}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'right', opacity: 0.8, fontSize: '0.95rem' }}>
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
