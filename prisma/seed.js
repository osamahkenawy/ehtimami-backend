const { PrismaClient, UserStatus, SchoolType, EducationLevel, CurriculumType, SchoolStatus } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Seeding Database...");

    // ✅ Seed Roles
    console.log("🌟 Seeding Roles...");
    const roles = ["admin", "teacher", "student", "parent", "school_manager"];
    
    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role },
            update: {},
            create: { name: role }
        });
    }
    console.log("✅ Roles Seeded!");
    console.log("👑 Seeding Default Admin...");
    const adminEmail = "admin@ehtimami.com";
    const hashedAdminPassword = await bcrypt.hash("Ehtimami@123", 10);
    
    let adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            firstName: "Ehtimami",
            lastName: "Admin",
            email: adminEmail,
            password: hashedAdminPassword,
            status: UserStatus.ACTIVE,
            is_verified: true,
            roles: { create: [{ role: { connect: { name: "admin" } } }] },
            profile: {
                create: {
                    bio: "System Administrator"
                }
            }
        }
    });
    console.log("✅ Default Admin Account Created!");
    // ✅ Seed School Manager
    console.log("👨‍🏫 Seeding School Manager...");
    const managerEmail = "manager@school.com";
    const hashedPassword = await bcrypt.hash("School123456", 10);

    let managerUser = await prisma.user.upsert({
        where: { email: managerEmail },
        update: {},
        create: {
            firstName: "School",
            lastName: "Manager",
            email: managerEmail,
            password: hashedPassword,
            status: UserStatus.ACTIVE,
            roles: { create: [{ role: { connect: { name: "school_manager" } } }] },
            profile: {
                create: {
                    bio: "Principal of Ehtimami School",
                    avatar: "https://example.com/avatar.jpg"
                }
            }
        }
    });

    if (!managerUser) {
        throw new Error("❌ Failed to create or retrieve School Manager");
    }

    console.log("✅ School Manager Seeded!");

    // ✅ Seed School
    console.log("🏫 Seeding School...");
    let existingSchool = await prisma.school.upsert({
        where: { school_unique_id: "SCH-0001" },
        update: {},
        create: {
            school_unique_id: "SCH-0001",
            school_name: "Ehtimami International School",
            school_address: "Riyadh, Saudi Arabia",
            school_email: "contact@ehtimami.edu.sa",
            school_phone: "+966123456789",
            school_region: "Riyadh",
            school_city: "Riyadh",
            school_district: "Al Olaya",
            school_type: SchoolType.INTERNATIONAL,
            education_level: EducationLevel.PRIMARY, // ✅ Fix: Enum Reference
            curriculum: CurriculumType.SAUDI_NATIONAL, // ✅ Fix: Enum Reference
            status: SchoolStatus.ACTIVE // ✅ Fix: Enum Reference
        }
    });

    if (!existingSchool) {
        throw new Error("❌ Failed to create or retrieve School");
    }

    console.log("✅ School Seeded!");

    // ✅ Assign School Manager as Admin
    console.log("🔗 Assigning School Manager as Admin...");
    await prisma.schoolAdmin.upsert({
        where: { userId: managerUser.id },
        update: {},
        create: {
            userId: managerUser.id,
            schoolId: existingSchool.id,
            role: "admin"
        }
    });

    console.log("✅ School Manager Assigned as School Admin!");

    // ✅ Seed Teacher
    console.log("👨‍🏫 Seeding Teacher...");
    const teacherEmail = "teacher@school.com";
    const hashedTeacherPassword = await bcrypt.hash("Teacher123456", 10);

    let teacherUser = await prisma.user.upsert({
        where: { email: teacherEmail },
        update: {},
        create: {
            firstName: "John",
            lastName: "Doe",
            email: teacherEmail,
            password: hashedTeacherPassword,
            status: UserStatus.ACTIVE,
            roles: { create: [{ role: { connect: { name: "teacher" } } }] },
            profile: {
                create: {
                    bio: "Math Teacher",
                    avatar: "https://example.com/teacher-avatar.jpg"
                }
            }
        }
    });

    if (!teacherUser) {
        throw new Error("❌ Failed to create or retrieve Teacher");
    }

    console.log("✅ Teacher Seeded!");

    // ✅ Seed Class
    console.log("📚 Seeding Class...");
    await prisma.class.upsert({
        where: { code: "MATH101" },
        update: {},
        create: {
            name: "Math Class",
            code: "MATH101",
            gradeLevel: "6th Grade",
            subject: "Mathematics",
            semester: 1,
            academic_year: "2024-2025",
            capacity: 30,
            roomNumber: "101",
            schoolId: existingSchool.id,
            schedule: {} // ✅ Provide Empty JSON for schedule
        }
    });

    console.log("✅ Class 'Math Class' Created!");
}

main()
    .catch((error) => {
        console.error("❌ Error seeding:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
