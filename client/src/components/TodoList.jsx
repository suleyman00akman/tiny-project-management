import { useState } from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, updateTodo, deleteTodo, groupBy, onViewDetails, allowInlineEdit = true }) {
    const [collapsedGroups, setCollapsedGroups] = useState({});

    if (todos.length === 0) {
        return (
            <div style={{ textAlign: 'center', opacity: 0.6, marginTop: '2rem' }}>
                <p>No tasks yet. Add one above!</p>
            </div>
        );
    }

    if (groupBy === 'none') {
        return (
            <ul className="todo-list">
                {todos.map(todo => (
                    <TodoItem
                        key={todo.id}
                        todo={todo}
                        updateTodo={updateTodo}
                        deleteTodo={deleteTodo}
                        onViewDetails={onViewDetails}
                        allowInlineEdit={allowInlineEdit}
                    />
                ))}
            </ul>
        );
    }

    // Grouping logic
    const grouped = todos.reduce((acc, todo) => {
        const key = todo[groupBy] || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(todo);
        return acc;
    }, {});

    const toggleGroup = (group) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    return (
        <div className="grouped-list">
            {Object.keys(grouped).map(group => (
                <div key={group} className="todo-group">
                    <h3
                        className="group-title clickable"
                        onClick={() => toggleGroup(group)}
                    >
                        <span className={`arrow ${collapsedGroups[group] ? 'collapsed' : ''}`}>▼</span>
                        {group}
                        <span className="group-count">({grouped[group].length})</span>
                    </h3>

                    {!collapsedGroups[group] && (
                        <ul className="todo-list">
                            {grouped[group].map(todo => (
                                <TodoItem
                                    key={todo.id}
                                    todo={todo}
                                    updateTodo={updateTodo}
                                    deleteTodo={deleteTodo}
                                    onViewDetails={onViewDetails}
                                    allowInlineEdit={allowInlineEdit}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}

export default TodoList;
