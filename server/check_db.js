const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    role: { type: DataTypes.STRING }
});

const Project = sequelize.define('Project', {
    name: { type: DataTypes.STRING, allowNull: false },
    managerId: { type: DataTypes.INTEGER, allowNull: false }
});

const Todo = sequelize.define('Todo', {
    text: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING },
    projectId: { type: DataTypes.INTEGER, allowNull: false }
});

const checkDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB.");

        const users = await User.findAll();
        console.log("Users:", users.map(u => `${u.id}: ${u.username} (${u.role})`));

        const projects = await Project.findAll();
        console.log("Projects:", projects.map(p => `${p.id}: ${p.name} (Manager: ${p.managerId})`));

        const todos = await Todo.findAll();
        console.log("Todos:", todos.map(t => `${t.id}: ${t.text} (Project: ${t.projectId})`));

    } catch (err) {
        console.error("Error:", err);
    }
};

checkDB();
