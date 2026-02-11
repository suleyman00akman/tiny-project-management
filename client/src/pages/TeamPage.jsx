import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateUserModal from '../components/CreateUserModal';
import Modal from '../components/Modal';

function TeamPage() {
    const { user, apiCall } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isManagingMembers, setIsManagingMembers] = useState(null); // Project object

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
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await apiCall('/api/projects');
            if (res && res.ok) setProjects(await res.json());
        } catch (err) {
            console.error("Failed to fetch projects");
        }
    };

    const handleOpenModal = (userToEdit = null) => {
        setEditingUser(userToEdit);
        setShowModal(true);
    };

    const handleManageMembers = (project) => {
        setIsManagingMembers(project);
    };

    const toggleProjectMember = async (projectId, userId, isMember) => {
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

    const deleteUser = async (userId) => {
        try {
            const res = await apiCall(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (res && res.ok) {
                setUsers(users.filter(u => u.id !== userId));
                setModalConfig({
                    isOpen: true,
                    title: 'Success',
                    message: 'User deleted successfully. Their tasks are now Unassigned.',
                    type: 'success'
                });
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Error',
                    message: 'Failed to delete user.',
                    type: 'error'
                });
            }
        } catch (err) {
            console.error("Failed to delete user", err);
        }
    };

    const confirmDelete = (user) => {
        if (window.confirm(`Are you sure you want to delete ${user.username}? This cannot be undone.`)) {
            deleteUser(user.id);
        }
    };

    if (user.role === 'Member') {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px' }}>
                <h1 style={{ opacity: 0.5 }}>Access Denied</h1>
                <p>Members do not have access to the Team Directory.</p>
            </div>
        );
    }

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const isAdmin = user.role === 'Super Admin' || user.isDepartmentManager;
    const isSuperAdmin = user.role === 'Super Admin';

    return (
        <div className="container">
            <div className="flex-between mb-4">
                <h1>Team Directory</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Search team..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '99px', width: '250px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                    />
                    {isAdmin && (
                        <button className="btn-add" onClick={() => handleOpenModal(null)}>+ New User</button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Super Admin - Group by Departments */}
                {isSuperAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                        <h2 style={{ borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem' }}>🏢 Departments & Oversight</h2>
                        {(() => {
                            const departments = [...new Set(users.map(u => u.Department?.name))].filter(Boolean);
                            if (departments.length === 0) return <p style={{ opacity: 0.5 }}>No departments found.</p>;

                            return departments.map(deptName => {
                                const deptUsers = filteredUsers.filter(u => u.Department?.name === deptName);
                                return (
                                    <div key={deptName} className="glass-card" style={{ padding: '1.5rem' }}>
                                        <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>🏢</span> {deptName}
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                            {deptUsers.map(u => (
                                                <UserCard key={u.id} user={u} onEdit={() => handleOpenModal(u)} onDelete={() => confirmDelete(u)} isAdmin={true} isSuperAdmin={isSuperAdmin} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                <h2 style={{ borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem' }}>📁 Projects & Execution</h2>
                {projects.map(project => {
                    const projectMembers = filteredUsers.filter(u => u.Projects && u.Projects.some(p => p.id === project.id));
                    const canManage = isAdmin || (user.role === 'Project Manager' && project.managerId === user.id);

                    if (projectMembers.length === 0 && !canManage) return null;

                    return (
                        <div key={project.id} className="glass-card" style={{ padding: '1.5rem' }}>
                            <div className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                <h2 style={{ color: 'var(--accent-primary)', margin: 0 }}>📁 {project.name}</h2>
                                {canManage && (
                                    <button className="small" onClick={() => handleManageMembers(project)}>Manage Members</button>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                {projectMembers.map(u => (
                                    <UserCard key={u.id} user={u} onEdit={() => handleOpenModal(u)} onDelete={() => confirmDelete(u)} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {isAdmin && (
                    <>
                        {(() => {
                            const unassigned = filteredUsers.filter(u => !u.Projects || u.Projects.length === 0);
                            if (unassigned.length > 0) {
                                return (
                                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                                        <h2 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                            👤 Unassigned / General
                                        </h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                            {unassigned.map(u => (
                                                <UserCard key={u.id} user={u} onEdit={() => handleOpenModal(u)} onDelete={() => confirmDelete(u)} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                        })()}
                    </>
                )}
            </div>

            {/* Member Management Modal */}
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
                onClose={() => {
                    setShowModal(false);
                    setEditingUser(null);
                }}
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
            {user.username[0].toUpperCase()}
        </div>
        <h3 style={{ marginBottom: '0.1rem', fontSize: '1rem' }}>{user.username}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.2rem' }}>{user.email}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, opacity: 0.6 }}>{user.role || 'Member'}</p>
    </div>
);

export default TeamPage;
