const { Sequelize } = require('sequelize');
const { User, Organization } = require('./server/models');

async function checkUser() {
    try {
        const user = await User.findOne({
            where: { email: 'deniz@deniz.com' },
            include: [Organization]
        });

        if (user) {
            console.log("User found:", JSON.stringify(user.toJSON(), null, 2));
        } else {
            console.log("User 'deniz@deniz.com' NOT FOUND.");
        }
    } catch (err) {
        console.error("Error checking user:", err);
    } finally {
        process.exit();
    }
}

checkUser();
