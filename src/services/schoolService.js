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
            school_logo
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
                school_manager_id: managerId // ✅ Correctly link manager to school
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
