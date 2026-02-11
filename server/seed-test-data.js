const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Database connection
const sequelize = new Sequelize(
    process.env.DB_NAME || 'tiny_pm',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'postgres123',
    {
        host: process.env.DB_HOST || 'db',
        dialect: 'postgres',
        logging: false,
    }
);

// Import models (same as in index.js)
const Workspace = sequelize.define('Workspace', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'Member' },
    isSuperAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    isWorkspaceOwner: { type: DataTypes.BOOLEAN, defaultValue: false },
    preferredLanguage: { type: DataTypes.STRING, defaultValue: 'en' },
    preferredTheme: { type: DataTypes.STRING, defaultValue: 'dark' },
    workspaceId: { type: DataTypes.INTEGER }
}, {
    indexes: [
        {
            unique: true,
            fields: ['username', 'workspaceId']
        }
    ]
});

const Project = sequelize.define('Project', {
    name: { type: DataTypes.STRING, allowNull: false },
    managerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
    startDate: { type: DataTypes.DATEONLY },
    endDate: { type: DataTypes.DATEONLY }
});

const Todo = sequelize.define('Todo', {
    text: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'To Do' },
    progress: { type: DataTypes.INTEGER, defaultValue: 0 },
    assignedTo: { type: DataTypes.STRING },
    startDate: { type: DataTypes.DATE },
    dueDate: { type: DataTypes.DATE },
    projectId: { type: DataTypes.INTEGER, allowNull: false }
});

const Comment = sequelize.define('Comment', {
    text: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    username: { type: DataTypes.STRING }
});

const ProjectMember = sequelize.define('ProjectMembers', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'Member'
    }
});

// Define associations
Project.belongsToMany(User, { through: ProjectMember, as: 'Members' });
User.belongsToMany(Project, { through: ProjectMember, as: 'Projects' });

Workspace.hasMany(User, { foreignKey: 'workspaceId' });
User.belongsTo(Workspace, { foreignKey: 'workspaceId' });

User.hasMany(Workspace, { foreignKey: 'ownerId', as: 'OwnedWorkspaces' });
Workspace.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });

Workspace.hasMany(Project, { foreignKey: 'workspaceId' });
Project.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Project.hasMany(Todo, { foreignKey: 'projectId' });
Todo.belongsTo(Project, { foreignKey: 'projectId' });

Todo.hasMany(Comment, { foreignKey: 'todoId', onDelete: 'CASCADE' });
Comment.belongsTo(Todo, { foreignKey: 'todoId' });

