const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const Redis = require('ioredis');
const http = require('http');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname) // Unique filename
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Models
const { sequelize, User, Organization, Department, Project, Todo, Comment, Notification, ActivityLog } = require('./models');

// Redis Connection
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

// ... (Rest of Associations unchanged) ...

// --- CACHE HELPERS ---
const getCache = async (key) => {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
};

const setCache = async (key, value, ttl = 3600) => {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
};

const clearCachePrefix = async (prefix) => {
    const keys = await redis.keys(`${prefix}:*`);
    if (keys.length > 0) {
        await redis.del(keys);
    }
};

const notifyUser = async (userId, type, message, link, relatedEntityId = null) => {
    try {
        await Notification.create({ userId, type, message, link, relatedEntityId });
    } catch (e) { console.error("Notification Error:", e); }
};

const logActivity = async (userId, action, description, organizationId = null, departmentId = null, projectId = null) => {
    try {
        await ActivityLog.create({ userId, action, description, organizationId, departmentId, projectId });
    } catch (err) { console.error("Activity Log Error:", err); }
};

// --- AUTH HELPER ---
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, orgId: user.organizationId },
        process.env.JWT_SECRET || 'fallback_secret_not_for_prod',
        { expiresIn: '24h' }
    );
};

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_not_for_prod');
        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(401).json({ message: "User not found" });
        req.user = user;
        next();
    } catch (e) {
        console.error("Auth Middleware Error:", e);
        res.status(403).json({ message: "Invalid or expired token" });
    }
};

// --- ROUTES ---

// 1. AUTH & REGISTRATION FLOW

// --- ROUTES ---

// 1. AUTH & REGISTRATION FLOW

// Register Organization & Super Admin (Composite Wizard) with Logo Upload
app.post('/api/auth/register-org', upload.single('logo'), async (req, res) => {
    // Expected Payload (Multipart):
    // orgName, adminEmail, adminPassword, adminUsername, deptName
    // members (JSON string), logo (File)

    // Parse JSON fields if they come as strings (Multipart/form-data quirk)
    let { orgName, adminEmail, adminPassword, adminUsername, members, deptName } = req.body;

    if (typeof members === 'string') {
        try { members = JSON.parse(members); } catch (e) { members = []; }
    }

    const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const t = await sequelize.transaction();

    try {
        // 1. Create Org
        const org = await Organization.create({
            name: orgName,
            logoUrl: logoUrl
        }, { transaction: t });

        // 2. Create Super Admin
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = await User.create({
            username: adminUsername,
            email: adminEmail,
            password: hashedAdminPassword,
            role: 'Super Admin',
            organizationId: org.id
        }, { transaction: t });

        // 3. Create First Department
        const department = await Department.create({
            name: deptName || 'General',
            organizationId: org.id,
            managerId: adminUser.id
        }, { transaction: t });

        // Admin belongs to this Dept
        adminUser.departmentId = department.id;
        await adminUser.save({ transaction: t });

        // 4. Create Members
        if (members && Array.isArray(members) && members.length > 0) {
            for (const member of members) {
                if (!member.email) continue;

                const defaultPass = await bcrypt.hash('welcome123', 10);
                await User.create({
                    username: member.email.split('@')[0],
                    email: member.email,
                    password: defaultPass,
                    role: member.role || 'Member',
                    organizationId: org.id,
                    departmentId: department.id
                }, { transaction: t });
            }
        }

        await t.commit();
        res.status(201).json({ message: "Organization created successfully", orgId: org.id, userId: adminUser.id });

    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(400).json({ message: "Registration failed. " + err.message });
    }
});

// Demo Login
const seedDemoData = require('./demoSeed');

