const { PrismaClient } = require("@prisma/client");
const { errorResponse, successResponse } = require("@/utils/responseUtil.js"); // Import response utilities
const bcrypt = require("bcrypt");

const { z } = require("zod"); // Import Zod

const prisma = new PrismaClient();

const schoolSchema = z.object({
    school_name: z.string().min(2, "School name must be at least 2 characters long"),
    school_unique_id: z.string().min(3, "Unique ID must be at least 3 characters long"),
    school_address: z.string().min(5, "Address must be at least 5 characters long"),
    school_lat: z.number().optional(),
    school_lng: z.number().optional(),
    school_type: z.enum(["PRIVATE", "PUBLIC", "INTERNATIONAL", "SPECIAL_NEEDS"]),
    school_email: z.string().email("Invalid email format"),
    school_phone: z.string().optional(),
    school_region: z.string().min(2, "Region is required"),
    school_city: z.string().min(2, "City is required"),
    school_district: z.string().optional(),
    education_level: z.enum(["ALL", "PRIMARY", "INTERMEDIATE", "SECONDARY", "KINDERGARTEN"]),
    curriculum: z.enum(["SAUDI_NATIONAL", "IB", "AMERICAN", "BRITISH", "FRENCH", "OTHER"]),
    school_logo: z.string().url("Invalid URL").optional(),
    school_manager_id: z.number().optional(),
    statusId: z.number().default(1),
});


/**
 * Create school and school manager
 */
const createSchool = async (data) => {
    try {
        // ✅ Validate input using Zod
        const validatedData = schoolSchema.safeParse(data);

        if (!validatedData.success) {
            const formattedErrors = validatedData.error.errors.map(err => err.message).join(", ");
            return { error: `Validation Failed: ${formattedErrors}` };
        }

        return await prisma.$transaction(async (tx) => {
            let managerId = validatedData.data.school_manager_id;

            // ✅ If no manager is provided, create a new school manager
            if (!managerId) {
                const defaultPassword = `${validatedData.data.school_name.replace(/\s+/g, "")}123456@`;
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                const schoolManager = await tx.user.create({
                    data: {
                        firstName: "School",
                        lastName: "Manager",
                        email: validatedData.data.school_email,
                        password: hashedPassword,
                        statusId: 1, // Active
                        roles: { create: [{ roleId: 5 }] }, // Assign school manager role
                        profile: { create: { bio: `Manager of ${validatedData.data.school_name}` } }
                    }
                });

                managerId = schoolManager.id;
            }

            // ✅ Now create the School and connect it with the Manager
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
                    school_manager_id: managerId, // ✅ Correctly link manager to school
                    statusId: validatedData.data.statusId,
                }
            });

            return { success: true, data: newSchool };
        });
    } catch (error) {
        console.error("Error creating school:", error);
        return { error: "An unexpected error occurred. Please try again." };
    }
};




const getAllSchools = async () => {
    return prisma.school.findMany({
        include: { manager: true },
    });
};

const getSchoolById = async (schoolId) => {
    return prisma.school.findUnique({
        where: { id: parseInt(schoolId) },
        include: { manager: true },
    });
};

const updateSchool = async (schoolId, updateData) => {
    return prisma.school.update({
        where: { id: parseInt(schoolId) },
        data: updateData,
    });
};

const deleteSchool = async (schoolId) => {
    return await prisma.$transaction(async (tx) => {
        // Check if the school exists
        const school = await tx.school.findUnique({
            where: { id: parseInt(schoolId) },
            select: { school_manager_id: true }
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

        // Proceed to delete the school if no classes are associated
        await tx.school.delete({
            where: { id: parseInt(schoolId) }
        });

        // If there's a school manager, delete related records before deleting the manager
        if (school.school_manager_id) {
            // Delete user profile if it exists
            await tx.userProfile.deleteMany({
                where: { userId: school.school_manager_id }
            });

            // Delete user roles from UserAccessRoles
            await tx.userAccessRoles.deleteMany({
                where: { userId: school.school_manager_id }
            });

            // Delete the school manager
            await tx.user.delete({
                where: { id: school.school_manager_id }
            });
        }

        return { message: "School and all related records deleted successfully." };
    });
};


module.exports = {
    createSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    deleteSchool,
};
