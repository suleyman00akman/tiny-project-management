import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import KanbanView from '../components/KanbanView';
import TaskListTable from '../components/TaskListTable';
import ProjectKanbanCard from '../components/ProjectKanbanCard';
import TaskEditModal from '../components/TaskEditModal';
import Modal from '../components/Modal';

function TasksPage() {
    const { user, apiCall } = useAuth();
    const [projects, setProjects] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [activeView, setActiveView] = useState('list'); // 'list' or 'kanban'

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            // Fetch all projects
            const pRes = await apiCall('/api/projects');
            if (!pRes || !pRes.ok) throw new Error("Failed to fetch projects");
            const projectsData = await pRes.json();

            // Fetch tasks for each project
            const promises = projectsData.map(async p => {
                const tRes = await apiCall(`/api/projects/${p.id}/todos`);
                const todos = tRes && tRes.ok ? await tRes.json() : [];
                return { project: p, todos };
            });

            const results = await Promise.all(promises);

            // Filter projects and tasks based on user role
            const filteredData = filterByPermissions(results);

            setProjects(filteredData.map(r => r.project));
            setAllTasks(filteredData.flatMap(r => r.todos));

        } catch (err) {
            console.error("Fetch Data Error:", err);
        }
    };

    const filterByPermissions = (projectsWithTasks) => {
        // Backend now handles appropriate filtering based on roles.
        // We trust the API to return only what the user is allowed to see.
        return projectsWithTasks;
    };

    const updateTodo = async (todoOrId, updates) => {
        let todoId, data;
        if (typeof todoOrId === 'object' && todoOrId !== null) {
            todoId = todoOrId.id;
            data = todoOrId;
        } else {
            todoId = todoOrId;
            data = updates;
        }

        try {
            const res = await apiCall(`/api/todos/${todoId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            if (res && res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error("Update Todo Error:", err);
        }
    };

    const deleteTodo = async (todoId) => {
        try {
            const res = await apiCall(`/api/todos/${todoId}`, {
                method: 'DELETE'
            });
            if (res && res.ok) {
                fetchData();
                if (selectedTask?.id === todoId) setSelectedTask(null);
            }
        } catch (err) {
            console.error("Delete Todo Error:", err);
        }
    };

    const handleTaskUpdate = (updatedTodo) => {
        if (updatedTodo === null) {
            setSelectedTask(null);
            fetchData();
        } else {
            fetchData();
            setSelectedTask(null);
        }
    };

    // Determine if user should see dual view (list + per-project kanban)
    const showDualView = user.role === 'Super Admin' || user.role === 'Department Manager' || user.role === 'Project Manager';

    // For members, show single kanban with all their tasks
    if (!showDualView) {
        return (
            <div style={{ padding: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="flex-between mb-4">
                        <h2 style={{ margin: 0 }}>My Tasks - Kanban View</h2>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            {allTasks.length} task{allTasks.length !== 1 ? 's' : ''} from {projects.length} project{projects.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    <KanbanView
                        todos={allTasks}
                        updateTodo={updateTodo}
                        deleteTodo={deleteTodo}
                        onViewDetails={(t) => setSelectedTask(t)}
                    />
                </div>

                {selectedTask && (
                    <TaskEditModal
                        todo={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={handleTaskUpdate}
                    />
                )}

                <Modal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                />
            </div>
        );
    }

    // For PM/WP Owner, show dual view
    return (
        <div style={{ padding: '2rem' }}>
            {/* Header with View Toggle */}
            <div className="flex-between mb-4">
                <h1 style={{ margin: 0 }}>
                    {user.role === 'Super Admin' || user.role === 'Department Manager' ? 'All Department Tasks' : 'My Managed Projects'}
                </h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setActiveView('list')}
                        className={activeView === 'list' ? 'btn-add' : 'btn-secondary'}
                        style={{ padding: '0.6rem 1.2rem' }}
                    >
                        📋 List View
                    </button>
                    <button
                        onClick={() => setActiveView('kanban')}
                        className={activeView === 'kanban' ? 'btn-add' : 'btn-secondary'}
                        style={{ padding: '0.6rem 1.2rem' }}
                    >
                        📊 Kanban View
                    </button>
                </div>
            </div>

            {/* Task Statistics */}
            {/* Task Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Total Tasks</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{allTasks.length}</div>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>To Do</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6366f1' }}>
                        {allTasks.filter(t => t.status === 'To Do' || !t.status).length}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>In Progress</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                        {allTasks.filter(t => t.status === 'In Progress').length}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>In Review</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a855f7' }}>
                        {allTasks.filter(t => t.status === 'In Review').length}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Done</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                        {allTasks.filter(t => t.status === 'Done').length}
                    </div>
                </div>
            </div>

            {/* List View */}
            {activeView === 'list' && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Task List</h2>
                    <TaskListTable
                        tasks={allTasks}
                        projects={projects}
                        onTaskClick={(task) => setSelectedTask(task)}
                        onStatusChange={updateTodo}
                        onDelete={deleteTodo}
                    />
                </div>
            )}

            {/* Kanban View - Per Project */}
            {activeView === 'kanban' && (
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Projects Kanban View</h2>
                    {projects.length > 0 ? (
                        projects.map(project => (
                            <ProjectKanbanCard
                                key={project.id}
                                project={project}
                                tasks={allTasks}
                                onTaskMove={updateTodo}
                                onTaskDelete={deleteTodo}
                                onTaskClick={(task) => setSelectedTask(task)}
                            />
                        ))
                    ) : (
                        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
                            No projects found
                        </div>
                    )}
                </div>
            )}

            {selectedTask && (
                <TaskEditModal
                    todo={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleTaskUpdate}
                />
            )}

            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </div>
    );
}

export default TasksPage;