app.post('/api/auth/demo', async (req, res) => {
    try {
        let user = await seedDemoData();

        // If seed returned null for some reason (rare but possible with DB issues)
        if (!user) {
            console.warn("Demo Seed returned null. Checking for fallback user.");
            user = await User.findOne({ where: { email: 'super@demo.com' } });
        }

        if (!user) {
            return res.status(500).json({ message: "Demo mode initialization failed: Super Admin not found." });
        }

        // Fetch Org and Dept for UI Context
        const org = await Organization.findByPk(user.organizationId);
        const department = user.departmentId ? await Department.findByPk(user.departmentId) : null;

        // Return User Data with Token
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            organizationId: user.organizationId,
            email: user.email,
            departmentId: user.departmentId,
            departmentName: department ? department.name : null,
            logoUrl: org ? org.logoUrl : null,
            orgName: org ? org.name : null,
            isDepartmentManager: user.role === 'Super Admin' || user.role === 'Department Manager',
            token: generateToken(user)
        });
    } catch (e) {
        console.error("Demo Login Error:", e);
        res.status(500).json({ message: "Failed to initialize demo mode: " + e.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log("Login Attempt:", req.body); // Check what's coming in
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ where: { email } });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Fetch Org Logo for UI Context
        const org = await Organization.findByPk(user.organizationId);

        // Fetch Department Name
        const department = user.departmentId ? await Department.findByPk(user.departmentId) : null;

        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            organizationId: user.organizationId,
            email: user.email,
            departmentId: user.departmentId,
            departmentName: department ? department.name : null,
            logoUrl: org ? org.logoUrl : null,
            orgName: org ? org.name : null,
            isDepartmentManager: user.role === 'Super Admin' || user.role === 'Department Manager',
            token: generateToken(user)
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Login failed: " + err.message });
    }
});

// Alias for legacy Login component compatibility
app.post('/api/login', async (req, res) => {
    // Forward to auth login logic
    const { username, email, password } = req.body;
    try {
        const user = await User.findOne({
            where: email ? { email } : { username }
        });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const org = await Organization.findByPk(user.organizationId);
        const department = user.departmentId ? await Department.findByPk(user.departmentId) : null;

        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            organizationId: user.organizationId,
            email: user.email,
            departmentId: user.departmentId,
            departmentName: department ? department.name : null,
            logoUrl: org ? org.logoUrl : null,
            orgName: org ? org.name : null,
            isDepartmentManager: user.role === 'Super Admin' || user.role === 'Department Manager',
            token: generateToken(user)
        });
    } catch (err) {
        res.status(500).json({ message: "Login failed: " + err.message });
    }
});

// Verify Session
app.get('/api/me', requireAuth, async (req, res) => {
    try {
        const org = await Organization.findByPk(req.user.organizationId);
        const department = req.user.departmentId ? await Department.findByPk(req.user.departmentId) : null;
        res.json({
            id: req.user.id,
            username: req.user.username,
            role: req.user.role,
            organizationId: req.user.organizationId,
            email: req.user.email,
            departmentId: req.user.departmentId,
            departmentName: department ? department.name : null,
            logoUrl: org ? org.logoUrl : null,
            orgName: org ? org.name : null,
            isDepartmentManager: req.user.role === 'Super Admin' || req.user.role === 'Department Manager',
            token: generateToken(req.user)
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching session info" });
    }
});

// 2. ORGANIZATION MANAGEMENT (Super Admin)

// Get Org Details (Hierarchy)
app.get('/api/organization', requireAuth, async (req, res) => {
    if (req.user.role !== 'Super Admin') return res.status(403).json({ message: "Forbidden" });

    const org = await Organization.findByPk(req.user.organizationId, {
        include: [
            {
                model: Department,
                include: [{ model: User, as: 'Manager', attributes: ['id', 'username'] }]
            },
            { model: User, attributes: ['id', 'username', 'role', 'email'] }
        ]
    });
    res.json(org);
});

// Organization Users - Filtered and Grouped
app.get('/api/organization/users', requireAuth, async (req, res) => {
    try {
        const { role } = req.query;
        let whereClause = { organizationId: req.user.organizationId };

        if (role) {
            whereClause.role = role;
        }

        const users = await User.findAll({
            where: whereClause,
            attributes: ['id', 'username', 'email', 'role', 'departmentId'],
            include: [
                { model: Project, as: 'Projects', attributes: ['id', 'name'] },
                { model: Department, attributes: ['id', 'name'] }
            ]
        });
        res.json(users);
    } catch (err) {
        console.error("GET /api/organization/users Error:", err);
        res.status(500).json({ message: "Failed to fetch users: " + err.message });
    }
});

// Alias for Team Page compatibility
app.get('/api/users', requireAuth, async (req, res) => {
    try {
        const users = await User.findAll({
            where: { organizationId: req.user.organizationId },
            include: [{ model: Project, as: 'Projects' }, Department]
        });
        res.json(users);
    } catch (err) {
        console.error("GET /api/users Error:", err);
        res.status(500).json({ message: "Failed to fetch users: " + err.message });
    }
});

// Add User to Org (Direct Add)
app.post('/api/organization/users', requireAuth, async (req, res) => {
    if (req.user.role !== 'Super Admin' && req.user.role !== 'Department Manager') return res.status(403).json({ message: "Forbidden" });

    const { username, email, password, role, departmentId } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username, email, password: hashedPassword, role,
            organizationId: req.user.organizationId,
            departmentId: departmentId // Optional initial dept
        });

        await logActivity(req.user.id, 'USER_ADD', `Added user ${username} with email ${email} as ${role}`, req.user.organizationId);
        res.status(201).json(newUser);
    } catch (err) {
        console.error("POST /api/organization/users Error:", err);
        res.status(400).json({ message: "Error adding user: " + err.message });
    }
});

