const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('tiny_pm', 'postgres', 'postgres123', {
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
});

const reset = async () => {
    try {
        console.log("Connecting to DB...");
        await sequelize.authenticate();
        console.log("Connected. Dropping all tables...");
        await sequelize.getQueryInterface().dropAllTables();
        console.log("All tables dropped.");
        // We rely on the main server restart to re-sync (create tables)
    } catch (err) {
        console.error("Reset Error:", err);
    } finally {
        await sequelize.close();
    }
};

reset();
