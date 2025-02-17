const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    const roles = ["admin", "teacher", "student", "parent"];

    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }

    console.log("✅ Roles seeded successfully.");
}

main()
    .catch((error) => {
        console.error("❌ Error seeding roles:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
