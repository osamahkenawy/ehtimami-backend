const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Seeding Roles & User Statuses...");

    const roles = [
        { id: 1, name: "admin" },
        { id: 2, name: "teacher" },
        { id: 3, name: "student" },
        { id: 4, name: "parent" },
        { id: 5, name: "school_manager" } // New role
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

    console.log("✅ Roles & User Statuses seeded successfully.");

    // ✅ Seed a School Manager User
    const managerEmail = "manager@school.com";
    let managerUser = await prisma.user.findUnique({ where: { email: managerEmail } });

    if (!managerUser) {
        const hashedPassword = await require("bcrypt").hash("School123456", 10);

        managerUser = await prisma.user.create({
            data: {
                firstName: "School",
                lastName: "Manager",
                email: managerEmail,
                password: hashedPassword,
                statusId: 1, // Active
                roles: { create: [{ roleId: 5 }] }, // Assign school_manager role
                profile: {
                    create: {
                        bio: "Principal of Ehtimami School",
                        avatar: "https://example.com/school-manager-avatar.jpg"
                    }
                }
            }
        });

        console.log("✅ School Manager user created.");
    } else {
        console.log("ℹ️ School Manager user already exists.");
    }

    // ✅ Seed a School
    const schoolUniqueId = "SCH-0001";
    let existingSchool = await prisma.school.findUnique({ where: { school_unique_id: schoolUniqueId } });

    if (!existingSchool) {
        await prisma.school.create({
            data: {
                school_unique_id: schoolUniqueId,
                school_name: "Ehtimami International School",
                school_address: "Riyadh, Saudi Arabia",
                school_lat: 24.7136,
                school_lng: 46.6753,
                school_type: "INTERNATIONAL",
                school_manager_id: managerUser.id, // Assign the manager
                school_email: "contact@ehtimami.edu.sa",
                school_phone: "+966123456789",
                school_region: "Riyadh",
                school_city: "Riyadh",
                school_district: "Al Olaya",
                education_level: "PRIMARY",
                curriculum: "SAUDI_NATIONAL"
            }
        });

        console.log("✅ School 'Ehtimami International School' created.");
    } else {
        console.log("ℹ️ School already exists.");
    }
}

main()
    .catch((error) => {
        console.error("❌ Error seeding:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
