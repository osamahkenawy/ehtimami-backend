const { PrismaClient } = require("@prisma/client");
const { errorResponse } = require("@/utils/responseUtil");

const prisma = new PrismaClient();

const checkSchoolExists = async (req, res, next) => {
    try {
        const { school_unique_id, school_email, school_name } = req.body;

        if (!school_unique_id || !school_email || !school_name) {
            return errorResponse(res, "Missing required fields: school_unique_id, school_email, and school_name are required.");
        }

        const existingSchool = await prisma.school.findFirst({
            where: {
                OR: [
                    { school_unique_id },
                    { school_email },
                    { school_name }
                ]
            }
        });

        if (existingSchool) {
            return errorResponse(res, "A school with the same unique ID, email, or name already exists.", 409);
        }

        next(); // ✅ School does not exist, proceed to the controller
    } catch (error) {
        return errorResponse(res, error.message || "Error checking school existence.", 500);
    }
};

const checkSchoolExistsById = async (req, res, next) => {
    try {
        const { schoolId } = req.body;

        if (!schoolId || isNaN(schoolId)) {
            return errorResponse(res, "Invalid or missing school ID.");
        }

        // 🔍 Check if the school exists
        const school = await prisma.school.findUnique({ where: { id: parseInt(schoolId) } });

        if (!school) {
            return errorResponse(res, "School not found.");
        }

        // ✅ Attach school data to request object
        req.school = school;
        next(); // Proceed to the next middleware or controller
    } catch (error) {
        return errorResponse(res, "An unexpected error occurred while validating the school.");
    }
};

module.exports = {
    checkSchoolExists,
    checkSchoolExistsById
};