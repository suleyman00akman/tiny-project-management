import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CalendarView from '../components/CalendarView';
import TaskDetails from '../components/TaskDetails';
import Modal from '../components/Modal';

function CalendarPage() {
    const { user, apiCall } = useAuth();
    const [todos, setTodos] = useState([]);
    const [selectedTodo, setSelectedTodo] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, todoId: null });

    useEffect(() => {
        if (user) {
            fetchAllTodos();
        }
    }, [user]);

    const fetchAllTodos = async () => {
        try {
            const pRes = await apiCall('/api/projects');

            if (pRes && pRes.ok) {
                const projects = await pRes.json();
                let allTodos = [];

                const todoPromises = projects.map(p =>
                    apiCall(`/api/projects/${p.id}/todos`)
                        .then(r => r.json())
                        .then(t => t.map(todo => ({ ...todo, projectName: p.name, projectId: p.id })))
                );

                const results = await Promise.all(todoPromises);
                results.forEach(arr => allTodos = [...allTodos, ...arr]);

                setTodos(allTodos);
            }
        } catch (err) {
            console.error("Failed to fetch global todos", err);
        }
    };

    const handleDeleteClick = (todoId) => {
        setDeleteModal({ isOpen: true, todoId });
    };

    const confirmDeleteTodo = async () => {
        const { todoId } = deleteModal;
        if (!todoId) return;
        try {
            const res = await apiCall(`/api/todos/${todoId}`, {
                method: 'DELETE'
            });
            if (res && res.ok) {
                setTodos(todos.filter(t => t.id !== todoId));
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
        setDeleteModal({ isOpen: false, todoId: null });
    };

    return (
        <div className="container">
            <h1 className="mb-4">Global Calendar</h1>

            <CalendarView
                todos={todos}
                onViewDetails={setSelectedTodo}
            // Update/Delete not strictly needed for view-only, but available if we want
            />

            {selectedTodo && (
                <TaskDetails
                    todo={selectedTodo}
                    onClose={() => setSelectedTodo(null)}
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

export default CalendarPage;
