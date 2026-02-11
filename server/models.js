const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Database Connection
const sequelize = new Sequelize(
    process.env.DB_NAME || 'tiny_pm',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS, // No default password for security
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false
    }
);

// --- MODELS ---

// 1. ORGANIZATION (The "Company")
const Organization = sequelize.define('Organization', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    domain: { type: DataTypes.STRING }, // e.g., 'acme.com'
    plan: { type: DataTypes.STRING, defaultValue: 'Free' }, // Free, Pro, Enterprise
    logoUrl: { type: DataTypes.STRING } // New: Logo URL
});

// 2. USER (Belongs to an Organization, has a Role)
const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false }, // Display Name
    email: { type: DataTypes.STRING, allowNull: false, unique: true }, // Login Identifier
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
        type: DataTypes.ENUM('Super Admin', 'Department Manager', 'Project Manager', 'Member'),
        defaultValue: 'Member'
    },
    organizationId: { type: DataTypes.INTEGER, allowNull: true },
    departmentId: { type: DataTypes.INTEGER, allowNull: true } // The "Home Department" of the user
});

// 3. DEPARTMENT (The "Business Unit")
const Department = sequelize.define('Department', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    organizationId: { type: DataTypes.INTEGER, allowNull: false },
    managerId: { type: DataTypes.INTEGER } // The "Department Manager"
});

// 4. PROJECT (Belongs to a Department)
const Project = sequelize.define('Project', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'Active' },
    isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
    departmentId: { type: DataTypes.INTEGER, allowNull: false },
    managerId: { type: DataTypes.INTEGER } // The "Project Manager" handling this project
});

// 5. TODO (Task)
const Todo = sequelize.define('Todo', {
    text: { type: DataTypes.STRING, allowNull: false }, // Mapped as 'title' in frontend often
    status: { type: DataTypes.STRING, defaultValue: 'To Do' }, // To Do, In Progress, In Review, Done
    assignedTo: { type: DataTypes.STRING }, // Username for display/legacy compat
    assignedToId: { type: DataTypes.INTEGER }, // FK to User
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    progress: { type: DataTypes.INTEGER, defaultValue: 0 },
    priority: { type: DataTypes.STRING, defaultValue: 'Medium' },
    startDate: { type: DataTypes.DATE },
    dueDate: { type: DataTypes.DATE },
    description: { type: DataTypes.TEXT } // Extended description
});

// 6. COMMENT
const Comment = sequelize.define('Comment', {
    text: { type: DataTypes.TEXT, allowNull: false },
    todoId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    username: { type: DataTypes.STRING } // Cached username
});

// 7. NOTIFICATION
const Notification = sequelize.define('Notification', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // ASSIGNED, UPDATE, MENTION, SYSTEM
    message: { type: DataTypes.STRING, allowNull: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    link: { type: DataTypes.STRING }, // Direct link to resource
    relatedEntityId: { type: DataTypes.INTEGER }
});

// 8. ACTIVITY LOG
const ActivityLog = sequelize.define('ActivityLog', {
    action: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    organizationId: { type: DataTypes.INTEGER }, // Global org activity
    departmentId: { type: DataTypes.INTEGER }, // Dept specific activity
    projectId: { type: DataTypes.INTEGER } // Project specific activity
});

// 9. PROJECT MEMBERS (Junction Table with Role)
const ProjectMembers = sequelize.define('ProjectMembers', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    projectId: { type: DataTypes.INTEGER, references: { model: Project, key: 'id' } },
    userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
    role: { type: DataTypes.STRING, defaultValue: 'Member' }
});

// --- ASSOCIATIONS ---

// Org hierarchy
Organization.hasMany(User, { foreignKey: 'organizationId' });
User.belongsTo(Organization, { foreignKey: 'organizationId' });

Organization.hasMany(Department, { foreignKey: 'organizationId' });
Department.belongsTo(Organization, { foreignKey: 'organizationId' });

Department.hasMany(User, { foreignKey: 'departmentId' }); // User belongs to a Department
User.belongsTo(Department, { foreignKey: 'departmentId' });

Department.hasMany(Project, { foreignKey: 'departmentId' });
Project.belongsTo(Department, { foreignKey: 'departmentId' });

Project.hasMany(Todo, { foreignKey: 'projectId' });
Todo.belongsTo(Project, { foreignKey: 'projectId' });

// Management Relationships
User.hasMany(Department, { foreignKey: 'managerId', as: 'ManagedDepartments' });
Department.belongsTo(User, { foreignKey: 'managerId', as: 'Manager' });

User.hasMany(Project, { foreignKey: 'managerId', as: 'ManagedProjects' });
Project.belongsTo(User, { foreignKey: 'managerId', as: 'Manager' });

// Task Assignment
User.hasMany(Todo, { foreignKey: 'assignedToId' });
Todo.belongsTo(User, { foreignKey: 'assignedToId' });

// Project Membership (Many-to-Many)
User.belongsToMany(Project, { through: ProjectMembers, foreignKey: 'userId', otherKey: 'projectId', as: 'Projects' });
Project.belongsToMany(User, { through: ProjectMembers, foreignKey: 'projectId', otherKey: 'userId', as: 'Members' });

// Comments
Todo.hasMany(Comment, { foreignKey: 'todoId' });
Comment.belongsTo(Todo, { foreignKey: 'todoId' });
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// Activity Logs
ActivityLog.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ActivityLog, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    Organization,
    User,
    Department,
    Project,
    Todo, // Export as Todo to match DB definition, but alias as Task if needed
    Task: Todo, // Alias for convenience
    Comment,
    Notification,
    ActivityLog,
    ProjectMembers
};
