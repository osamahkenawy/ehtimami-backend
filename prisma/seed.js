const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt"); 

const prisma = new PrismaClient();

async function main() {
    const roles = [
        { id: 1, name: "admin" },
        { id: 2, name: "teacher" },
        { id: 3, name: "student" },
        { id: 4, name: "parent" }
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { id: role.id },
            update: {},
            create: role,
        });
    }

    const statuses = [
        { id: 1, name: "Active" },
        { id: 2, name: "Inactive" },
        { id: 3, name: "Terminated" }
    ];

    for (const status of statuses) {
        await prisma.userStatus.upsert({
            where: { id: status.id },
            update: {},
            create: status,
        });
    }

    // ✅ Seed Default Admin User
    const adminEmail = "admin@ehtimami.com";
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash("Ehtimami123456", 10); // ✅ Properly hash password

        await prisma.user.create({
            data: {
                firstName: "Admin",
                lastName: "User",
                email: adminEmail,
                password: hashedPassword,
                statusId: 1, // Active by default
                roles: { create: [{ roleId: 1 }] }, // Assign admin role
                profile: {
                    create: {
                        bio: "Default admin user",
                        avatar: "https://example.com/admin-avatar.jpg"
                    }
                }
            }
        });

        console.log("✅ Admin user created successfully.");
    } else {
        console.log("ℹ️ Admin user already exists.");
    }

    console.log("✅ Roles & User Statuses seeded successfully.");
}

main()
    .catch((error) => {
        console.error("❌ Error seeding:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
