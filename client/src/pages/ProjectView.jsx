import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import CalendarView from '../components/CalendarView';
import GanttView from '../components/GanttView';
import KanbanView from '../components/KanbanView';
import TaskEditModal from '../components/TaskEditModal';
import EditProjectModal from '../components/EditProjectModal';
import Modal from '../components/Modal';
import ErrorBoundary from '../components/ErrorBoundary';

const API_Base = "";

function ProjectView() {
    const { id } = useParams();
    const { user, apiCall } = useAuth();
    const [todos, setTodos] = useState([]);
    const [project, setProject] = useState(null);
    const [groupBy, setGroupBy] = useState('none');
    const [viewMode, setViewMode] = useState('list');
    const [selectedTodo, setSelectedTodo] = useState(null);
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, todoId: null });

    useEffect(() => {
        if (user) {
            fetchProject();
            fetchTodos();
        }
    }, [id, user]);

    const fetchProject = async () => {
        const res = await apiCall(`${API_Base}/api/projects/${id}`);
        if (res && res.ok) setProject(await res.json());
    };

    const fetchTodos = async () => {
        const res = await apiCall(`${API_Base}/api/projects/${id}/todos`);
        if (res && res.ok) setTodos(await res.json());
    };



    const calculateProgress = () => {
        if (!todos.length) return 0;
        const total = todos.reduce((acc, t) => {
            return acc + (t.progress || 0);
        }, 0);
        return Math.round(total / todos.length);
    };

    const projectProgress = calculateProgress();

    const addTodo = async (text, assignedTo, dueDate) => {
        const res = await apiCall(`${API_Base}/api/projects/${id}/todos`, {
            method: 'POST',
            body: JSON.stringify({ text, assignedTo, dueDate })
        });
        if (res && res.ok) setTodos([...todos, await res.json()]);
    };

    const updateTodo = async (todoId, updates) => {
        const res = await apiCall(`${API_Base}/api/todos/${todoId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        if (res && res.ok) {
            const data = await res.json();
            setTodos(todos.map(todo => todo.id === todoId ? data : todo));
        }
    };

    const handleDeleteClick = (todoId) => {
        setDeleteModal({ isOpen: true, todoId });
    };

    const confirmDeleteTodo = async () => {
        const { todoId } = deleteModal;
        if (!todoId) return;

        const res = await apiCall(`${API_Base}/api/todos/${todoId}`, {
            method: 'DELETE'
        });
        if (res && res.ok) {
            setTodos(todos.filter(todo => todo.id !== todoId));
        }
        setDeleteModal({ isOpen: false, todoId: null });
    };

    const handleTaskUpdate = (updatedTodo) => {
        if (updatedTodo === null) {
            // Task was deleted
            setSelectedTaskForModal(null);
            fetchTodos();
        } else {
            // Task was updated
            fetchTodos();
            setSelectedTaskForModal(null);
        }
    };

    const isManager = (project && user && project.Members && project.Members.find(m => m.id === user.id)?.ProjectMembers?.role === 'Manager') || (project && user && project.managerId === user.id);

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <Link to="/" className="nav-link" style={{ display: 'inline-flex', padding: 0 }}>← Back to Dashboard</Link>
            </div>

            <div className="glass-card mb-4" style={{ padding: '2rem' }}>
                <div className="flex-between">
                    <h1>{project ? project.name : 'Loading...'}</h1>
                    {isManager && (
                        <button onClick={() => setIsEditingProject(true)} style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>
                            <span>✎</span> Edit Project
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{
                        flexGrow: 1,
                        height: '10px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '99px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${projectProgress}%`,
                            height: '100%',
                            background: 'var(--gradient-primary)',
                            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <span style={{ fontSize: '0.9em', fontWeight: '600', color: 'var(--accent-primary)' }}>{projectProgress}% Overall Progress</span>
                </div>
            </div>

            <div className="controls-bar glass-card flex-between" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="text-sm" style={{ opacity: 0.7 }}>View:</span>
                        <div className="group-buttons">
                            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
                            <button className={viewMode === 'kanban' ? 'active' : ''} onClick={() => setViewMode('kanban')}>Kanban</button>
                            <button className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}>Calendar</button>
                            <button className={viewMode === 'gantt' ? 'active' : ''} onClick={() => setViewMode('gantt')}>Gantt</button>
                        </div>
                    </div>

                    {viewMode === 'list' && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)' }}></div>
                            <span className="text-sm" style={{ opacity: 0.7 }}>Group:</span>
                            <div className="group-buttons">
                                <button className={groupBy === 'none' ? 'active' : ''} onClick={() => setGroupBy('none')}>None</button>
                                <button className={groupBy === 'assignedTo' ? 'active' : ''} onClick={() => setGroupBy('assignedTo')}>Person</button>
                                <button className={groupBy === 'status' ? 'active' : ''} onClick={() => setGroupBy('status')}>Status</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-between mb-4">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{todos.length} Tasks</span>
                </div>
            </div>

            {viewMode === 'list' ? (
                <ErrorBoundary key="list">
                    <TodoList
                        todos={todos}
                        updateTodo={updateTodo}
                        deleteTodo={handleDeleteClick}
                        groupBy={groupBy}
                        onViewDetails={(todo) => setSelectedTaskForModal({ ...todo, projectId: id, projectName: project?.name })}
                        allowInlineEdit={false}
                    />
                </ErrorBoundary>
            ) : viewMode === 'kanban' ? (
                <ErrorBoundary key="kanban">
                    <KanbanView
                        todos={todos}
                        updateTodo={updateTodo}
                        deleteTodo={handleDeleteClick}
                        onViewDetails={(todo) => setSelectedTaskForModal({ ...todo, projectId: id, projectName: project?.name })}
                    />
                </ErrorBoundary>
            ) : viewMode === 'calendar' ? (
                <ErrorBoundary key="calendar">
                    <CalendarView
                        todos={todos}
                        updateTodo={updateTodo}
                        onViewDetails={(todo) => setSelectedTaskForModal({ ...todo, projectId: id, projectName: project?.name })}
                    />
                </ErrorBoundary>
            ) : (
                <ErrorBoundary key="gantt">
                    <GanttView
                        todos={todos}
                        updateTodo={updateTodo}
                        deleteTodo={handleDeleteClick}
                        onViewDetails={(todo) => setSelectedTaskForModal({ ...todo, projectId: id, projectName: project?.name })}
                    />
                </ErrorBoundary>
            )}

            {selectedTaskForModal && (
                <TaskEditModal
                    todo={selectedTaskForModal}
                    onClose={() => setSelectedTaskForModal(null)}
                    onUpdate={handleTaskUpdate}
                />
            )}

            {isEditingProject && project && (
                <EditProjectModal
                    project={project}
                    onClose={() => setIsEditingProject(false)}
                    onUpdate={(updated) => setProject(updated)}
                />
            )}

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, todoId: null })}
                onConfirm={confirmDeleteTodo}
                title="Delete Task?"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete Task"
                type="danger"
            />
        </div>
    );
}

export default ProjectView;
