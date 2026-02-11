const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('tiny_pm', 'postgres', 'postgres123', {
    host: 'db', // Inside docker network
    dialect: 'postgres',
    port: 5432,
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    username: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING },
    isWorkspaceOwner: { type: DataTypes.BOOLEAN }
}, { tableName: 'Users', timestamps: false });

async function run() {
    try {
        const users = await User.findAll();
        console.log("Users in DB:");
        users.forEach(u => {
            console.log(`- ${u.username} (ID: ${u.id}, Role: ${u.role}, Owner: ${u.isWorkspaceOwner})`);
        });
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err.message);
        process.exit(1);
    }
}

run();