// Alias for legacy CreateUserModal compatibility
app.post('/api/users', requireAuth, async (req, res) => {
    // Forward to organization users logic
    const { username, email, password, role, departmentId } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: "Email is required for all new users." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            email: email, // Strict email requirement
            password: hashedPassword,
            role: role === 'Admin' ? 'Department Manager' : (role === 'Manager' ? 'Project Manager' : 'Member'),
            organizationId: req.user.organizationId,
            departmentId: departmentId || req.user.departmentId
        });

        await logActivity(req.user.id, 'USER_ADD', `Added user ${username} with email ${email} as ${role}`, req.user.organizationId);
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: "Error adding user: " + err.message });
    }
});

// Admin User Update
app.put('/api/admin/users/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'Super Admin' && req.user.role !== 'Department Manager') return res.status(403).json({ message: "Forbidden" });

    try {
        const { username, email, password, role, departmentId } = req.body;
        const targetUser = await User.findByPk(req.params.id);

        if (!targetUser || targetUser.organizationId !== req.user.organizationId) {
            return res.status(404).json({ message: "User not found" });
        }

        if (username) targetUser.username = username;
        if (email) targetUser.email = email;
        if (role) targetUser.role = role;
        if (departmentId) targetUser.departmentId = departmentId;
        if (password) {
            targetUser.password = await bcrypt.hash(password, 10);
        }

        await targetUser.save();
        await logActivity(req.user.id, 'USER_UPDATE', `Updated user ${targetUser.username}`, req.user.organizationId);
        res.json(targetUser);
    } catch (err) {
        res.status(500).json({ message: "Update failed: " + err.message });
    }
});

// Admin User Delete
app.delete('/api/admin/users/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'Super Admin') return res.status(403).json({ message: "Forbidden" });

    try {
        const targetUser = await User.findByPk(req.params.id);
        if (!targetUser || targetUser.organizationId !== req.user.organizationId) {
            return res.status(404).json({ message: "User not found" });
        }

        // Unassign properly from all tasks
        await Todo.update(
            { assignedToId: null, assignedTo: 'Unassigned' },
            { where: { assignedToId: targetUser.id } }
        );

        await targetUser.destroy();
        await logActivity(req.user.id, 'USER_DELETE', `Deleted user ${targetUser.username}`, req.user.organizationId);
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
});

