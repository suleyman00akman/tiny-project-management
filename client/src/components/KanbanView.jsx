import { useState, useEffect } from 'react';

function KanbanView({ todos, updateTodo, deleteTodo, onViewDetails }) {
    const [columns, setColumns] = useState({
        'To Do': [],
        'In Progress': [],
        'In Review': [],
        'Done': []
    });

    useEffect(() => {
        const newColumns = {
            'To Do': [],
            'In Progress': [],
            'In Review': [],
            'Done': []
        };

        todos.forEach(todo => {
            // Normalize status to match columns, default to 'To Do' if unknown
            const status = todo.status || 'To Do';
            if (newColumns[status]) {
                newColumns[status].push(todo);
            } else {
                newColumns['To Do'].push(todo);
            }
        });

        setColumns(newColumns);
    }, [todos]);

    const handleDragStart = (e, todoId) => {
        e.dataTransfer.setData('todoId', todoId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        const todoId = parseInt(e.dataTransfer.getData('todoId'), 10);
        if (!todoId) return;

        // Optimistic update
        const todo = todos.find(t => t.id === todoId);
        if (todo && todo.status !== targetStatus) {
            updateTodo(todo.id, { status: targetStatus });
        }
    };

    return (
        <div style={{ display: 'flex', gap: '1rem', height: '100%', minHeight: '400px', alignItems: 'stretch', overflowX: 'auto' }}>
            {Object.keys(columns).map(status => (
                <div
                    key={status}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className="kanban-column"
                    style={{
                        flex: 1,
                        minWidth: '200px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <h3 style={{
                        fontSize: '1rem',
                        marginBottom: '1rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        {status}
                        <span style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem'
                        }}>
                            {columns[status].length}
                        </span>
                    </h3>

                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {columns[status].map(todo => (
                            <div
                                key={todo.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, todo.id)}
                                onClick={() => onViewDetails(todo)}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--glass-border)',
                                    borderLeft: `4px solid ${status === 'Done' ? 'var(--accent-success)' :
                                        status === 'In Progress' ? 'var(--accent-primary)' :
                                            status === 'In Review' ? 'var(--accent-purple)' :
                                                'var(--text-muted)'
                                        }`,
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ padding: '0.75rem' }}>
                                    <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{todo.text}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                        {todo.assignedTo && (
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                backgroundColor: 'rgba(174, 187, 242, 0.2)',
                                                borderRadius: '4px',
                                                color: '#aebbf2'
                                            }}>
                                                @{todo.assignedTo}
                                            </span>
                                        )}
                                        {todo.dueDate && (
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                backgroundColor: 'rgba(255, 200, 100, 0.2)',
                                                borderRadius: '4px',
                                                color: '#ffc864'
                                            }}>
                                                📅 {new Date(todo.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {columns[status].length === 0 && (
                            <div style={{
                                padding: '2rem',
                                textAlign: 'center',
                                border: '2px dashed var(--glass-border)',
                                borderRadius: '8px',
                                opacity: 0.3,
                                userSelect: 'none'
                            }}>
                                Drop here
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default KanbanView;
