import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import EditProjectModal from '../components/EditProjectModal';

function ProjectsPage() {
    const { user, apiCall } = useAuth();
    const [projects, setProjects] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(null); // Project object to edit
    const [newProjectName, setNewProjectName] = useState('');

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const fetchProjects = async () => {
        try {
            const res = await apiCall('/api/projects');
            if (res && res.ok) {
                const data = await res.json();
                // Admin sees all (backend handles). Manager sees own.
                // If backend returns all for admin, we just set it.
                // If backend returns all for Manager (it shouldn't based on our new logic), we filter.
                // But our new backend logic handles Admin vs Manager/User already.
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

    if (user.role !== 'Super Admin' && user.role !== 'Department Manager' && user.role !== 'Project Manager') {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div className="flex-between mb-4">
                <h1>Projects Management</h1>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {projects.length === 0 ? <p style={{ opacity: 0.6 }}>No projects found.</p> : projects.map(p => (
                    <div key={p.id} className="glass-card flex-between" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <Link to={`/project/${p.id}`} style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
                                {p.name}
                            </Link>
                            <div className="text-xs text-secondary" style={{ display: 'flex', gap: '1rem' }}>
                                <span>Project Manager ID: {p.managerId}</span>
                                {p.startDate && <span>{new Date(p.startDate).toLocaleDateString()} - {p.endDate ? new Date(p.endDate).toLocaleDateString() : '...'}</span>}
                                {p.isArchived && <span className="badge badge-gray">Archived</span>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setIsEditing(p)} className="small">Edit Details</button>
                        </div>
                    </div>
                ))}
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

export default ProjectsPage;
