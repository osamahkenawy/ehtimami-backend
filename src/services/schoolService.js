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
    const {
        school_name, school_unique_id, school_address, school_lat, school_lng,
        school_type, school_manager_id, school_email, school_phone,
        school_region, school_city, school_district, education_level, curriculum
    } = data;

    let managerId = school_manager_id;

    if (!managerId) {
        // ✅ Generate default password based on school name
        const defaultPassword = `${school_name.replace(/\s+/g, "")}123456@`;

        // ✅ Call register function to create the school manager
        const schoolManager = await register({
            firstName: "School",
            lastName: "Manager",
            email: school_email,
            password: defaultPassword,
            roleIds: [5], // Assign "school_manager" role
            bio: `Manager of ${school_name}`
        });

        managerId = schoolManager.data.id; // Extract user ID from response
    }

    // ✅ Create the school with the assigned manager ID
    return prisma.school.create({
        data: {
            school_unique_id,
            school_name,
            school_address,
            school_lat,
            school_lng,
            school_type,
            school_manager_id: managerId,
            school_email,
            school_phone,
            school_region,
            school_city,
            school_district,
            education_level,
            curriculum
        }
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
    return prisma.school.delete({
        where: { id: parseInt(schoolId) },
    });
};

module.exports = {
    createSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    deleteSchool,
};