// Move User to Department
app.put('/api/organization/users/:userId/move', requireAuth, async (req, res) => {
    // Only Super Admin or Dept Manager can move users
    if (req.user.role !== 'Super Admin' && req.user.role !== 'Department Manager') return res.status(403).json({ message: "Forbidden" });

    const { targetDepartmentId } = req.body;
    const targetUser = await User.findByPk(req.params.userId);

    if (!targetUser || targetUser.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "User not found in your organization" });
    }

    const department = await Department.findByPk(targetDepartmentId);
    if (!department || department.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "Target Department not found" });
    }

    targetUser.departmentId = targetDepartmentId;
    await targetUser.save();

    await logActivity(req.user.id, 'USER_MOVE', `Moved user ${targetUser.username} to ${department.name}`, req.user.organizationId, targetDepartmentId);
    await notifyUser(targetUser.id, 'SYSTEM', `You have been moved to department: ${department.name}`, `/department/${department.id}`);

    res.json({ message: "User moved", user: targetUser });
});

// DEPARTMENT MANAGEMENT

// Create Department
app.post('/api/departments', requireAuth, async (req, res) => {
    if (req.user.role !== 'Super Admin') return res.status(403).json({ message: "Only Super Admin can create Departments" });

    try {
        const { name, managerId } = req.body;
        const department = await Department.create({
            name,
            organizationId: req.user.organizationId,
            managerId: managerId || req.user.id
        });

        if (managerId && managerId !== req.user.id) {
            await notifyUser(managerId, 'ASSIGNED', `You have been assigned as Manager of ${name}`, `/department/${department.id}`);
        }

        res.status(201).json(department);
    } catch (err) {
        res.status(500).json({ message: "Error creating department" });
    }
});

// Get Departments
app.get('/api/departments', requireAuth, async (req, res) => {
    const where = { organizationId: req.user.organizationId };

    if (req.user.role === 'Department Manager') {
        where.managerId = req.user.id;
    }

    const departments = await Department.findAll({
        where,
        include: [{ model: Project }]
    });
    res.json(departments);
});

// Switch Department
app.post('/api/departments/switch/:id', requireAuth, async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);
        if (!department || department.organizationId !== req.user.organizationId) {
            return res.status(404).json({ message: "Department not found" });
        }

        // Only Super Admin can switch freely, or Dept Manager to their own (already filtered in list)
        // For simplicity: Update user's departmentId
        req.user.departmentId = department.id;
        await req.user.save();

        res.json({
            message: "Switched successfully",
            departmentId: department.id,
            departmentName: department.name
        });
    } catch (err) {
        res.status(500).json({ message: "Switch failed" });
    }
});

// 4. PROJECT MANAGEMENT

// 4. PROJECT MANAGEMENT

