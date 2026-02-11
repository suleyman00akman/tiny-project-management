import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

function GanttView({ todos = [], updateTodo, deleteTodo, onViewDetails }) {
    const { apiCall } = useAuth();

    // Safety checks
    const safeTodos = Array.isArray(todos) ? todos : [];

    if (safeTodos.length === 0) {
        return <div style={{ textAlign: 'center', opacity: 0.6, marginTop: '2rem' }}>No tasks to show in timeline.</div>;
    }

    // 1. Calculate Date Range
    const { minDate, maxDate, totalDays, dates } = useMemo(() => {
        const allDates = safeTodos.flatMap(t => [
            new Date(t.startDate || t.createdAt),
            new Date(t.dueDate || new Date())
        ]);

        if (allDates.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 1, dates: [] };

        const min = new Date(Math.min(...allDates));
        const max = new Date(Math.max(...allDates));

        // Add buffer
        min.setDate(min.getDate() - 3);
        max.setDate(max.getDate() + 7);

        const days = Math.round((max - min) / (1000 * 60 * 60 * 24));

        // Generate array of dates for header
        const dateArray = [];
        for (let i = 0; i <= days; i++) {
            const d = new Date(min);
            d.setDate(d.getDate() + i);
            dateArray.push(d);
        }

        return { minDate: min, maxDate: max, totalDays: days, dates: dateArray };
    }, [safeTodos]);

    // Helper: Get % position for a date
    const getPos = (dateStr) => {
        const date = new Date(dateStr || new Date());
        const diff = (date - minDate) / (1000 * 60 * 60 * 24);
        return (diff / totalDays) * 100;
    };

    // 2. Sort Todos (Waterfall-ish)
    const sortedTodos = [...safeTodos].sort((a, b) => {
        const startA = new Date(a.startDate || a.createdAt);
        const startB = new Date(b.startDate || b.createdAt);
        return startA - startB;
    });

    const COL_WIDTH = 40;
    const TOTAL_WIDTH = Math.max(dates.length * COL_WIDTH, 100);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Done': return 'var(--success)';
            case 'In Progress': return 'var(--primary)';
            case 'In Review': return 'var(--warning)';
            default: return 'var(--glass-border)'; // To Do
        }
    };

    return (
        <div
            className="gantt-container"
            style={{
                marginTop: '2rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)',
                height: '500px', // Fixed height for scrolling
                display: 'flex',
                flexDirection: 'column',
                userSelect: 'none'
            }}
        >
            <div style={{ overflow: 'auto', position: 'relative', flexGrow: 1 }}>
                <div style={{ width: `${TOTAL_WIDTH}px`, minWidth: '100%', position: 'relative', paddingBottom: '2rem' }}>

                    {/* Date Header (Sticky) */}
                    <div style={{
                        display: 'flex',
                        height: '40px',
                        borderBottom: '1px solid var(--glass-border)',
                        background: 'rgba(30, 30, 40, 0.95)', // Darker background for legibility
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        backdropFilter: 'blur(10px)'
                    }}>
                        {dates.map((d, i) => {
                            const isToday = new Date().toDateString() === d.toDateString();
                            return (
                                <div key={i} style={{
                                    width: `${COL_WIDTH}px`,
                                    flexShrink: 0,
                                    borderRight: '1px solid rgba(255,255,255,0.05)',
                                    fontSize: '0.7rem',
                                    color: isToday ? 'var(--accent-primary)' : 'rgba(255,255,255,0.6)',
                                    background: isToday ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'transparent',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: isToday ? 'bold' : 'normal'
                                }}>
                                    <span>{d.getDate()}</span>
                                    <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{d.toLocaleString('default', { month: 'short' })}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Task Rows */}
                    <div style={{ paddingTop: '10px' }}>
                        {/* Today Marker Line */}
                        {dates.map((d, i) => {
                            if (new Date().toDateString() === d.toDateString()) {
                                return (
                                    <div key="today-line" style={{
                                        position: 'absolute',
                                        left: `${i * COL_WIDTH + (COL_WIDTH / 2)}px`,
                                        top: 40,
                                        bottom: 0,
                                        width: '2px',
                                        background: 'var(--accent-primary)',
                                        opacity: 0.5,
                                        zIndex: 1
                                    }} />
                                );
                            }
                            return null;
                        })}

                        {sortedTodos.map((todo) => {
                            const startStr = todo.startDate || todo.createdAt;
                            const endStr = todo.dueDate || todo.startDate || todo.createdAt;

                            // Re-calculate positions based on pixels for better alignment
                            const startDate = new Date(startStr);
                            const endDate = new Date(endStr);

                            const daysFromMin = (startDate - minDate) / (1000 * 60 * 60 * 24);
                            const duration = Math.max((endDate - startDate) / (1000 * 60 * 60 * 24), 1);

                            const leftPx = daysFromMin * COL_WIDTH;
                            const widthPx = duration * COL_WIDTH;

                            return (
                                <div key={todo.id} style={{
                                    height: '60px',
                                    position: 'relative',
                                    borderBottom: '1px solid rgba(255,255,255,0.02)'
                                }}>
                                    {/* Grid Lines (Background) */}
                                    {dates.map((d, i) => (
                                        <div key={i} style={{
                                            position: 'absolute',
                                            left: `${i * COL_WIDTH}px`,
                                            top: 0,
                                            bottom: 0,
                                            width: '1px',
                                            background: 'rgba(255,255,255,0.02)'
                                        }} />
                                    ))}

                                    {/* Bar Wrapper */}
                                    <div
                                        className="gantt-bar-wrapper"
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('taskId', todo.id);
                                            e.dataTransfer.setData('taskData', JSON.stringify(todo));
                                            e.dataTransfer.setData('startPx', leftPx);
                                        }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();

                                            const taskId = parseInt(e.dataTransfer.getData('taskId'));
                                            const taskData = JSON.parse(e.dataTransfer.getData('taskData'));
                                            const originalStartPx = parseFloat(e.dataTransfer.getData('startPx'));

                                            if (taskId && taskData) {
                                                // Calculate the drop position
                                                const container = e.currentTarget.closest('.gantt-container');
                                                const rect = container.getBoundingClientRect();
                                                const scrollLeft = container.querySelector('[style*="overflow: auto"]').scrollLeft;
                                                const dropX = e.clientX - rect.left + scrollLeft;

                                                // Calculate day offset
                                                const dayOffset = Math.round((dropX - originalStartPx) / COL_WIDTH);

                                                if (dayOffset !== 0) {
                                                    const newStartDate = new Date(startDate);
                                                    newStartDate.setDate(newStartDate.getDate() + dayOffset);

                                                    const newEndDate = new Date(endDate);
                                                    newEndDate.setDate(newEndDate.getDate() + dayOffset);

                                                    // Call updateTodo if available
                                                    if (updateTodo) {
                                                        updateTodo(taskId, {
                                                            ...taskData,
                                                            startDate: newStartDate.toISOString(),
                                                            dueDate: newEndDate.toISOString()
                                                        });
                                                    }
                                                }
                                            }
                                        }}
                                        style={{
                                            position: 'absolute',
                                            left: `${leftPx}px`,
                                            width: `${widthPx}px`,
                                            top: '12px',
                                            height: '26px',
                                            zIndex: 5
                                        }}
                                    >
                                        <div
                                            className="gantt-bar clickable"
                                            onClick={() => onViewDetails(todo)}
                                            style={{
                                                width: '100%', height: '100%',
                                                background: `linear-gradient(135deg, ${getStatusColor(todo.status)} 0%, rgba(255,255,255,0.1) 100%)`,
                                                backgroundColor: getStatusColor(todo.status),
                                                borderRadius: '13px',
                                                padding: '0 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                cursor: 'move',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}

                                            title={`${todo.text} (${new Date(startStr).toLocaleDateString()} -> ${new Date(endStr).toLocaleDateString()})`}
                                        >
                                            {todo.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GanttView;
