import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateUserModal from '../components/CreateUserModal';
import Modal from '../components/Modal';

function TeamPage() {
    const { user, apiCall } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Data State
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);

    // View State
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'grouped'
    const [groupBy, setGroupBy] = useState(null); // 'department', 'project'
    const [activeFilter, setActiveFilter] = useState(null); // { type: 'department'|'project', id: ... , name: ... }
    const [isDragOver, setIsDragOver] = useState(false);

    const [isManagingMembers, setIsManagingMembers] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        if (user) {
            fetchUsers();
            fetchProjects();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            const res = await apiCall('/api/organization/users');
            if (res && res.ok) setUsers(await res.json());
        } catch (err) { console.error("Failed to fetch users", err); }
    };

    const fetchProjects = async () => {
        try {
            const res = await apiCall('/api/projects');
            if (res && res.ok) setProjects(await res.json());
        } catch (err) { console.error("Failed to fetch projects"); }
    };

    // --- Drag and Drop Handlers ---

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
            const { type, data } = JSON.parse(jsonData);

            if (type === 'GROUP_OPTION') {
                setGroupBy(data.key); // 'department' or 'project'
                setViewMode('grouped');
                setActiveFilter(null); // Clear specific filters when switching to group mode
            } else if (type === 'FILTER_OPTION') {
                setActiveFilter(data); // { type: 'department', id: 1, name: 'Marketing' }
                setViewMode('grid');
                setGroupBy(null);
            } else if (type === 'RESET') {
                resetView();
            }
        }
    };

    const resetView = () => {
        setViewMode('grid');
        setGroupBy(null);
        setActiveFilter(null);
        setSearchTerm('');
    };

    // --- CRUD & Management Helpers (Copied from existing) ---

    const handleOpenModal = (userToEdit = null) => {
        setEditingUser(userToEdit);
        setShowModal(true);
    };

    const confirmDelete = (user) => {
        if (window.confirm(`Are you sure you want to delete ${user.username}?`)) {
            deleteUser(user.id);
        }
    };

    const deleteUser = async (userId) => {
        try {
            const res = await apiCall(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (res && res.ok) {
                setUsers(users.filter(u => u.id !== userId));
                setModalConfig({ isOpen: true, title: 'Success', message: 'User deleted.', type: 'success' });
            }
        } catch (err) { console.error("Delete failed", err); }
    };

    const handleManageMembers = (project) => {
        setIsManagingMembers(project);
    };

    const toggleProjectMember = async (projectId, userId, isMember) => {
        // ... (Existing logic can be simplified or kept similar)
        try {
            const method = isMember ? 'DELETE' : 'POST';
            const res = await apiCall(`/api/projects/${projectId}/members`, {
                method,
                body: JSON.stringify({ userId })
            });
            if (res && res.ok) {
                fetchUsers();
                fetchProjects();
                const updatedProjects = await (await apiCall('/api/projects')).json();
                setProjects(updatedProjects);
                const updatedProj = updatedProjects.find(p => p.id === projectId);
                if (updatedProj) setIsManagingMembers(updatedProj);
            }
        } catch (err) {
            console.error("Failed to update project members", err);
        }
    };


    // --- Derived State for Rendering ---

    const getFilteredUsers = () => {
        let filtered = [...users];

        // 1. Search Term
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(u =>
                u.username.toLowerCase().includes(lower) ||
                (u.role && u.role.toLowerCase().includes(lower))
            );
        }

        // 2. DnD Filter
        if (activeFilter) {
            if (activeFilter.type === 'department') {
                filtered = filtered.filter(u => u.Department && u.Department.name === activeFilter.name);
            } else if (activeFilter.type === 'project') {
                filtered = filtered.filter(u => u.Projects && u.Projects.some(p => p.id === activeFilter.id));
            }
        }

        return filtered;
    };

    const renderMainContent = () => {
        const displayUsers = getFilteredUsers();

        if (viewMode === 'grouped' && groupBy) {
            // Grouped / Kanban View
            const groups = {};

            if (groupBy === 'department') {
                const deptNames = [...new Set(users.map(u => u.Department?.name || 'Unassigned'))];
                deptNames.forEach(name => {
                    groups[name] = displayUsers.filter(u => (u.Department?.name || 'Unassigned') === name);
                });
            } else if (groupBy === 'project') {
                // Projects can have overlapping users, so we iterate projects instead of users
                projects.forEach(p => {
                    groups[p.name] = displayUsers.filter(u => u.Projects && u.Projects.some(proj => proj.id === p.id));
                });
                // Optional: 'Unassigned to any project' group?
                // groups['No Project'] = displayUsers.filter(u => !u.Projects || u.Projects.length === 0);
            }

            return (
                <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start' }}>
                    {Object.entries(groups).map(([groupName, groupUsers]) => (
                        <div key={groupName} className="glass-card" style={{ minWidth: '280px', padding: '1rem', flexShrink: 0 }}>
                            <h3 style={{ borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                {groupName} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({groupUsers.length})</span>
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {groupUsers.length === 0 ? <p style={{ opacity: 0.4, fontStyle: 'italic' }}>No members</p> :
                                    groupUsers.map(u => (
                                        <UserCard
                                            key={u.id}
                                            user={u}
                                            onEdit={() => handleOpenModal(u)}
                                            onDelete={() => confirmDelete(u)}
                                            isAdmin={user.role === 'Super Admin' || user.isDepartmentManager}
                                            isSuperAdmin={user.role === 'Super Admin'}
                                            minimal
                                        />
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Grid View (Default)
        return (
            <div>
                {activeFilter && (
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ opacity: 0.7 }}>Filtering by:</span>
                        <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                            {activeFilter.type === 'department' ? '🏢' : '📁'} {activeFilter.name}
                        </span>
                        <button onClick={resetView} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {displayUsers.map(u => (
                        <UserCard
                            key={u.id}
                            user={u}
                            onEdit={() => handleOpenModal(u)}
                            onDelete={() => confirmDelete(u)}
                            isAdmin={user.role === 'Super Admin' || user.isDepartmentManager}
                            isSuperAdmin={user.role === 'Super Admin'}
                        />
                    ))}
                </div>
            </div>
        );
    };

    if (user.role === 'Member') {
        return <div className="container" style={{ textAlign: 'center', padding: '100px' }}><h1 style={{ opacity: 0.5 }}>Access Denied</h1></div>;
    }

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
            {/* Header */}
            <div className="flex-between mb-4">
                <h1>Team & Resources</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Search team..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '99px', width: '250px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                    />
                    {(user.role === 'Super Admin' || user.isDepartmentManager) && (
                        <button className="btn-add" onClick={() => handleOpenModal(null)}>+ New User</button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>

                {/* 1. Sidebar (Draggable Sources) */}
                <div className="glass-card" style={{ width: '250px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>

                    {/* Reset Option */}
                    <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'RESET', {})}
                        onClick={resetView}
                        className="card-hover clickable"
                        style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'grab', textAlign: 'center', fontWeight: 'bold' }}
                    >
                        🔄 Reset View
                    </div>

                    {/* Grouping Options */}
                    <div>
                        <h4 style={{ marginBottom: '1rem', opacity: 0.7, fontSize: '0.9rem' }}>GROUP BY</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'GROUP_OPTION', { key: 'department', label: 'Department' })}
                                onClick={() => { setGroupBy('department'); setViewMode('grouped'); setActiveFilter(null); }}
                                className="card-hover clickable"
                                style={{ padding: '0.8rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <span>🏢</span> By Department
                            </div>
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'GROUP_OPTION', { key: 'project', label: 'Project' })}
                                onClick={() => { setGroupBy('project'); setViewMode('grouped'); setActiveFilter(null); }}
                                className="card-hover clickable"
                                style={{ padding: '0.8rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <span>📁</span> By Project
                            </div>
                        </div>
                    </div>

                    {/* Filter Options: Departments */}
                    <div>
                        <h4 style={{ marginBottom: '1rem', opacity: 0.7, fontSize: '0.9rem' }}>DEPARTMENTS</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[...new Set(users.map(u => u.Department?.name).filter(Boolean))].map(deptName => (
                                <div
                                    key={deptName}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'FILTER_OPTION', { type: 'department', name: deptName })}
                                    onClick={() => { setActiveFilter({ type: 'department', name: deptName }); setViewMode('grid'); setGroupBy(null); }}
                                    className="clickable"
                                    style={{ padding: '0.5rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', cursor: 'grab', fontSize: '0.9rem' }}
                                >
                                    {deptName}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filter Options: Projects */}
                    <div>
                        <h4 style={{ marginBottom: '1rem', opacity: 0.7, fontSize: '0.9rem' }}>PROJECTS</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {projects.map(p => (
                                <div
                                    key={p.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'FILTER_OPTION', { type: 'project', id: p.id, name: p.name })}
                                    onClick={() => { setActiveFilter({ type: 'project', id: p.id, name: p.name }); setViewMode('grid'); setGroupBy(null); }}
                                    className="clickable"
                                    style={{ padding: '0.5rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', cursor: 'grab', fontSize: '0.9rem' }}
                                >
                                    {p.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Main Area (Drop Zone) */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        flex: 1,
                        border: isDragOver ? '2px dashed var(--accent-primary)' : '2px dashed transparent',
                        borderRadius: '12px',
                        transition: 'all 0.3s',
                        background: isDragOver ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {renderMainContent()}
                    </div>
                </div>

            </div>

            {/* Modals (Keep existing) */}
            {isManagingMembers && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div className="glass-card" style={{ width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                        <h3>Manage Members: {isManagingMembers.name}</h3>
                        <div style={{ overflowY: 'auto', marginTop: '1.5rem', flex: 1 }}>
                            {users.map(u => {
                                const isMember = u.Projects && u.Projects.some(p => p.id === isManagingMembers.id);
                                return (
                                    <div key={u.id} className="flex-between" style={{ padding: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span>{u.username} <small style={{ opacity: 0.5 }}>({u.email} - {u.role})</small></span>
                                        <button
                                            className={isMember ? 'danger small' : 'success small'}
                                            onClick={() => toggleProjectMember(isManagingMembers.id, u.id, isMember)}
                                        >
                                            {isMember ? 'Remove' : 'Add'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="mt-4" onClick={() => setIsManagingMembers(null)}>Close</button>
                    </div>
                </div>
            )}

            <CreateUserModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingUser(null); }}
                editingUser={editingUser}
                onUserCreated={fetchUsers}
            />

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

// Sub-component for individual user card
const UserCard = ({ user, onEdit, onDelete, isAdmin, isSuperAdmin, minimal }) => (
    <div className="card" style={{ textAlign: 'center', padding: '1.5rem', position: 'relative', background: minimal ? 'rgba(255,255,255,0.03)' : 'var(--glass-bg)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'none' }}>
        {isAdmin && (
            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                <button onClick={onEdit} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Edit</button>
                {isSuperAdmin && (
                    <button onClick={onDelete} style={{ padding: '2px 6px', background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', color: '#fca5a5' }}>Del</button>
                )}
            </div>
        )}
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', margin: '0 auto 0.8rem', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', border: '2px solid rgba(255,255,255,0.2)' }}>
            {user.username ? user.username[0].toUpperCase() : '?'}
        </div>
        <h3 style={{ marginBottom: '0.1rem', fontSize: '1rem' }}>{user.username}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.2rem' }}>{user.email}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, opacity: 0.6 }}>{user.role || 'Member'}</p>
        {user.Department && <span className="badge badge-gray" style={{ marginTop: '0.5rem', fontSize: '0.6rem' }}>{user.Department.name}</span>}
    </div>
);

export default TeamPage;