// Create Project (Global endpoint used by Modal)
app.post('/api/projects', requireAuth, async (req, res) => {
    // Allow Super Admin, Department Manager, and Project Manager
    if (!['Super Admin', 'Department Manager', 'Project Manager'].includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    try {
        const { name, startDate, endDate, members } = req.body;

        // Use user's current department context
        const departmentId = req.user.departmentId;

        if (!departmentId) {
            return res.status(400).json({ message: "Please switch to a department context first." });
        }

        const project = await Project.create({
            name,
            departmentId,
            managerId: req.user.id, // Creator becomes manager by default
            description: '', // Optional
            status: 'Active'
        });

        // Add members if provided
        // Add members if provided
        if (members && Array.isArray(members) && members.length > 0) {
            // Add creator as Manager if not in list (optional, but good practice)
            // But let's stick to provided list.
            for (const memberId of members) {
                // Use default role 'Member' or can extend payload to include roles
                // For creation, usually just members. Creator is Manager.
                // We can use the same logic as PUT if needed, but start simple.
                try {
                    await project.addMember(memberId, { through: { role: 'Member' } });
                } catch (e) {
                    console.error(`Failed to add member ${memberId}:`, e);
                }
            }
        }

        // Ensure Creator is added as Manager
        const creatorExists = members && members.includes(req.user.id);
        if (!creatorExists) {
            await project.addMember(req.user.id, { through: { role: 'Manager' } });
        }

        await logActivity(req.user.id, 'PROJ_CREATE', `Created project ${name}`, req.user.organizationId, departmentId, project.id);

        res.status(201).json(project);
    } catch (err) {
        console.error("Project Creation Error:", err);
        res.status(500).json({ message: "Error creating project: " + err.message });
    }
});

// Get Projects (Filtered by Role)
app.get('/api/projects', requireAuth, async (req, res) => {
    let projects;

    if (req.user.role === 'Super Admin') {
        projects = await Project.findAll({
            include: [
                { model: Department, where: { organizationId: req.user.organizationId } },
                { model: User, as: 'Members', through: { attributes: ['role'] } }
            ]
        });
    } else if (req.user.role === 'Department Manager') {
        projects = await Project.findAll({
            include: [
                {
                    model: Department,
                    where: { organizationId: req.user.organizationId, managerId: req.user.id }
                },
                { model: User, as: 'Members', through: { attributes: ['role'] } }
            ]
        });
    } else if (req.user.role === 'Project Manager') {
        projects = await Project.findAll({
            where: {
                [Op.or]: [
                    { managerId: req.user.id },
                    { '$Members.id$': req.user.id }
                ]
            },
            include: [{
                model: User,
                as: 'Members',
                through: { attributes: ['role'] }
            }],
            subQuery: false
        });
    } else {
        // Members see only projects they are members of
        projects = await Project.findAll({
            where: { '$Members.id$': req.user.id },
            include: [{
                model: User,
                as: 'Members',
                through: { attributes: ['role'] }
            }],
            subQuery: false
        });
    }
    res.json(projects);
});

// Get Single Project (Details)
app.get('/api/projects/:id', requireAuth, async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'Members',
                    through: { attributes: ['role'] } // Include Members and their roles
                },
                {
                    model: Todo,
                    include: [{ model: User }] // Include Tasks and their assignees
                },
                { model: Department }
            ]
        });

        if (!project) return res.status(404).json({ message: "Project not found" });

        // Access check:
        // - Super Admin: Yes
        // - Dept Manager: If matches Dept
        // - Project Manager: If matches Manager
        // - Member: If exists in project.Users (Members) OR (for simplicity/transparency) if in same Org?
        // Let's stick to transparency for now: If in same Org (via Department -> Org).

        // For now, simpler check:
        res.json(project);
    } catch (err) {
        console.error("Get Project Error:", err);
        res.status(500).json({ message: "Error fetching project" });
    }
});

// Update Project (including members)
app.put('/api/projects/:id', requireAuth, async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Permission Check: Super Admin, Dept Manager (of project's dept), or Project Manager (of this project)
        const canEdit = req.user.role === 'Super Admin' ||
            (req.user.role === 'Department Manager' && req.user.departmentId === project.departmentId) ||
            (req.user.role === 'Project Manager' && project.managerId === req.user.id) || project.managerId === req.user.id;

        if (!canEdit) return res.status(403).json({ message: "Forbidden" });

        const { name, startDate, endDate, status, isArchived, members, memberRoles } = req.body;

        await project.update({
            name,
            startDate,
            endDate,
            status,
            isArchived
        });

        // Update Members if provided
        if (members && Array.isArray(members)) {
            // "members" is an array of User IDs
            // We need to sync this list.
            // Also need to handle roles if "memberRoles" object provided { userId: role }

            // Standard Sequelize setUsers might overwrite extra attributes in through table if not careful.
            // We will explicitly manage the junction table entries to save roles.

            // First, get current members to diff? Or just clear and re-add?
            // Re-adding is safer for full sync but might lose other metadata if any.
            // Given "ProjectMembers" likely only has 'role', we can just overwrite.

            // However, Sequelize `setUsers` with `through` attributes requires a specific format or individual add calls.
            // Simplest approach: Use setUsers to establish relationships, then update roles.

            await project.setMembers(members);

            // Now update roles if provided
            if (memberRoles) {
                for (const memberId of members) {
                    const role = memberRoles[memberId] || 'Member';
                    await project.addMember(memberId, { through: { role: role } });
                }
            }
        }

        await logActivity(req.user.id, 'PROJ_UPDATE', `Updated project ${project.name}`, req.user.organizationId, project.departmentId, project.id);

        // Return updated project with members
        const updatedProject = await Project.findByPk(project.id, {
            include: [{
                model: User,
                as: 'Members',
                through: { attributes: ['role'] } // Include role from junction
            }]
        });

        res.json(updatedProject);
    } catch (err) {
        console.error("Update Project Error:", err);
        res.status(500).json({ message: "Error updating project" });
    }
});

