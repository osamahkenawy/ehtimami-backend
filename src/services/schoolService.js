const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { z } = require("zod");

const prisma = new PrismaClient();

// ✅ Define School Schema Validation (Zod)
const schoolSchema = z.object({
    school_name: z.string().min(2, "School name must be at least 2 characters long"),
    school_unique_id: z.string().min(3, "Unique ID must be at least 3 characters long"),
    school_address: z.string().min(5, "Address must be at least 5 characters long"),
    school_lat: z.number().optional(),
    school_lng: z.number().optional(),
    school_type: z.enum(["PRIVATE", "PUBLIC", "INTERNATIONAL", "SPECIAL_NEEDS"]),
    school_email: z.string().email("Invalid email format"),
    school_phone: z.string().optional(),
    school_region: z.string().min(2, "Region is required").optional(),
    school_city: z.string().min(2, "City is required").optional(),
    school_district: z.string().optional(),
    education_level: z.enum(["ALL", "PRIMARY", "INTERMEDIATE", "SECONDARY", "KINDERGARTEN"]).optional(),
    curriculum: z.enum(["SAUDI_NATIONAL", "IB", "AMERICAN", "BRITISH", "FRENCH", "OTHER"]).optional(),
    school_logo: z.string().url("Invalid URL").optional(),
    school_manager_id: z.number().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

/**
 * ✅ Create a school and assign a manager
 */
const createSchool = async (data) => {
    try {
        // ✅ Validate input
        const validatedData = schoolSchema.safeParse(data);

        if (!validatedData.success) {
            const formattedErrors = validatedData.error.errors.map(err => err.message).join(", ");
            return { error: `Validation Failed: ${formattedErrors}` };
        }

        return await prisma.$transaction(async (tx) => {
            let managerId = validatedData.data.school_manager_id;

            // ✅ If no manager is provided, create a new one
            if (!managerId) {
                const defaultPassword = `${validatedData.data.school_name.replace(/\s+/g, "")}123456@`;
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                const schoolManager = await tx.user.create({
                    data: {
                        firstName: "School",
                        lastName: "Manager",
                        email: validatedData.data.school_email,
                        password: hashedPassword,
                        is_verified: true,
                        status: "ACTIVE",
                        roles: { create: [{ role: { connect: { name: "school_manager" } } }] },
                        profile: { create: { bio: `Manager of ${validatedData.data.school_name}` } }
                    }
                });

                managerId = schoolManager.id;
            }

            // ✅ Create the school
            const newSchool = await tx.school.create({
                data: {
                    school_unique_id: validatedData.data.school_unique_id,
                    school_name: validatedData.data.school_name,
                    school_address: validatedData.data.school_address,
                    school_lat: validatedData.data.school_lat,
                    school_lng: validatedData.data.school_lng,
                    school_type: validatedData.data.school_type,
                    school_email: validatedData.data.school_email,
                    school_phone: validatedData.data.school_phone,
                    school_region: validatedData.data.school_region,
                    school_city: validatedData.data.school_city,
                    school_district: validatedData.data.school_district,
                    education_level: validatedData.data.education_level,
                    curriculum: validatedData.data.curriculum,
                    school_logo: validatedData.data.school_logo,
                    status: validatedData.data.status,
                }
            });

            // ✅ Assign school manager
            await tx.schoolAdmin.create({
                data: {
                    userId: managerId,
                    schoolId: newSchool.id,
                    role: "admin"
                }
            });

            return { success: true, data: newSchool };
        });
    } catch (error) {
        console.error("❌ Error creating school:", error);
        return { error: "An unexpected error occurred. Please try again." };
    }
};

/**
 * ✅ Get all schools
 */
const getAllSchools = async () => {
    return prisma.school.findMany({
        include: {
            admins: { include: { user: true } },
        },
    });
};

/**
 * ✅ Get school by ID
 */
const getSchoolById = async (schoolId) => {
    return prisma.school.findUnique({
        where: { id: parseInt(schoolId) },
        include: {
            admins: { include: { user: true } },
        },
    });
};

/**
 * ✅ Update school
 */
const updateSchool = async (schoolId, updateData) => {
    return prisma.school.update({
        where: { id: parseInt(schoolId) },
        data: updateData,
    });
};

/**
 * ✅ Delete school
 */
const deleteSchool = async (schoolId) => {
    return await prisma.$transaction(async (tx) => {
        // Check if the school exists
        const school = await tx.school.findUnique({
            where: { id: parseInt(schoolId) },
            select: { id: true }
        });

        if (!school) {
            throw new Error("School not found.");
        }

        // Check if there are any classes associated with this school
        const classes = await tx.class.findMany({
            where: { schoolId: parseInt(schoolId) }
        });

        if (classes.length > 0) {
            throw new Error("Cannot delete school because there are classes associated with it. Please delete all classes first.");
        }

        // Proceed to delete the school
        await tx.school.delete({
            where: { id: parseInt(schoolId) }
        });

        return { message: "School and all related records deleted successfully." };
    });
};

const getSchoolUsersByRole = async (schoolManagerId) => {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
        where: { userId: schoolManagerId },
        include: { school: true }
    });

    if (!schoolAdmin) {
        throw new Error("Unauthorized. You are not assigned as a school manager.");
    }

    const schoolId = schoolAdmin.schoolId;

    // Fetch all related users in that school
    const users = await prisma.user.findMany({
        where: {
            schools: {
                some: { schoolId }
            },
            roles: {
                some: {
                    role: {
                        name: { in: ["teacher", "student", "parent"] }
                    }
                }
            }
        },
        include: {
            roles: { include: { role: true } },
            profile: true,
            schools: { include: { school: true } }
        }
    });

    const grouped = {
        managers: [],
        teachers: [],
        students: [],
        parents: []
    };

 users.forEach(user => {
    const roles = user.roles.map(r => r.role.name);
    const base = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        profile: user.profile || null
    };

    if (roles.includes("school_manager")) grouped.managers.push(base);
    if (roles.includes("teacher")) grouped.teachers.push(base);
    if (roles.includes("student")) grouped.students.push(base);
    if (roles.includes("parent")) grouped.parents.push(base);
});

    return grouped;
};

const getAllUsersBySchoolId = async (schoolId) => {
    const parsedId = parseInt(schoolId);

    const users = await prisma.user.findMany({
        where: {
            schools: {
                some: {
                    schoolId: parsedId
                }
            }
        },
        include: {
            roles: { include: { role: true } },
            profile: true,
            schools: true,
            student: true,
            employee: true,
            managedSchools: true
        }
    });

    const grouped = {
        managers: [],
        teachers: [],
        students: []
    };

    users.forEach(user => {
        const roles = user.roles.map(r => r.role.name);
        const base = {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone,
            profile: user.profile || null
        };

        if (user.managedSchools.find(admin => admin.schoolId === parsedId)) {
            grouped.managers.push(base);
        }

        if (roles.includes("teacher")) grouped.teachers.push(base);
        if (roles.includes("student")) grouped.students.push(base);
    });

    return grouped;
};

module.exports = {
    createSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    deleteSchool,
    getSchoolUsersByRole,
    getAllUsersBySchoolId
};
