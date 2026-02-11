import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import CreateTaskModal from './CreateTaskModal';
import CreateProjectModal from './CreateProjectModal';
import CreateUserModal from './CreateUserModal';
import CreateDepartmentModal from './CreateDepartmentModal';
import OnboardingTour from './OnboardingTour';

const Layout = ({ children }) => {
    const { user, logout, apiCall } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
    const [taskModalProjectId, setTaskModalProjectId] = useState(null);
    const [tourVersion, setTourVersion] = useState(0);
    const [departments, setDepartments] = useState([]);
    const [showDepartmentSwitcher, setShowDepartmentSwitcher] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleOpenProject = () => setIsProjectModalOpen(true);
        const handleOpenTask = (e) => {
            setTaskModalProjectId(e.detail?.projectId || null);
            setIsTaskModalOpen(true);
        };

        window.addEventListener('open-project-modal', handleOpenProject);
        window.addEventListener('open-task-modal', handleOpenTask);
        return () => {
            window.removeEventListener('open-project-modal', handleOpenProject);
            window.removeEventListener('open-task-modal', handleOpenTask);
        };
    }, []);

    if (!user) return children;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const restartTour = () => {
        localStorage.removeItem(`onboarding_completed_${user.id}`);
        setTourVersion(prev => prev + 1);
    };

    return (
        <div className="main-wrapper" style={{ flexDirection: 'row', background: 'var(--bg-primary)', position: 'relative' }}>
            {/* Sidebar Overlay for Mobile */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div className="sidebar-logo" style={{ marginBottom: 0 }}>
                        <span style={{ color: 'var(--accent-primary)' }}>Tiny</span>PM
                    </div>
                    {/* Close button for mobile */}
                    <button
                        className="icon-btn"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ display: 'none' /* Will show via CSS media query if I added it, or just use inline */ }}
                        id="sidebar-close-btn"
                    >
                        ✕
                    </button>
                </div>

                <nav style={{ flexGrow: 1 }}>
                    {user.role !== 'Member' && (
                        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                            <span>📊</span> Dashboard
                        </Link>
                    )}
                    <Link to="/calendar" className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}>
                        <span>📅</span> Calendar
                    </Link>

                    {user.role !== 'Member' && (
                        <div style={{ position: 'relative' }} id="tour-team">
                            <Link to="/team" className={`nav-link ${location.pathname === '/team' ? 'active' : ''}`}>
                                <span>👥</span> Team
                            </Link>
                            {(user.role === 'Admin' || user.username === 'admin' || user.isDepartmentManager) && (
                                <button
                                    onClick={() => setIsUserModalOpen(true)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.5rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(0, 242, 255, 0.1)',
                                        border: '1px solid var(--accent-primary)',
                                        borderRadius: '4px',
                                        color: 'var(--accent-primary)',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 2
                                    }}
                                    title="Add Team Member"
                                >
                                    +
                                </button>
                            )}
                        </div>
                    )}

                    <div style={{ height: '1px', background: 'var(--glass-border)', margin: '1rem 0' }}></div>

                    {/* Projects - Managers and Admins */}
                    {(user.role === 'Admin' || user.role === 'Manager' || user.role === 'Super Admin' || user.role === 'Department Manager' || user.role === 'Project Manager') && (
                        <div style={{ position: 'relative' }} id="tour-projects">
                            <Link to="/projects" className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}>
                                <span>📁</span> Projects
                            </Link>
                            <button
                                onClick={() => setIsProjectModalOpen(true)}
                                style={{
                                    position: 'absolute',
                                    right: '0.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'rgba(0, 242, 255, 0.1)',
                                    border: '1px solid var(--accent-primary)',
                                    borderRadius: '4px',
                                    color: 'var(--accent-primary)',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 2
                                }}
                                title="New Project"
                            >
                                +
                            </button>
                        </div>
                    )}

                    {/* Tasks - All Users */}
                    <div style={{ position: 'relative' }} id="tour-tasks">
                        <Link to="/tasks" className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}>
                            <span>✅</span> Tasks
                        </Link>
                        <button
                            onClick={() => {
                                setTaskModalProjectId(null);
                                setIsTaskModalOpen(true);
                            }}
                            style={{
                                position: 'absolute',
                                right: '0.5rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0, 242, 255, 0.1)',
                                border: '1px solid var(--accent-primary)',
                                borderRadius: '4px',
                                color: 'var(--accent-primary)',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 2
                            }}
                            title="New Task"
                        >
                            +
                        </button>
                    </div>

                    {/* Settings Section */}
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        <Link to="/user-settings" className={`nav-link ${location.pathname === '/user-settings' ? 'active' : ''}`}>
                            <span>⚙️</span> Settings
                        </Link>
                        {(user.isDepartmentManager || user.role === 'Super Admin') && (
                            <Link to="/department-management" className={`nav-link ${location.pathname === '/department-management' ? 'active' : ''}`}>
                                <span>🏢</span> Departments
                            </Link>
                        )}
                    </div>
                </nav>

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'var(--gradient-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold'
                            }}>
                                {user.username[0].toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.8rem', overflow: 'hidden' }}>
                                <div style={{ fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.username}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{user.role}</div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={restartTour}
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            fontSize: '0.75rem',
                            opacity: 0.7,
                            marginBottom: '0.5rem',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <span>🔄</span> Restart Tour
                    </button>

                    <button onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start' }}>
                        <span>🚪</span> Logout
                    </button>

                    {(user.username === 'admin' || user.organizationId === 1) && (
                        <button
                            onClick={() => {
                                logout();
                                navigate('/');
                            }}
                            style={{
                                width: '100%',
                                justifyContent: 'flex-start',
                                marginTop: '0.5rem',
                                color: 'var(--accent-primary)',
                                border: '1px solid var(--accent-primary)',
                                background: 'rgba(0, 242, 255, 0.05)'
                            }}
                        >
                            <span>🏠</span> Exit Demo
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-wrapper">
                {/* Top Bar */}
                <header className="top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                        {/* Hamburger Menu Toggle */}
                        <button
                            className="icon-btn"
                            onClick={() => setIsSidebarOpen(true)}
                            id="hamburger-btn"
                            style={{ padding: '0.5rem', marginRight: '0.5rem' }}
                        >
                            ☰
                        </button>
                        <span style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {(location.pathname === '/' || location.pathname === '/dashboard') ? 'Dashboard' : 'Project View'}
                        </span>
                        {user?.departmentName && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => {
                                        if (user.role === 'Super Admin' || user.isDepartmentManager) {
                                            setShowDepartmentSwitcher(!showDepartmentSwitcher);
                                            if (!showDepartmentSwitcher) {
                                                // Load departments using apiCall
                                                apiCall('/api/departments')
                                                    .then(res => res ? res.json() : [])
                                                    .then(data => {
                                                        setDepartments(Array.isArray(data) ? data : []);
                                                    })
                                                    .catch(err => console.error('Failed to load departments:', err));
                                            }
                                        }
                                    }}
                                    id="tour-department"
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: '700',
                                        background: 'rgba(0, 242, 255, 0.1)',
                                        color: 'var(--accent-primary)',
                                        padding: '0.4rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--accent-primary)',
                                        textTransform: 'uppercase',
                                        cursor: (user.role === 'Super Admin' || user.isDepartmentManager) ? 'pointer' : 'default',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {user.departmentName} DEPARTMENT
                                    {(user.role === 'Super Admin' || user.isDepartmentManager) && <span style={{ fontSize: '0.7rem' }}>▼</span>}
                                </button>

                                {/* Department Switcher Dropdown */}
                                {showDepartmentSwitcher && (user.role === 'Super Admin' || user.isDepartmentManager) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        marginTop: '0.5rem',
                                        background: 'rgba(20, 20, 40, 0.98)',
                                        border: '1px solid var(--accent-primary)',
                                        borderRadius: '12px',
                                        padding: '0.5rem',
                                        minWidth: '250px',
                                        zIndex: 1000,
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                                    }}>
                                        <div style={{ padding: '0.5rem', fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>
                                            Your Departments
                                        </div>
                                        {departments.map(dept => (
                                            <button
                                                key={dept.id}
                                                onClick={async () => {
                                                    try {
                                                        const res = await apiCall(`/api/departments/switch/${dept.id}`, {
                                                            method: 'POST'
                                                        });
                                                        if (res && res.ok) {
                                                            setShowDepartmentSwitcher(false);
                                                            window.location.reload();
                                                        }
                                                    } catch (err) {
                                                        console.error('Switch failed:', err);
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    background: dept.id === user.departmentId ? 'rgba(0, 242, 255, 0.2)' : 'transparent',
                                                    border: dept.id === user.departmentId ? '1px solid var(--accent-primary)' : '1px solid transparent',
                                                    borderRadius: '8px',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    marginBottom: '0.25rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <span>{dept.name}</span>
                                                {dept.id === user.departmentId && <span style={{ fontSize: '0.8rem' }}>✓</span>}
                                            </button>
                                        ))}
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
                                        <button
                                            onClick={() => {
                                                setShowDepartmentSwitcher(false);
                                                setIsDepartmentModalOpen(true);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(0, 242, 255, 0.1)',
                                                border: '1px solid var(--accent-primary)',
                                                borderRadius: '8px',
                                                color: 'var(--accent-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                            }}
                                        >
                                            + Create New Department
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {/* Search Placeholder */}
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search..."
                                style={{
                                    padding: '0.4rem 1rem',
                                    paddingLeft: '2.5rem',
                                    fontSize: '0.9rem',
                                    width: '200px',
                                    borderRadius: '99px',
                                    background: 'var(--bg-primary)',
                                    border: 'none'
                                }}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                        </div>

                        <NotificationBell />

                        {/* Theme Toggle Removed */}
                    </div>
                </header>

                {/* Page Content */}
                <div className="content-area">
                    {children}
                </div>
            </main>

            {/* Global Create Task Modal */}
            {isTaskModalOpen && (
                <CreateTaskModal
                    initialProjectId={taskModalProjectId}
                    onClose={() => {
                        setIsTaskModalOpen(false);
                        setTaskModalProjectId(null);
                    }}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}

            {/* Global Create Project Modal */}
            {isProjectModalOpen && (
                <CreateProjectModal
                    onClose={() => setIsProjectModalOpen(false)}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}


            {/* Global Create User Modal */}
            {isUserModalOpen && (
                <CreateUserModal
                    isOpen={isUserModalOpen}
                    onClose={() => setIsUserModalOpen(false)}
                    onUserCreated={() => window.location.reload()}
                />
            )}

            {/* Global Create Department Modal */}
            <CreateDepartmentModal
                isOpen={isDepartmentModalOpen}
                onClose={() => setIsDepartmentModalOpen(false)}
                onDepartmentCreated={() => window.location.reload()}
            />

            {/* Onboarding Tour */}
            <OnboardingTour key={tourVersion} />
        </div >
    );
};

export default Layout;