// Project Member Management
app.post('/api/projects/:id/members', requireAuth, async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const { userId, role } = req.body;
        if (!userId) return res.status(400).json({ message: "UserId is required" });

        await project.addMember(userId, { through: { role: role || 'Member' } });
        await logActivity(req.user.id, 'PROJ_MEMBER_ADD', `Added user ${userId} to project ${project.name}`, req.user.organizationId, project.departmentId, project.id);

        res.json({ success: true });
    } catch (err) {
        console.error("Add Project Member Error:", err);
        res.status(500).json({ message: "Error adding project member" });
    }
});

app.delete('/api/projects/:id/members', requireAuth, async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: "UserId is required" });

        await project.removeMember(userId);
        await logActivity(req.user.id, 'PROJ_MEMBER_REMOVE', `Removed user ${userId} from project ${project.name}`, req.user.organizationId, project.departmentId, project.id);

        res.json({ success: true });
    } catch (err) {
        console.error("Remove Project Member Error:", err);
        res.status(500).json({ message: "Error removing project member" });
    }
});

// 5. TASKS

app.post('/api/projects/:projectId/todos', requireAuth, async (req, res) => {
    try {
        let assignedToName = req.body.assignedTo;

        const assignedToId = req.body.assignedToId || null;
        const startDate = req.body.startDate || null;
        const dueDate = req.body.dueDate || null;

        const project = await Project.findByPk(req.params.projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Auto-add to project members if not already there
        const assignedToIdInt = assignedToId ? parseInt(assignedToId) : null;

        // Auto-add to project members if not already there
        if (assignedToIdInt) {
            try {
                const isMember = await project.hasMember(assignedToIdInt);
                if (!isMember) {
                    await project.addMember(assignedToIdInt, { through: { role: 'Member' } });
                }
            } catch (e) {
                console.log("Auto-add member skip or error:", e.message);
            }
        }

        const todo = await Todo.create({
            text: req.body.text,
            projectId: parseInt(req.params.projectId),
            assignedToId: assignedToIdInt,
            assignedTo: assignedToName,
            startDate: startDate,
            dueDate: dueDate
        });

        // Notify Assignee
        if (req.body.assignedToId && req.body.assignedToId !== req.user.id) {
            await notifyUser(req.body.assignedToId, 'ASSIGNED', `Task assigned: ${todo.text}`, `/project/${req.params.projectId}/task/${todo.id}`);
        }

        res.status(201).json(todo);
    } catch (err) {
        console.error("Create Task Full Error:", err);
        res.status(400).json({ message: "Error creating task", error: err.message });
    }
});

app.get('/api/projects/:projectId/todos', requireAuth, async (req, res) => {
    const todos = await Todo.findAll({ where: { projectId: req.params.projectId } });
    res.json(todos);
});

app.put('/api/todos/:id', requireAuth, async (req, res) => {
    try {
        const updates = { ...req.body };
        if (updates.assignedToId === "") updates.assignedToId = null;
        if (updates.startDate === "") updates.startDate = null;
        if (updates.dueDate === "") updates.dueDate = null;

        // Auto-update progress based on status
        if (updates.status === 'Done') {
            updates.progress = 100;
        } else if (updates.status === 'To Do') {
            updates.progress = 0;
        }

        // If assigning to a new person by ID, update the name too
        if (updates.assignedToId) {
            const assignee = await User.findByPk(updates.assignedToId);
            if (assignee) {
                updates.assignedTo = assignee.username;
            }
        }

        const todo = await Todo.findByPk(req.params.id);
        if (!todo) return res.status(404).json({ message: "Task not found" });

        // Auto-add to project members if assignee changed and they aren't members
        if (updates.assignedToId) {
            const project = await Project.findByPk(todo.projectId);
            if (project) {
                try {
                    const isMember = await project.hasMember(parseInt(updates.assignedToId));
                    if (!isMember) {
                        await project.addMember(parseInt(updates.assignedToId), { through: { role: 'Member' } });
                    }
                } catch (e) {
                    console.log("Auto-add on update skip:", e.message);
                }
            }
        }

        await Todo.update(updates, { where: { id: req.params.id } });
        const updatedTodo = await Todo.findByPk(req.params.id);

        // Notify if status changed
        if (req.body.status && req.body.status !== 'To Do') {
            // Simplified notification logic
        }

        res.json(todo);
    } catch (err) {
        console.error("Update Task Error:", err);
        res.status(500).json({ message: "Error updating task" });
    }
});

// TASK COMMENTS
app.get('/api/todos/:id/comments', requireAuth, async (req, res) => {
    try {
        const comments = await Comment.findAll({
            where: { todoId: req.params.id },
            order: [['createdAt', 'ASC']]
        });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: "Error fetching comments" });
    }
});

