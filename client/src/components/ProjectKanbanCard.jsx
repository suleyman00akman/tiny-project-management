import React, { useState } from 'react';
import KanbanView from './KanbanView';

function ProjectKanbanCard({ project, tasks, onTaskMove, onTaskDelete, onTaskClick }) {
    const [isExpanded, setIsExpanded] = useState(true);

    const projectTasks = tasks.filter(t => t.projectId === project.id);

    return (
        <div className="glass-card" style={{
            marginBottom: '1.5rem',
            overflow: 'hidden',
            border: '1px solid rgba(174, 187, 242, 0.2)'
        }}>
            {/* Project Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '1rem 1.5rem',
                    background: 'rgba(79, 107, 245, 0.1)',
                    borderBottom: isExpanded ? '1px solid rgba(174, 187, 242, 0.2)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79, 107, 245, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(79, 107, 245, 0.1)'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                        fontSize: '1.2rem',
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                        ▶
                    </span>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                            {project.name}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
                            {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', opacity: 0.7 }}>
                    {project.isArchived && (
                        <span className="badge badge-gray">ARCHIVED</span>
                    )}
                    <span>
                        {projectTasks.filter(t => t.status === 'Done').length} / {projectTasks.length} completed
                    </span>
                </div>
            </div>

            {/* Kanban Board */}
            {isExpanded && (
                <div style={{ padding: '1.5rem' }}>
                    {projectTasks.length > 0 ? (
                        <KanbanView
                            todos={projectTasks}
                            updateTodo={onTaskMove}
                            deleteTodo={onTaskDelete}
                            onViewDetails={onTaskClick}
                        />
                    ) : (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center',
                            opacity: 0.5,
                            fontSize: '0.9rem'
                        }}>
                            No tasks in this project
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProjectKanbanCard;
