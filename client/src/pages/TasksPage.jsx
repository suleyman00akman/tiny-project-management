import { useState, useEffect, useRef } from 'react';
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

    // View State
    const [activeView, setActiveView] = useState('list'); // 'list' or 'kanban'
    const [groupBy, setGroupBy] = useState(null); // 'status', 'project', 'assignee'
    const [activeFilter, setActiveFilter] = useState(null); // { type: 'project'|'assignee', value: ... , label: ... }
    const [isDragOver, setIsDragOver] = useState(false);

    const dragCounter = useRef(0);

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
            const filteredData = filterByPermissions(results);

            setProjects(filteredData.map(r => r.project));
            setAllTasks(filteredData.flatMap(r => r.todos));

        } catch (err) {
            console.error("Fetch Data Error:", err);
        }
    };

    const filterByPermissions = (projectsWithTasks) => {
        // Backend handles filtering, we just pass through
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

    // --- Interaction Handlers (Drag & Click) ---

    // Unified Logic
    const applyInteraction = (type, data) => {
        if (type === 'GROUP_OPTION') {
            setGroupBy(data.key);
            if (data.key === 'status') {
                setActiveView('kanban'); // Status grouping = Kanban
            } else {
                setActiveView('list'); // Other groupings (e.g. Project) show as grouped tables for now, or custom views
                // Actually, existing ProjectKanbanCard IS a grouped view by project.
                // Let's reuse 'kanban' mode for custom grouping if possible or add 'grouped' mode.
                // To be consistent with existing logic:
                // If group by 'project', we sort logic below.
            }
            setActiveFilter(null);
        } else if (type === 'FILTER_OPTION') {
            setActiveFilter(data);
            setActiveView('list'); // Default to list for filtered view
            setGroupBy(null);
        } else if (type === 'RESET') {
            resetView();
        }
    };

    const handleDragStart = (e, type, data) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ type, data }));
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const jsonData = e.dataTransfer.getData("application/json");
        if (jsonData) {
            try {
                const { type, data } = JSON.parse(jsonData);
                applyInteraction(type, data);
            } catch (err) {
                console.error("Drop Parse Error", err);
            }
        }
    };

    const resetView = () => {
        setActiveView('list');
        setGroupBy(null);
        setActiveFilter(null);
    };

    // --- Rendering Helpers ---

    const getFilteredTasks = () => {
        let filtered = [...allTasks];
        if (activeFilter) {
            if (activeFilter.type === 'project') {
                filtered = filtered.filter(t => t.projectId === activeFilter.value);
            } else if (activeFilter.type === 'status') {
                filtered = filtered.filter(t => t.status === activeFilter.value);
            }
            // Add Assignee filter if needed later
        }
        return filtered;
    };

    const renderMainContent = () => {
        const displayTasks = getFilteredTasks();

        // Empty State
        if (displayTasks.length === 0) {
            return (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <h3>No tasks found</h3>
                    <button onClick={resetView} style={{ marginTop: '1rem', background: 'var(--accent-primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>Clear Filters</button>
                </div>
            );
        }

        // Group By Logic
        if (groupBy === 'status') {
            // Use existing KanbanView which handles status columns
            return (
                <div className="glass-card" style={{ padding: '1.5rem', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ margin: '0 0 1rem 0' }}>Kanban Board</h2>
                    <KanbanView
                        todos={displayTasks}
                        updateTodo={updateTodo}
                        deleteTodo={deleteTodo}
                        onViewDetails={(t) => setSelectedTask(t)}
                    />
                </div>
            );
        } else if (groupBy === 'project') {
            // Group By Project (Reuse ProjectKanbanCard logic or similar)
            // Existing logic loops projects. We can filter projects that have tasks in displayTasks
            const relevantProjectIds = [...new Set(displayTasks.map(t => t.projectId))];
            const relevantProjects = projects.filter(p => relevantProjectIds.includes(p.id));

            return (
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Active Projects</h2>
                    {relevantProjects.map(project => (
                        <ProjectKanbanCard
                            key={project.id}
                            project={project}
                            tasks={displayTasks} // ProjectKanbanCard filters internally by project.id usually? No, we pass all tasks and it filters? 
                            // Looking at legacy code: <ProjectKanbanCard ... tasks={allTasks} ... />
                            // It likely filters inside. Let's pass filtered displayTasks.
                            onTaskMove={updateTodo}
                            onTaskDelete={deleteTodo}
                            onTaskClick={(task) => setSelectedTask(task)}
                        />
                    ))}
                </div>
            );
        }

        // Default: List / Table View (or if ActiveView explicitly 'list')
        if (activeView === 'list') {
            return (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    {activeFilter && (
                        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>
                            <span style={{ opacity: 0.9, fontWeight: 'bold' }}>Filtering by:</span>
                            <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.3rem 0.8rem', fontSize: '1rem' }}>
                                {activeFilter.label}
                            </span>
                            <button onClick={resetView} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto' }}>✖ Clear Filter</button>
                        </div>
                    )}

                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Task List</h2>
                    <TaskListTable
                        tasks={displayTasks}
                        projects={projects}
                        onTaskClick={(task) => setSelectedTask(task)}
                        onStatusChange={updateTodo}
                        onDelete={deleteTodo}
                        readOnly={false} // Allow editing here
                    />
                </div>
            );
        }

        // Fallback (e.g. viewMode 'kanban' but no groupby?) -> just standard Kanban
        return (
            <div className="glass-card" style={{ padding: '1.5rem', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ margin: '0 0 1rem 0' }}>Kanban Board</h2>
                <KanbanView
                    todos={displayTasks}
                    updateTodo={updateTodo}
                    deleteTodo={deleteTodo}
                    onViewDetails={(t) => setSelectedTask(t)}
                />
            </div>
        );
    };

    // Permission check for "My Tasks" vs "All Tasks"
    const isManager = user.role === 'Super Admin' || user.role === 'Department Manager' || user.role === 'Project Manager';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '88vh', padding: '2rem' }}>
            <div className="flex-between mb-4">
                <div>
                    <h1>{isManager ? 'All Department Tasks' : 'My Tasks'}</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.2rem' }}>Drag options to filter or group tasks</p>
                </div>
                {/* Legacy view toggles removed as per request */}
            </div>

            <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>

                {/* 1. Sidebar */}
                <div className="glass-card" style={{ width: '260px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
                    {/* Reset */}
                    <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'RESET', {})}
                        onClick={() => applyInteraction('RESET', {})}
                        className="card-hover clickable"
                        style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}
                    >
                        🔄 Reset View
                    </div>

                    {/* Grouping */}
                    <div>
                        <h4 style={{ marginBottom: '1rem', opacity: 0.7, fontSize: '0.8rem', letterSpacing: '1px' }}>GROUP BY</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'GROUP_OPTION', { key: 'status', label: 'Status' })}
                                onClick={() => applyInteraction('GROUP_OPTION', { key: 'status', label: 'Status' })}
                                className="card-hover clickable"
                                style={{ padding: '1rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>📊</span>
                                <span>By Status</span>
                            </div>
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'GROUP_OPTION', { key: 'project', label: 'Project' })}
                                onClick={() => applyInteraction('GROUP_OPTION', { key: 'project', label: 'Project' })}
                                className="card-hover clickable"
                                style={{ padding: '1rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>📁</span>
                                <span>By Project</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters: Projects */}
                    <div>
                        <h4 style={{ marginBottom: '1rem', opacity: 0.7, fontSize: '0.8rem', letterSpacing: '1px' }}>PROJECTS (Filter)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {projects.map(p => (
                                <div
                                    key={p.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'FILTER_OPTION', { type: 'project', value: p.id, label: p.name })}
                                    onClick={() => applyInteraction('FILTER_OPTION', { type: 'project', value: p.id, label: p.name })}
                                    className="card-hover clickable"
                                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    {p.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Main Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        flex: 1,
                        border: isDragOver ? '2px dashed var(--accent-primary)' : '2px dashed rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                        background: isDragOver ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', // Important for internal scroll
                        position: 'relative'
                    }}
                >
                    {isDragOver && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.4)', borderRadius: '12px', zIndex: 10,
                            pointerEvents: 'none'
                        }}>
                            <h2 style={{ color: 'var(--accent-primary)', textShadow: '0 2px 10px black' }}>Drop here to update view</h2>
                        </div>
                    )}

                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {renderMainContent()}
                    </div>
                </div>

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

export default TasksPage;
