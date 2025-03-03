const { PrismaClient } = require("@prisma/client");
const { errorResponse } = require("@/utils/responseUtil");
const prisma = new PrismaClient();

// Middleware to check if a school exists based on the provided schoolId in the request body
const checkSchoolExists = async (req, res, next) => {
    const { schoolId } = req.body;
    if (!schoolId) {
        return errorResponse(res, "School ID must be provided.", 400);
    }

    try {
        const school = await prisma.school.findUnique({
            where: { id: parseInt(schoolId) }
        });

        if (!school) {
            return errorResponse(res, "School not found.", 404);
        }

        next();
    } catch (error) {
        return errorResponse(res, "Database error while checking school existence.", 500);
    }
};

const checkTeacherExists = async (req, res, next) => {
    try {
        const { teacherId } = req.body;
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId }
        });

        if (!teacher) {
            return res.status(404).json({
                status: 404,
                message: "Teacher not found."
            });
        }

        next();
    } catch (error) {
        console.error('Database error while checking teacher existence:', error);
        return res.status(500).json({
            status: 500,
            message: "Database error while checking teacher existence."
        });
    }
};


module.exports = {
    checkSchoolExists,
    checkTeacherExists
};
