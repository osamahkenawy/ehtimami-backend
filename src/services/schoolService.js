const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("@/utils/emailUtil"); // New utility for sending emails
const { register } = require("@/controllers/authController"); // Import register function

const prisma = new PrismaClient();

/**
 * Generate a random password with 10 characters
 */


/**
 * Create school and school manager
 */
/**
 * Create school and school manager
 */
const createSchool = async (data) => {
    return await prisma.$transaction(async (tx) => {
        const {
            school_name, school_unique_id, school_address, school_lat, school_lng,
            school_type, school_manager_id, school_email, school_phone,
            school_region, school_city, school_district, education_level, curriculum,
            school_logo, statusId = 1 
        } = data;

        let managerId = school_manager_id;

        if (!managerId) {
            // ✅ Generate default password based on school name
            const defaultPassword = `${school_name.replace(/\s+/g, "")}123456@`;
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            // ✅ Create the School Manager first
            const schoolManager = await tx.user.create({
                data: {
                    firstName: "School",
                    lastName: "Manager",
                    email: school_email,
                    password: hashedPassword,
                    statusId: 1, // Active
                    roles: { create: [{ roleId: 5 }] },
                    profile: { create: { bio: `Manager of ${school_name}` } }
                }
            });

            managerId = schoolManager.id;
        }

        // ✅ Now create the School and connect it with the Manager
        const newSchool = await tx.school.create({
            data: {
                school_unique_id,
                school_name,
                school_address,
                school_lat,
                school_lng,
                school_type,
                school_email,
                school_phone,
                school_region,
                school_city,
                school_district,
                education_level,
                curriculum,
                school_logo,
                school_manager_id: managerId, // ✅ Correctly link manager to school
                statusId
            }
        });

        return newSchool;
    });
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
        // ✅ Find the school first
        const school = await tx.school.findUnique({
            where: { id: parseInt(schoolId) },
            select: { school_manager_id: true }
        });

        if (!school) {
            throw new Error("School not found.");
        }

        // ✅ Delete the school first
        await tx.school.delete({
            where: { id: parseInt(schoolId) }
        });

        // ✅ If there's a school manager, delete related records before deleting the manager
        if (school.school_manager_id) {
            // ❌ Delete user profile if it exists
            await tx.userProfile.deleteMany({
                where: { userId: school.school_manager_id }
            });

            // ❌ Delete user roles from UserAccessRoles
            await tx.userAccessRoles.deleteMany({
                where: { userId: school.school_manager_id }
            });

            // ❌ Delete the school manager
            await tx.user.delete({
                where: { id: school.school_manager_id }
            });
        }

        return { message: "School, manager, roles, and profile deleted successfully." };
    });
};

module.exports = {
    createSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    deleteSchool,
};