async function seedTestData() {
    try {
        console.log('🌱 Starting seed data creation...');

        // Sync database (don't drop existing tables)
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced');

        // Check if test data already exists
        const existingWorkspace = await Workspace.findOne({ where: { name: 'Test Workspace' } });
        if (existingWorkspace) {
            console.log('⚠️  Test data already exists. Cleaning up first...');

            // Delete in correct order to respect foreign keys
            await Comment.destroy({ where: {} });
            await Todo.destroy({ where: {} });
            await ProjectMember.destroy({ where: {} });
            await Project.destroy({ where: { workspaceId: existingWorkspace.id } });
            await User.destroy({ where: { workspaceId: existingWorkspace.id } });
            await Workspace.destroy({ where: { id: existingWorkspace.id } });

            console.log('✅ Cleaned up existing test data');
        }

        // 1. Create Test Workspace
        console.log('📦 Creating test workspace...');
        const workspace = await Workspace.create({
            name: 'Test Workspace',
            isDefault: true
        });
        console.log(`✅ Created workspace: ${workspace.name} (ID: ${workspace.id})`);

        // 2. Create Test Users
        console.log('👥 Creating test users...');

        // Workspace Owner (admin-01)
        const hashedPassword = await bcrypt.hash('password123', 10);
        const admin = await User.create({
            username: 'admin-01',
            password: hashedPassword,
            role: 'Manager',
            isSuperAdmin: true,
            isWorkspaceOwner: true,
            workspaceId: workspace.id,
            preferredLanguage: 'en',
            preferredTheme: 'dark'
        });
        console.log(`✅ Created admin: ${admin.username}`);

        // Set workspace owner
        workspace.ownerId = admin.id;
        await workspace.save();

        // Project Manager
        const pmPassword = await bcrypt.hash('password123', 10);
        const projectManager = await User.create({
            username: 'pmgr100',
            password: pmPassword,
            role: 'Manager',
            workspaceId: workspace.id,
            preferredLanguage: 'en',
            preferredTheme: 'dark'
        });
        console.log(`✅ Created project manager: ${projectManager.username}`);

        // Team Members
        const memberPassword = await bcrypt.hash('password123', 10);
        const member1 = await User.create({
            username: 'user200',
            password: memberPassword,
            role: 'Member',
            workspaceId: workspace.id,
            preferredLanguage: 'en',
            preferredTheme: 'dark'
        });
        console.log(`✅ Created member: ${member1.username}`);

        const member2 = await User.create({
            username: 'user201',
            password: memberPassword,
            role: 'Member',
            workspaceId: workspace.id,
            preferredLanguage: 'en',
            preferredTheme: 'dark'
        });
        console.log(`✅ Created member: ${member2.username}`);

        // 3. Create Test Projects
        console.log('📋 Creating test projects...');

        const project1 = await Project.create({
            name: 'Alpha Project',
            managerId: projectManager.id,
            workspaceId: workspace.id,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-06-30')
        });
        console.log(`✅ Created project: ${project1.name}`);

        const project2 = await Project.create({
            name: 'Beta Project',
            managerId: admin.id,
            workspaceId: workspace.id,
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-08-31')
        });
        console.log(`✅ Created project: ${project2.name}`);

        // 4. Assign users to projects
        console.log('🔗 Assigning users to projects...');

        // Project 1: PM + both members
        await project1.addMember(projectManager, { through: { role: 'Manager' } });
        await project1.addMember(member1, { through: { role: 'Member' } });
        await project1.addMember(member2, { through: { role: 'Member' } });
        console.log(`✅ Assigned users to ${project1.name}`);

        // Project 2: Admin + member1
        await project2.addMember(admin, { through: { role: 'Manager' } });
        await project2.addMember(member1, { through: { role: 'Member' } });
        console.log(`✅ Assigned users to ${project2.name}`);

        // 5. Create Test Tasks
        console.log('✅ Creating test tasks...');

        const task1 = await Todo.create({
            text: 'Design database schema',
            status: 'Done',
            progress: 100,
            assignedTo: member1.username,
            projectId: project1.id,
            startDate: new Date('2026-01-05'),
            dueDate: new Date('2026-01-15')
        });
        console.log(`✅ Created task: ${task1.text}`);

        const task2 = await Todo.create({
            text: 'Implement user authentication',
            status: 'In Progress',
            progress: 60,
            assignedTo: member2.username,
            projectId: project1.id,
            startDate: new Date('2026-01-10'),
            dueDate: new Date('2026-02-10')
        });
        console.log(`✅ Created task: ${task2.text}`);

        const task3 = await Todo.create({
            text: 'Create API endpoints',
            status: 'To Do',
            progress: 0,
            assignedTo: member1.username,
            projectId: project1.id,
            startDate: new Date('2026-02-01'),
            dueDate: new Date('2026-03-01')
        });
        console.log(`✅ Created task: ${task3.text}`);

        const task4 = await Todo.create({
            text: 'Setup CI/CD pipeline',
            status: 'To Do',
            progress: 0,
            assignedTo: projectManager.username,
            projectId: project2.id,
            startDate: new Date('2026-02-05'),
            dueDate: new Date('2026-02-20')
        });
        console.log(`✅ Created task: ${task4.text}`);

        const task5 = await Todo.create({
            text: 'Write documentation',
            status: 'In Progress',
            progress: 30,
            assignedTo: member1.username,
            projectId: project2.id,
            startDate: new Date('2026-02-01'),
            dueDate: new Date('2026-03-15')
        });
        console.log(`✅ Created task: ${task5.text}`);

        // 6. Create Test Comments
        console.log('💬 Creating test comments...');

        const comment1 = await Comment.create({
            text: 'Great work on the schema design!',
            userId: projectManager.id,
            username: projectManager.username,
            todoId: task1.id
        });
        console.log(`✅ Created comment on task: ${task1.text}`);

        const comment2 = await Comment.create({
            text: 'Need help with OAuth integration? @pmgr100',
            userId: member2.id,
            username: member2.username,
            todoId: task2.id
        });
        console.log(`✅ Created comment on task: ${task2.text}`);

        console.log('\n🎉 Seed data creation completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Workspace: ${workspace.name}`);
        console.log(`   - Users: 4 (1 admin, 1 PM, 2 members)`);
        console.log(`   - Projects: 2`);
        console.log(`   - Tasks: 5`);
        console.log(`   - Comments: 2`);
        console.log('\n🔑 Test Credentials:');
        console.log('   - Admin: admin-01 / password123');
        console.log('   - PM: pmgr100 / password123');
        console.log('   - Member 1: user200 / password123');
        console.log('   - Member 2: user201 / password123');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    }
}

// Run the seed function
seedTestData();
