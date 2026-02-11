const bcrypt = require('bcryptjs');
const { User, Organization, Department, Project, Task, Message, Notification, ActivityLog } = require('./models');

const seedDemoData = async () => {
    console.log("🌱 Starting Demo Data Seeding...");

    // 1. Check if Demo Corp exists
    let org = await Organization.findOne({ where: { name: 'Demo Corp' } });
    if (org) {
        console.log("ℹ️ Demo Corp already exists. Skipping seed.");
        // Return the super admin for login
        const superAdmin = await User.findOne({ where: { email: 'super@demo.com' } });
        return superAdmin;
    }

    try {
        // 2. Create Organization
        org = await Organization.create({
            name: 'Demo Corp',
            logoUrl: 'https://ui-avatars.com/api/?name=Demo+Corp&background=6366f1&color=fff&size=128'
        });

        // 3. Create Users (20+ Users)
        const commonPassword = await bcrypt.hash('demo123', 10);

        // -- Super Admins (2) --
        const superAdmin = await User.create({ username: 'super_admin', email: 'super@demo.com', password: commonPassword, role: 'Super Admin', organizationId: org.id });
        const secondAdmin = await User.create({ username: 'system_admin', email: 'sys@demo.com', password: commonPassword, role: 'Super Admin', organizationId: org.id });

        // -- Department Managers (4) --
        const alice = await User.create({ username: 'alice_eng', email: 'alice@demo.com', password: commonPassword, role: 'Department Manager', organizationId: org.id });
        const bob = await User.create({ username: 'bob_mkt', email: 'bob@demo.com', password: commonPassword, role: 'Department Manager', organizationId: org.id });
        const charlie = await User.create({ username: 'charlie_ops', email: 'charlie@demo.com', password: commonPassword, role: 'Department Manager', organizationId: org.id });
        const diana = await User.create({ username: 'diana_hr', email: 'diana@demo.com', password: commonPassword, role: 'Department Manager', organizationId: org.id });

        // -- Project Managers (6) --
        const pm1 = await User.create({ username: 'pm_cloud', email: 'pm1@demo.com', password: commonPassword, role: 'Project Manager', organizationId: org.id });
        const pm2 = await User.create({ username: 'pm_mobile', email: 'pm2@demo.com', password: commonPassword, role: 'Project Manager', organizationId: org.id });
        const pm3 = await User.create({ username: 'pm_brand', email: 'pm3@demo.com', password: commonPassword, role: 'Project Manager', organizationId: org.id });
        const pm4 = await User.create({ username: 'pm_social', email: 'pm4@demo.com', password: commonPassword, role: 'Project Manager', organizationId: org.id });
        const pm5 = await User.create({ username: 'pm_logistics', email: 'pm5@demo.com', password: commonPassword, role: 'Project Manager', organizationId: org.id });
        const pm6 = await User.create({ username: 'pm_hiring', email: 'pm6@demo.com', password: commonPassword, role: 'Project Manager', organizationId: org.id });

        // -- Members (10+) --
        const dev1 = await User.create({ username: 'jake_dev', email: 'jake@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });
        const dev2 = await User.create({ username: 'sarah_dev', email: 'sarah@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });
        const dr1 = await User.create({ username: 'emily_des', email: 'emily@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });
        const an1 = await User.create({ username: 'mike_anl', email: 'mike@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });
        const dev3 = await User.create({ username: 'kevin_dev', email: 'kevin@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });
        const dev4 = await User.create({ username: 'maria_dev', email: 'maria@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });
        const mkt1 = await User.create({ username: 'lucy_mkt', email: 'lucy@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });
        const mkt2 = await User.create({ username: 'sam_mkt', email: 'sam@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });
        const ops1 = await User.create({ username: 'tom_ops', email: 'tom@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });
        const hr1 = await User.create({ username: 'lisa_hr', email: 'lisa@demo.com', password: commonPassword, role: 'Member', organizationId: org.id });

        // 4. Create Departments
        const engDept = await Department.create({ name: 'Engineering', organizationId: org.id, managerId: alice.id });
        const mktDept = await Department.create({ name: 'Marketing', organizationId: org.id, managerId: bob.id });
        const opsDept = await Department.create({ name: 'Operations', organizationId: org.id, managerId: charlie.id });
        const hrDept = await Department.create({ name: 'Human Resources', organizationId: org.id, managerId: diana.id });

        // Assign Users to Departments
        await Promise.all([
            superAdmin.update({ departmentId: engDept.id }),
            secondAdmin.update({ departmentId: engDept.id }),
            alice.update({ departmentId: engDept.id }),
            pm1.update({ departmentId: engDept.id }),
            pm2.update({ departmentId: engDept.id }),
            dev1.update({ departmentId: engDept.id }),
            dev2.update({ departmentId: engDept.id }),
            dev3.update({ departmentId: engDept.id }),
            dev4.update({ departmentId: engDept.id }),

            bob.update({ departmentId: mktDept.id }),
            pm3.update({ departmentId: mktDept.id }),
            pm4.update({ departmentId: mktDept.id }),
            dr1.update({ departmentId: mktDept.id }),
            mkt1.update({ departmentId: mktDept.id }),
            mkt2.update({ departmentId: mktDept.id }),

            charlie.update({ departmentId: opsDept.id }),
            pm5.update({ departmentId: opsDept.id }),
            an1.update({ departmentId: opsDept.id }),
            ops1.update({ departmentId: opsDept.id }),

            diana.update({ departmentId: hrDept.id }),
            pm6.update({ departmentId: hrDept.id }),
            hr1.update({ departmentId: hrDept.id })
        ]);

        // 5. Create Projects
        const pCloud = await Project.create({ name: 'Cloud Migration', description: 'Moving legacy infra to AWS', status: 'In Progress', departmentId: engDept.id, managerId: pm1.id });
        const pMobile = await Project.create({ name: 'Mobile App Refactor', description: 'Switching to Tailwind & Vite', status: 'Active', departmentId: engDept.id, managerId: pm2.id });
        const pAI = await Project.create({ name: 'GenAI Core', description: 'LLM integration for tasks', status: 'Active', departmentId: engDept.id, managerId: alice.id });

        const pBrand = await Project.create({ name: 'Global Identity', description: 'Rebranding for 2026', status: 'In Progress', departmentId: mktDept.id, managerId: pm3.id });
        const pLaunch = await Project.create({ name: 'Spring Launch', description: 'Major product update', status: 'Active', departmentId: mktDept.id, managerId: pm4.id });

        const pLogistics = await Project.create({ name: 'Fast Delivery', description: 'Optimize supply chain', status: 'Active', departmentId: opsDept.id, managerId: pm5.id });
        const pHiring = await Project.create({ name: 'Recruitment 2026', description: 'Hire 50 devs', status: 'Active', departmentId: hrDept.id, managerId: pm6.id });

        // 6. Create Tasks (Rich Dataset)
        const tasksPayload = [
            { text: 'Analyze AWS Costs', description: 'Review current spend', status: 'Done', priority: 'High', projectId: pCloud.id, assignedToId: pm1.id, assignedTo: pm1.username },
            { text: 'VPC Setup', description: 'Private subnets and gateways', status: 'Done', priority: 'Critical', projectId: pCloud.id, assignedToId: dev1.id, assignedTo: dev1.username },
            { text: 'DB Cluster Migration', description: 'Multi-AZ Aurora setup', status: 'In Progress', priority: 'Critical', projectId: pCloud.id, assignedToId: dev3.id, assignedTo: dev3.username },

            { text: 'Wireframes for Profile', description: 'Figma designs', status: 'Done', priority: 'Medium', projectId: pMobile.id, assignedToId: dev2.id, assignedTo: dev2.username },
            { text: 'Dark Mode Support', description: 'Use tailwind variant', status: 'In Progress', priority: 'Low', projectId: pMobile.id, assignedToId: dev4.id, assignedTo: dev4.username },

            { text: 'Model Benchmarking', description: 'Test GPT-4o vs Claude', status: 'In Review', priority: 'High', projectId: pAI.id, assignedToId: alice.id, assignedTo: alice.username },
            { text: 'Prompt Engineering', description: 'System prompts for agents', status: 'To Do', priority: 'Medium', projectId: pAI.id, assignedToId: dev1.id, assignedTo: dev1.username },

            { text: 'Color Palette Update', description: 'Vibrant indigo themes', status: 'Done', priority: 'High', projectId: pBrand.id, assignedToId: dr1.id, assignedTo: dr1.username },
            { text: 'Ad Creatives', description: '5 variations for IG', status: 'In Progress', priority: 'Medium', projectId: pLaunch.id, assignedToId: mkt1.id, assignedTo: mkt1.username },

            { text: 'Carrier Selection', description: 'Negotiate bulk rates', status: 'To Do', priority: 'High', projectId: pLogistics.id, assignedToId: an1.id, assignedTo: an1.username },
            { text: 'Diversity Review', description: 'Check hiring pipeline', status: 'In Progress', priority: 'Medium', projectId: pHiring.id, assignedToId: hr1.id, assignedTo: hr1.username }
        ];

        for (const t of tasksPayload) {
            await Task.create(t);
        }

        // 7. Messaging (Department Rooms)
        const engRoom = `department-${engDept.id}`;
        await Message.create({ text: "Super Admin joined the chat.", senderId: superAdmin.id, senderName: superAdmin.username, channelId: engRoom });
        await Message.create({ text: "Hey Engineering, how is the Cloud Migration going?", senderId: superAdmin.id, senderName: superAdmin.username, channelId: engRoom });
        await Message.create({ text: "We are at 80%. DB migration is in progress.", senderId: dev1.id, senderName: dev1.username, channelId: engRoom });
        await Message.create({ text: "The new model selection is looking promising.", senderId: alice.id, senderName: alice.username, channelId: engRoom });

        const mktRoom = `department-${mktDept.id}`;
        await Message.create({ text: "The Branding identity is almost finished.", senderId: pm3.id, senderName: pm3.username, channelId: mktRoom });
        await Message.create({ text: "Great. Let's start the campaign.", senderId: bob.id, senderName: bob.username, channelId: mktRoom });

        const orgRoom = `org-${org.id}`;
        await Message.create({ text: "Welcome everyone to our new TinyPM platform! 🚀", senderId: superAdmin.id, senderName: superAdmin.username, channelId: orgRoom });

        // 8. Notifications
        await Notification.create({ userId: superAdmin.id, type: 'assigned', message: 'You have a new task assigned.', link: '/tasks', isRead: false });

        console.log("✅ Demo Expansion Complete (Nomenclature: Department)");
        return superAdmin;

    } catch (e) {
        console.error("❌ Seeding Failed:", e);
        throw e;
    }
};

module.exports = seedDemoData;
