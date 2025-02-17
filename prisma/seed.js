const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    // ✅ Seed Roles
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

    // ✅ Seed User Statuses
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
