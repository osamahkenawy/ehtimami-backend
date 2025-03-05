const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Seeding Database...");

    // ✅ Seed Roles
    console.log("🌟 Seeding Roles...");
    const roles = [
        { id: 1, name: "admin" },
        { id: 2, name: "teacher" },
        { id: 3, name: "student" },
        { id: 4, name: "parent" },
        { id: 5, name: "school_manager" } // ✅ New role for school managers
    ];
    
    for (const role of roles) {
        await prisma.role.upsert({
            where: { id: role.id },
            update: {},
            create: role
        });
    }

    // ✅ Seed User Statuses
    console.log("🌟 Seeding User Statuses...");
    const statuses = [
        { id: 1, name: "Active" },
        { id: 2, name: "Inactive" },
        { id: 3, name: "Terminated" }
    ];
    
    for (const status of statuses) {
        await prisma.userStatus.upsert({
            where: { id: status.id },
            update: {},
            create: status
        });
    }

    // ✅ Seed School Statuses
    console.log("🌟 Seeding School Statuses...");
    const schoolStatuses = [
        { id: 1, name: "Active" },
        { id: 2, name: "Inactive" }
    ];
    
    for (const status of schoolStatuses) {
        await prisma.schoolStatus.upsert({
            where: { id: status.id },
            update: {},
            create: status
        });
    }

    // ✅ Seed a School Manager User
    console.log("👨‍🏫 Seeding School Manager...");
    const managerEmail = "manager@school.com";
    let managerUser = await prisma.user.findUnique({ where: { email: managerEmail } });

    if (!managerUser) {
        const hashedPassword = await bcrypt.hash("School123456", 10);

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
    console.log("🏫 Seeding School...");
    const schoolUniqueId = "SCH-0001";
    let existingSchool = await prisma.school.findUnique({ where: { school_unique_id: schoolUniqueId } });

    if (!existingSchool) {
        existingSchool = await prisma.school.create({
            data: {
                school_unique_id: schoolUniqueId,
                school_name: "Ehtimami International School",
                school_address: "Riyadh, Saudi Arabia",
                school_lat: 24.7136,
                school_lng: 46.6753,
                school_type: "INTERNATIONAL",
                school_manager_id: managerUser.id, // ✅ Correctly link manager to school
                school_email: "contact@ehtimami.edu.sa",
                school_phone: "+966123456789",
                school_region: "Riyadh",
                school_city: "Riyadh",
                school_district: "Al Olaya",
                education_level: "PRIMARY",
                curriculum: "SAUDI_NATIONAL",
                statusId: 1 // Active status
            }
        });

        console.log("✅ School 'Ehtimami International School' created.");
    } else {
        console.log("ℹ️ School already exists.");
    }

    // ✅ Seed a Teacher
    console.log("👨‍🏫 Seeding Teacher...");
    const teacherEmail = "teacher@school.com";
    let teacherUser = await prisma.user.findUnique({ where: { email: teacherEmail } });

    if (!teacherUser) {
        const hashedPassword = await bcrypt.hash("Teacher123456", 10);

        teacherUser = await prisma.user.create({
            data: {
                firstName: "John",
                lastName: "Doe",
                email: teacherEmail,
                password: hashedPassword,
                statusId: 1, // Active
                roles: { create: [{ roleId: 2 }] }, // Assign teacher role
                schoolId: existingSchool.id, // ✅ Assign teacher to the same school
                profile: {
                    create: {
                        bio: "Math Teacher",
                        avatar: "https://example.com/teacher-avatar.jpg"
                    }
                }
            }
        });

        console.log("✅ Teacher user created.");
    } else {
        console.log("ℹ️ Teacher user already exists.");
    }

    // ✅ Seed a Class
    console.log("📚 Seeding Class...");
    const classExists = await prisma.class.findFirst({
        where: { name: "Math Class", schoolId: existingSchool.id }
    });

    if (!classExists) {
        await prisma.class.create({
            data: {
                name: "Math Class",
                gradeLevel: "6th Grade",
                capacity: 30,
                teacherId: teacherUser.id, // ✅ Assign the teacher
                schoolId: existingSchool.id, // ✅ Belongs to this school
                roomNumber: "101",
                schedule: {}, // Default empty schedule
                startDate: new Date("2024-03-01"),
                endDate: new Date("2024-06-30")
            }
        });

        console.log("✅ Class 'Math Class' created.");
    } else {
        console.log("ℹ️ Class already exists.");
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
