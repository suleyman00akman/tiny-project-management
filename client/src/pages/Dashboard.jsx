import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import CreateUserModal from '../components/CreateUserModal';
import TaskEditModal from '../components/TaskEditModal';
import TaskListTable from '../components/TaskListTable';
import BigPictureView from '../components/BigPictureView';
import MemberBrief from '../components/MemberBrief';

function Dashboard() {
    const { user, apiCall } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role === 'Member') {
            navigate('/tasks');
        }
    }, [user, navigate]);

    const [projects, setProjects] = useState([]);
    const [showArchived, setShowArchived] = useState(false);
    const [activityLog, setActivityLog] = useState([]);
    const [users, setUsers] = useState([]);
    // Removed editing states for Read-Only Dashboard
    const [selectedTask, setSelectedTask] = useState(null);
    const [projectsWithTasks, setProjectsWithTasks] = useState([]);

    // Generic Modal State for alerts/infos
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        fetchProjects();
        fetchActivity();
        if (user.role === 'Super Admin' || user.role === 'Department Manager') fetchUsers();
    }, [user, showArchived]);

    const fetchActivity = async () => {
        try {
            const res = await apiCall('/api/admin/activity');
            if (res && res.ok) setActivityLog(await res.json());
        } catch (err) { console.error("Failed to fetch activity", err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await apiCall('/api/users');
            if (res && res.ok) setUsers(await res.json());
        } catch (err) { console.error("Failed to fetch users", err); }
    };

    const fetchProjects = async () => {
        try {
            const query = showArchived ? '?archived=true' : '';
            const res = await apiCall(`/api/projects${query}`);
            if (res && res.ok) {
                const data = await res.json();
                setProjects(data);
                // Fetch tasks for each project
                fetchProjectsWithTasks(data);
            }
        } catch (err) {
            console.error("Error fetching projects:", err);
        }
    };

    const fetchProjectsWithTasks = async (projectsList) => {
        try {
            const promises = projectsList.map(async p => {
                const tRes = await apiCall(`/api/projects/${p.id}/todos`);
                const todos = tRes && tRes.ok ? await tRes.json() : [];
                return { ...p, todos };
            });
            const results = await Promise.all(promises);
            setProjectsWithTasks(results);
        } catch (err) {
            console.error("Error fetching tasks:", err);
        }
    };

    const handleTaskUpdate = (updatedTodo) => {
        if (updatedTodo === null) {
            setSelectedTask(null);
            fetchProjects();
        } else {
            fetchProjects();
            setSelectedTask(null);
        }
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
            const res = await fetch(`/api/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                body: JSON.stringify(data)
            });
            if (res.ok) fetchProjects();
        } catch (err) {
            console.error("Update Todo Error:", err);
        }
    };

    const deleteTodo = async (todoId) => {
        try {
            const res = await fetch(`/api/todos/${todoId}`, {
                method: 'DELETE',
                headers: { 'x-user-id': user.id }
            });
            if (res.ok) {
                fetchProjects();
                if (selectedTask?.id === todoId) setSelectedTask(null);
            }
        } catch (err) {
            console.error("Delete Todo Error:", err);
        }
    };

    return (
        <div>
            {/* Context Bar (Organization Header) */}
            <div className="flex-between mb-4" style={{ alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {user.logoUrl ? (
                        <img src={user.logoUrl} alt="Org Logo" style={{ height: '48px', width: '48px', objectFit: 'contain', borderRadius: '8px', background: 'white', padding: '2px' }} />
                    ) : (
                        <div style={{ height: '48px', width: '48px', borderRadius: '8px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                            {user.orgName ? user.orgName.charAt(0).toUpperCase() : 'O'}
                        </div>
                    )}
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{user.orgName || 'Dashboard'}</h1>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7, display: 'flex', gap: '0.8rem', alignItems: 'center', marginTop: '0.2rem' }}>
                            <span style={{
                                background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc',
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600'
                            }}>
                                {user.role.toUpperCase()}
                            </span>
                            {user.departmentId && <span>Department: {user.departmentName || `#${user.departmentId}`}</span>}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="checkbox-wrapper">
                        <input
                            type="checkbox"
                            id="showArchived"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                        />
                        <label htmlFor="showArchived" style={{ color: 'var(--text-secondary)' }}>Show Archived</label>
                    </div>
                </div>
            </div>

            {/* Big Picture View */}
            {projectsWithTasks.length > 0 && (
                <BigPictureView projects={projectsWithTasks} allTasks={projectsWithTasks.flatMap(p => p.todos || [])} />
            )}

            {/* Task Overview Controls */}
            {projectsWithTasks.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 className="mb-3 mt-4">Task Overview</h2>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <TaskListTable
                            tasks={projectsWithTasks.flatMap(p => p.todos || [])}
                            projects={projectsWithTasks}
                            onTaskClick={(task) => setSelectedTask(task)} // Optionally, we can disable click too if needed, but readOnly prop handles inner logic
                            onStatusChange={updateTodo}
                            onDelete={deleteTodo}
                            readOnly={true}
                        />
                    </div>
                </div>
            )}

            {/* Projects Grid */}
            {user.role !== 'Member' && (
                <>
                    <h2 className="mb-3">Projects</h2>
                    <div className="grid-responsive" style={{ marginBottom: '2rem' }}>
                        {projects.map(project => {
                            // Calculate progress from projectsWithTasks to ensure sync
                            const pWithTasks = projectsWithTasks.find(pt => pt.id === project.id);
                            let completed = 0;
                            let total = 0;

                            if (pWithTasks && pWithTasks.todos) {
                                total = pWithTasks.todos.length;
                                completed = pWithTasks.todos.filter(t => t.status === 'Done').length;
                            } else {
                                // Fallback if tasks aren't loaded yet
                                total = project.totalTasks || 0;
                                completed = project.completedTasks || 0;
                            }

                            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                            return (
                                <Link
                                    key={project.id}
                                    to={`/project/${project.id}`}
                                    className="card"
                                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '220px', position: 'relative', opacity: project.isArchived ? 0.6 : 1 }}
                                >
                                    <div>
                                        <div className="flex-between">
                                            <h2 style={{ fontSize: '1.4rem' }}>{project.name}</h2>
                                            {project.isArchived && <span className="badge badge-gray">ARCHIVED</span>}
                                        </div>
                                        <p className="text-sm">Manager: {project.manager?.username || 'Unassigned'}</p>

                                        <div style={{ marginTop: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                                                <span style={{ opacity: 0.7 }}>Progress</span>
                                                <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                                    {percentage}%
                                                </span>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    background: 'var(--accent-primary)',
                                                    boxShadow: '0 0 10px var(--accent-primary)',
                                                    transition: 'width 0.5s ease-out'
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Actions removed for Read-Only Dashboard */}
                                </Link>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Bottom Panels (Team Members & Activity) */}
            <div className="glass-card mb-4" style={{ padding: '1.5rem', marginTop: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {(user.role === 'Super Admin' || user.role === 'Department Manager') && (
                            <div>
                                <h2 className="mb-2" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Team Members</h2>
                                <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {users.map(u => (
                                            <li key={u.id} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                                                <div>
                                                    <span style={{ fontWeight: '600' }}>{u.username}</span>
                                                    <span className="text-xs text-secondary ml-2">({u.role})</span>
                                                </div>
                                                {/* Edit action removed for Read-Only Dashboard */}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                        <div>
                            <h2 className="mb-2" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Department Activity</h2>
                            <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                                {activityLog.length === 0 ? <p className="text-sm text-secondary">No activity recorded.</p> : (
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {activityLog.map(log => (
                                            <li key={log.id} style={{ marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                                <div className="flex-between">
                                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{log.action}</span>
                                                    <span className="text-xs text-secondary">{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm">{log.description}</p>
                                                <p className="text-xs text-secondary">by {log.User ? log.User.username : 'Unknown'}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />

            {/* Confirm Modal removed as actions are removed */}

            {/* CreateUserModal removed as actions are removed */}

            {/* TaskEditModal removed/disabled for Read-Only */}
        </div>
    );
}

export default Dashboard;
