const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('tiny_pm', 'postgres', 'postgres123', {
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
});

const Workspace = sequelize.define('Workspace', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false }
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'Member' },
    workspaceId: { type: DataTypes.INTEGER }
});

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected.");

        const workspaces = await Workspace.findAll();
        console.log("Workspaces:", JSON.stringify(workspaces, null, 2));

        const users = await User.findAll();
        console.log("Users:", JSON.stringify(users, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sequelize.close();
    }
};

run();
