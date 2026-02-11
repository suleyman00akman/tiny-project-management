import { useState } from 'react';

function TodoForm({ addTodo }) {
    const [text, setText] = useState('');
    const [assignee, setAssignee] = useState('Me');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        addTodo(text, assignee, dueDate);
        setText('');
        setAssignee('Me');
        setDueDate('');
    };

    return (
        <form className="todo-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What needs to be done?"
            />
            <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="assignee-select"
            >
                <option value="Me">Me</option>
                <option value="Alice">Alice</option>
                <option value="Bob">Bob</option>
                <option value="Charlie">Charlie</option>
            </select>
            <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="date-input"
                style={{
                    padding: '0.8em',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--input-bg)',
                    color: 'white'
                }}
            />
            <button type="submit" className="btn-add">Add</button>
        </form>
    );
}

export default TodoForm;
