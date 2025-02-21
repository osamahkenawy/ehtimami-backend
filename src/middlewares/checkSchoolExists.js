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

module.exports = checkSchoolExists;
