const {
    PrismaClient,
    UserStatus,
    SchoolType,
    EducationLevel,
    CurriculumType,
    SchoolStatus,
} = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Seeding Database...");

    // ✅ Roles
    const roles = ["admin", "teacher", "student", "parent", "school_manager", "employee"];
    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role },
            update: {},
            create: { name: role },
        });
    }

    // ✅ Default Admin
    const adminEmail = "admin@ehtimami.com";
    const hashedAdminPassword = await bcrypt.hash("Ehtimami@123", 10);
    const adminUser = await prisma.user.upsert({
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
            profile: { create: { bio: "Super Admin" } },
        },
    });

    // ✅ School Manager
    const managerEmail = "manager@school.com";
    const managerUser = await prisma.user.upsert({
        where: { email: managerEmail },
        update: {},
        create: {
            firstName: "School",
            lastName: "Manager",
            email: managerEmail,
            password: await bcrypt.hash("School123456", 10),
            status: UserStatus.ACTIVE,
            roles: { create: [{ role: { connect: { name: "school_manager" } } }] },
            profile: {
                create: {
                    bio: "Principal of Ehtimami School",
                    avatar: "https://example.com/avatar.jpg",
                },
            },
        },
    });

    // ✅ School
    const school = await prisma.school.upsert({
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
            education_level: EducationLevel.PRIMARY,
            curriculum: CurriculumType.SAUDI_NATIONAL,
            status: SchoolStatus.ACTIVE,
        },
    });

    await prisma.schoolAdmin.upsert({
        where: { userId: managerUser.id },
        update: {},
        create: { userId: managerUser.id, schoolId: school.id, role: "admin" },
    });

    // ✅ Teacher
    const teacherUser = await prisma.user.upsert({
        where: { email: "teacher@school.com" },
        update: {},
        create: {
            firstName: "John",
            lastName: "Doe",
            email: "teacher@school.com",
            password: await bcrypt.hash("Teacher123456", 10),
            status: UserStatus.ACTIVE,
            roles: { create: [{ role: { connect: { name: "teacher" } } }] },
            profile: {
                create: {
                    bio: "Math Teacher",
                    avatar: "https://example.com/teacher-avatar.jpg",
                },
            },
        },
    });

    const mathClass = await prisma.class.upsert({
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
            schoolId: school.id,
            schedule: {},
        },
    });

    // ✅ Assign Teacher to Class
    await prisma.classTeacher.upsert({
        where: {
            teacherId_classId: {
                teacherId: teacherUser.id,
                classId: mathClass.id,
            },
        },
        update: {},
        create: {
            teacherId: teacherUser.id,
            classId: mathClass.id,
        },
    });
    const hashedPassword = await bcrypt.hash("Parent123456", 10);

    // ✅ Parent
    const parentUser = await prisma.user.upsert({
        where: { email: "parent@school.com" }, // or whatever email you're using
        update: {},
        create: {
          firstName: "Parent",
          lastName: "User",
          email: "parent@school.com",
          password: hashedPassword,
          status: UserStatus.ACTIVE,
          is_verified: true,
          roles: {
            create: [{ role: { connect: { name: "parent" } } }],
          },
          profile: {
            create: {
              bio: "Parent of a student",
              avatar: "https://example.com/parent-avatar.jpg",
            },
          },
        },
      });
      

    const parent = await prisma.parent.create({
        data: { userId: parentUser.id },
    });

    // ✅ Student
    const studentUser = await prisma.user.create({
        data: {
            firstName: "Khalid",
            lastName: "Ali",
            email: "student@ehtimami.com",
            password: await bcrypt.hash("Student123456", 10),
            status: UserStatus.ACTIVE,
            roles: { create: [{ role: { connect: { name: "student" } } }] },
            profile: { create: { bio: "Grade 6 student" } },
        },
    });

    const student = await prisma.student.create({
        data: {
            userId: studentUser.id,
            student_no: "STU-0001",
            grade: "6",
            classId: mathClass.id,
            schoolId: school.id,
        },
    });

    // Link student to parent
    await prisma.parent.update({
        where: { id: parent.id },
        data: {
            students: { connect: { id: student.id } },
        },
    });

    // ✅ Employee (Non-teacher)
    await prisma.user.create({
        data: {
            firstName: "Ahmad",
            lastName: "Yousef",
            email: "employee@ehtimami.com",
            password: await bcrypt.hash("Employee123456", 10),
            status: UserStatus.ACTIVE,
            roles: { create: [{ role: { connect: { name: "employee" } } }] },
            profile: { create: { bio: "IT Support" } },
            employee: {
                create: {
                    position: "IT Technician",
                    schoolId: school.id,
                },
            },
        },
    });

    console.log("✅ Seeding Completed!");
}

main()
    .catch((error) => {
        console.error("❌ Error seeding:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