app.post('/api/todos/:id/comments', requireAuth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "Comment text is required" });

        const comment = await Comment.create({
            text,
            todoId: req.params.id,
            userId: req.user.id,
            username: req.user.username
        });

        // Mention Detection Logic (@username)
        const mentionMatch = text.match(/@(\w+)/g);
        if (mentionMatch) {
            for (const mention of mentionMatch) {
                const username = mention.substring(1);
                const mentionedUser = await User.findOne({ where: { username } });
                if (mentionedUser && mentionedUser.id !== req.user.id) {
                    await notifyUser(
                        mentionedUser.id,
                        'MENTION',
                        `You were mentioned by ${req.user.username}: ${text.substring(0, 50)}...`,
                        `/project/${req.body.projectId || 'view'}/task/${req.params.id}`,
                        req.params.id
                    );
                }
            }
        }

        res.status(201).json(comment);
    } catch (err) {
        console.error("Comment Post Error:", err);
        res.status(500).json({ message: "Error posting comment" });
    }
});

// USER SEARCH (for mentions)
app.get('/api/users/search', requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const users = await User.findAll({
            where: {
                organizationId: req.user.organizationId,
                username: { [Sequelize.Op.iLike]: `%${q}%` }
            },
            attributes: ['id', 'username', 'email'],
            limit: 5
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Search failed" });
    }
});

// 6. NOTIFICATIONS
app.get('/api/notifications', requireAuth, async (req, res) => {
    const notifs = await Notification.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 20
    });
    res.json(notifs);
});

// Admin Activity Log
app.get('/api/admin/activity', requireAuth, async (req, res) => {
    try {
        // Only Super Admin can see all org activity
        const whereClause = { organizationId: req.user.organizationId };

        // If Dept Manager, further filter (optional, usually they see Org level in this app)
        const activity = await ActivityLog.findAll({
            where: whereClause,
            include: [{ model: User, attributes: ['username'] }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(activity);
    } catch (err) {
        console.error("GET /api/admin/activity Error:", err);
        res.status(500).json({ message: "Failed to fetch activity" });
    }
});

app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
    await Notification.update({ read: true }, { where: { id: req.params.id, userId: req.user.id } });
    res.json({ success: true });
});

// SYNC DB
// Sync Database
sequelize.sync({ alter: true }).then(() => {
    console.log("Database Synced (Alter Mode)");
    // Create Default Super Admin for testing if needed, or rely on Register Flow
});

// NOTE: Use app.listen now
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
