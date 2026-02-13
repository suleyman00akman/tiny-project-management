import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import EditProjectModal from '../components/EditProjectModal';

function ProjectsPage() {
    const { user, apiCall } = useAuth();
    const [projects, setProjects] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(null); // Project object to edit
    const [newProjectName, setNewProjectName] = useState('');

    // View State
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'grouped'
    const [groupBy, setGroupBy] = useState(null); // 'status', 'manager'
    const [activeFilter, setActiveFilter] = useState(null); // { type: 'manager'|'status', value: ... , label: ... }
    const [isDragOver, setIsDragOver] = useState(false);
    const dragCounter = useRef(0);

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const fetchProjects = async () => {
        try {
            const res = await apiCall('/api/projects');
            if (res && res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (err) {
            console.error("Failed to fetch projects", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await apiCall('/api/projects', {
                method: 'POST',
                body: JSON.stringify({ name: newProjectName })
            });
            if (res && res.ok) {
                setNewProjectName('');
                setIsCreating(false);
                fetchProjects();
            }
        } catch (err) {
            console.error("Create failed", err);
        }
    };

    // --- Interaction Handlers (Drag & Click) ---

    // Unified Logic for State Updates
    const applyInteraction = (type, data) => {
        if (type === 'GROUP_OPTION') {
            setGroupBy(data.key);
            setViewMode('grouped');
            setActiveFilter(null);
        } else if (type === 'FILTER_OPTION') {
            setActiveFilter(data);
            setViewMode('grid');
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
                console.error("Drop Data Parse Error", err);
            }
        }
    };

    const resetView = () => {
        setViewMode('grid');
        setGroupBy(null);
        setActiveFilter(null);
    };

    // --- Rendering Helpers ---

    const getFilteredProjects = () => {
        let filtered = [...projects];

        if (activeFilter) {
            if (activeFilter.type === 'manager') {
                filtered = filtered.filter(p => p.managerId === activeFilter.value);
            } else if (activeFilter.type === 'status') {
                // Simplified status check
                if (activeFilter.value === 'Archived') {
                    filtered = filtered.filter(p => p.isArchived);
                } else {
                    filtered = filtered.filter(p => !p.isArchived);
                }
            } else if (activeFilter.type === 'dept') {
                filtered = filtered.filter(p => p.departmentId === activeFilter.value);
            }
        }
        return filtered;
    };


    const renderMainContent = () => {
        const displayProjects = getFilteredProjects();

        // Empty state
        if (displayProjects.length === 0) {
            return (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <h3>No projects found</h3>
                    <button onClick={resetView} style={{ marginTop: '1rem', background: 'var(--accent-primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>Clear Filters</button>
                </div>
            );
        }

        if (viewMode === 'grouped' && groupBy) {
            const groups = {};

            if (groupBy === 'status') {
                groups['Active'] = displayProjects.filter(p => !p.isArchived);
                groups['Archived'] = displayProjects.filter(p => p.isArchived);
            } else if (groupBy === 'manager') {
                // Group by Manager ID (or Name if available from join)
                const managerIds = [...new Set(displayProjects.map(p => p.managerId))];
                managerIds.forEach(mId => {
                    // Try to find manager name from project members if possible, otherwise use ID
                    // Ideally backend returns Manager object. Assuming p.Manager exists or just ID for now.
                    // For now, let's just group by ID
                    groups[`Manager #${mId}`] = displayProjects.filter(p => p.managerId === mId);
                });
            } else if (groupBy === 'dept') {
                const deptIds = [...new Set(displayProjects.map(p => p.departmentId))];
                deptIds.forEach(dId => {
                    // Lookup department name if available
                    const deptName = displayProjects.find(dp => dp.departmentId === dId)?.Department?.name || `Dept #${dId}`;
                    groups[deptName] = displayProjects.filter(p => p.departmentId === dId);
                });
            }

            return (
                <div style={{ display: 'flex', gap: '1.5rem', height: '100%', alignItems: 'stretch', overflowX: 'auto' }}>
                    {Object.entries(groups).map(([groupName, groupProjects]) => (
                        <div key={groupName} className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                                    {groupName} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({groupProjects.length})</span>
                                </h3>
                            </div>
                            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {groupProjects.map(p => (
                                    <ProjectCard key={p.id} project={p} onEdit={() => setIsEditing(p)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Grid View
        return (
            <div>
                {activeFilter && (
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>
                        <span style={{ opacity: 0.9, fontWeight: 'bold' }}>Filtering by:</span>
                        <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.3rem 0.8rem', fontSize: '1rem' }}>
                            {activeFilter.label}
                        </span>
                        <button onClick={resetView} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto' }}>✖ Clear Filter</button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {displayProjects.map(p => (
                        <ProjectCard key={p.id} project={p} onEdit={() => setIsEditing(p)} />
                    ))}
                </div>
            </div>
        );
    };

    if (user.role !== 'Super Admin' && user.role !== 'Department Manager' && user.role !== 'Project Manager') {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '88vh', padding: '2rem' }}>
            <div className="flex-between mb-4">
                <div>
                    <h1>Projects Management</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.2rem' }}>Drag options to organize projects</p>
                </div>
                {/* Create Project Button can go here if needed */}
                <button className="btn-add" onClick={() => setIsCreating(true)} style={{ display: 'none' /* Hidden for now per design, usually separate modal */ }}>+ Create Project</button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>

                {/* 1. Sidebar */}
                <div className="glass-card" style={{ width: '260px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
                    {/* Reset Option */}
                    <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'RESET', {})}
                        onClick={() => applyInteraction('RESET', {})}
                        className="card-hover clickable"
                        style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}
                    >
                        🔄 Reset View
                    </div>

                    {/* Grouping Options */}
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
                                onDragStart={(e) => handleDragStart(e, 'GROUP_OPTION', { key: 'dept', label: 'Department' })}
                                onClick={() => applyInteraction('GROUP_OPTION', { key: 'dept', label: 'Department' })}
                                className="card-hover clickable"
                                style={{ padding: '1rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>🏢</span>
                                <span>By Department</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Options: Status */}
                    <div>
                        <h4 style={{ marginBottom: '1rem', opacity: 0.7, fontSize: '0.8rem', letterSpacing: '1px' }}>STATUS (Filter)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'FILTER_OPTION', { type: 'status', value: 'Active', label: 'Active Projects' })}
                                onClick={() => applyInteraction('FILTER_OPTION', { type: 'status', value: 'Active', label: 'Active Projects' })}
                                className="card-hover clickable"
                                style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Active
                            </div>
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'FILTER_OPTION', { type: 'status', value: 'Archived', label: 'Archived Projects' })}
                                onClick={() => applyInteraction('FILTER_OPTION', { type: 'status', value: 'Archived', label: 'Archived Projects' })}
                                className="card-hover clickable"
                                style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Archived
                            </div>
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
                        overflow: 'hidden',
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

                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {renderMainContent()}
                    </div>
                </div>
            </div>

            {isEditing && (
                <EditProjectModal
                    project={isEditing}
                    onClose={() => setIsEditing(null)}
                    onUpdate={(updated) => {
                        setProjects(projects.map(p => p.id === updated.id ? updated : p));
                        setIsEditing(null);
                    }}
                />
            )}
        </div>
    );
}

const ProjectCard = ({ project, onEdit }) => (
    <div className="glass-card flex-between" style={{ padding: '1.2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Link to={`/project/${project.id}`} style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
                {project.name}
            </Link>
            <div className="text-xs text-secondary" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {/* <span>Manager: {project.Manager?.username || project.managerId}</span> TODO: Fetch manager name */}
                {project.Department && <span className="badge badge-gray">{project.Department.name}</span>}
                {project.startDate && <span>{new Date(project.startDate).toLocaleDateString()} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : '...'}</span>}
                {project.isArchived && <span className="badge badge-gray">Archived</span>}
            </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onEdit} className="small" style={{ opacity: 0.8 }}>Edit</button>
        </div>
    </div>
);

export default ProjectsPage;
