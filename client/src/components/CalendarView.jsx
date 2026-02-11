import React, { useState } from 'react';

function CalendarView({ todos, onViewDetails, updateTodo }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

    // Helper to get Monday of current week
    const getMonday = (d) => {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const calendarWeeks = (() => {
        const weeks = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        if (viewMode === 'month') {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            // Start from the Monday before (or of) 1st
            let start = getMonday(firstDay);
            // End at Sunday after (or of) last day
            let end = new Date(lastDay);
            const endDay = end.getDay();
            if (endDay !== 0) end.setDate(end.getDate() + (7 - endDay));

            let curr = new Date(start);
            while (curr <= end) {
                const weekDays = [];
                for (let i = 0; i < 7; i++) {
                    weekDays.push(new Date(curr));
                    curr.setDate(curr.getDate() + 1);
                }
                weeks.push(weekDays);
            }
        } else {
            // Single week
            const start = getMonday(currentDate);
            const weekDays = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                weekDays.push(d);
            }
            weeks.push(weekDays);
        }
        return weeks;
    })();

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Done': return '#4caf50';
            case 'In Progress': return '#2196f3';
            case 'In Review': return '#ff9800';
            default: return '#9e9e9e'; // To Do
        }
    };

    return (
        <div style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9, fontWeight: 'normal' }}>
                    {viewMode === 'month'
                        ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                        : `Week of ${calendarWeeks[0] ? calendarWeeks[0][0].toLocaleDateString() : ''}`
                    }
                </h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: 'var(--glass-bg)', borderRadius: '8px', padding: '4px', display: 'flex', border: '1px solid var(--glass-border)' }}>
                        <button onClick={() => setViewMode('month')} style={{ background: viewMode === 'month' ? 'var(--accent-primary)' : 'transparent', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Month</button>
                        <button onClick={() => setViewMode('week')} style={{ background: viewMode === 'week' ? 'var(--accent-primary)' : 'transparent', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Week</button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handlePrev} className="btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>&lt;</button>
                        <button onClick={() => setCurrentDate(new Date())} className="btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>Today</button>
                        <button onClick={handleNext} className="btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>&gt;</button>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>
                    <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                </div>

                {calendarWeeks.map((week, weekIdx) => {
                    const weekStart = week[0];
                    const weekEnd = new Date(week[6]);
                    weekEnd.setHours(23, 59, 59, 999);

                    // Filter tasks in this week
                    const weekTasks = todos.filter(t => {
                        const tStart = new Date(t.startDate || t.createdAt);
                        const tEnd = new Date(t.dueDate || t.startDate || t.createdAt);
                        return tStart <= weekEnd && tEnd >= weekStart;
                    });

                    // Sort by length (longer first) to stack better
                    weekTasks.sort((a, b) => {
                        const durA = new Date(a.dueDate || a.startDate) - new Date(a.startDate);
                        const durB = new Date(b.dueDate || b.startDate) - new Date(b.startDate);
                        return durB - durA; // Longest first
                    });

                    // Assign vertical slots to avoid overlap (simple greedy)
                    const slots = []; // Array of end dates for each slot
                    const taskSlots = new Map(); // taskId -> slot index

                    weekTasks.forEach(t => {
                        // Simplify: Just stack them. 
                        // For a perfect calendar, we need slot logic.
                        // Let's try basic slot logic properly.
                        let slot = 0;
                        while (true) {
                            // Check collision with existing in this slot
                            const hasCollision = weekTasks.some(other => {
                                if (taskSlots.get(other.id) !== slot) return false;
                                // Check details if needed, but for row-based, we mainly check if we already placed it?
                                // No, we are iterating. 
                                // We need to check intersection of dates for tasks ALREADY assigned to this slot.
                                // But we are iterating sorted by length.
                                return false;
                            });
                            // Simple naive: just auto-flow. CSS grid/absolute is hard for variable height.
                            // Let's use a day-cell based approach BUT with colspan? 
                            // No, CSS Grid is best for multi-day.
                            break;
                        }
                    });

                    return (
                        <div key={weekIdx} style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gridAutoRows: 'minmax(100px, auto)',
                            gap: '1px',
                            background: 'rgba(255,255,255,0.05)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {/* Day Backgrounds */}
                            {week.map((day, dIdx) => {
                                const isToday = day.toDateString() === new Date().toDateString();
                                return (
                                    <div key={dIdx} style={{
                                        gridColumn: dIdx + 1,
                                        gridRow: '1 / -1', // Span all rows
                                        padding: '5px',
                                        background: isToday ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'transparent',
                                        minHeight: viewMode === 'month' ? '100px' : '300px',
                                        borderRight: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ opacity: 0.5, fontSize: '0.8rem', textAlign: 'right' }}>
                                            {day.getDate()}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Event Bars */}
                            {/* We render them as absolute overlays or grid items within the week container?
                                 Grid items with col-start / col-end is best.
                             */}
                            {weekTasks.map((t, tIdx) => {
                                let startDayIndex = 0;
                                let endDayIndex = 6;

                                const tStart = new Date(t.startDate || t.createdAt);
                                const tEnd = new Date(t.dueDate || t.startDate || t.createdAt);

                                if (tStart > weekStart) {
                                    // Days diff from weekStart
                                    const diff = Math.floor((tStart - weekStart) / (1000 * 60 * 60 * 24));
                                    startDayIndex = Math.max(0, diff);
                                }
                                if (tEnd < weekEnd) {
                                    const diff = Math.floor((tEnd - weekStart) / (1000 * 60 * 60 * 24));
                                    endDayIndex = Math.min(6, diff);
                                }

                                const colStart = startDayIndex + 1;
                                const colSpan = (endDayIndex - startDayIndex) + 1;

                                // Calculate Row to avoid overlap? 
                                // For now let's just stack them in the grid cells using implicit auto-placement 
                                // BUT to make them span properly across grid cells, they need to be direct children of the grid container.
                                // Yes.

                                return (
                                    <div
                                        key={t.id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('taskId', t.id);
                                            e.dataTransfer.setData('taskData', JSON.stringify(t));
                                        }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Get the day index from the drop target
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const dayWidth = rect.width / 7;
                                            const droppedDayIndex = Math.floor(x / dayWidth);

                                            const taskId = parseInt(e.dataTransfer.getData('taskId'));
                                            const taskData = JSON.parse(e.dataTransfer.getData('taskData'));

                                            if (taskId && taskData) {
                                                // Calculate new dates
                                                const newStartDate = new Date(weekStart);
                                                newStartDate.setDate(newStartDate.getDate() + droppedDayIndex);

                                                const duration = tEnd - tStart;
                                                const newDueDate = new Date(newStartDate.getTime() + duration);

                                                // Call updateTodo if available
                                                if (updateTodo) {
                                                    updateTodo(taskId, {
                                                        ...taskData,
                                                        startDate: newStartDate.toISOString(),
                                                        dueDate: newDueDate.toISOString()
                                                    });
                                                }
                                            }
                                        }}
                                        onClick={() => onViewDetails(t)}
                                        style={{
                                            gridColumn: `${colStart} / span ${colSpan}`,
                                            background: getStatusColor(t.status),
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            margin: '2px 4px',
                                            cursor: 'move',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            zIndex: 2,
                                            height: '24px',
                                            alignSelf: 'start', // Stack at top
                                            // We need manual row placement to prevent overlaps visually if we use grid-row.
                                            // Without explicit row, they will stack but might push cell heights differently.
                                            // Let's try simple flow first.
                                        }}
                                        title={`${t.text} (${new Date(t.startDate).toLocaleDateString()} - ${new Date(t.dueDate).toLocaleDateString()})`}
                                    >
                                        {t.text}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CalendarView;
