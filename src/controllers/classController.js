const { successResponse, errorResponse } = require("@/utils/responseUtil");
const classService = require("@/services/classService");
const createError = require("http-errors");

/**
 * Create a new class
 */
const createNewClass = async (req, res) => {
    try {
        const classData = await classService.createClass(req.body);
        return successResponse(res, "Class created successfully.", classData, 201);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to create class.");
    }
};

/**
 * Assign a teacher to a class
 */
const assignTeacherToClass = async (req, res) => {
    try {
        const { classId, teacherId } = req.body;

        if (!classId || !teacherId) {
            return errorResponse(res, "Missing required fields.");
        }

        const updatedClass = await classService.assignTeacherToClass(classId, teacherId);
        return successResponse(res, "Teacher assigned successfully.", updatedClass);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to assign teacher.");
    }
};

/**
 * Update a class
 */
const updateClass = async (req, res) => {
    try {
        const updatedClass = await classService.updateClass(Number(req.params.id), req.body);
        return successResponse(res, "Class updated successfully.", updatedClass);
    } catch (error) {
        console.error("Prisma Error:", error);

        // ✅ Handle Prisma Errors with Zod-style messages
        if (error.code === "P2025") {
            return errorResponse(res, createError(404, "Class not found. Please check the class ID."));
        } else if (error.code === "P2002") {
            return errorResponse(res, createError(409, "Duplicate entry detected."));
        } else {
            return errorResponse(res, createError(500, "An unexpected error occurred while updating the class."));
        }
    }
};

/**
 * Get all classes
 */
const getAllClasses = async (req, res) => {
    try {
        const classes = await classService.getAllClasses();
        return successResponse(res, "Classes retrieved successfully.", classes);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to retrieve classes.");
    }
};

/**
 * Get class by ID
 */
const getClassById = async (req, res) => {
    try {
        const classData = await classService.getClassById(req.params.id);
        return classData
            ? successResponse(res, "Class retrieved successfully.", classData)
            : errorResponse(res, "Class not found.", 404);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to retrieve class.");
    }
};

/**
 * Get classes by school ID
 */
const getClassesBySchoolId = async (req, res) => {
    try {
        const classes = await classService.getClassesBySchoolId(req.params.schoolId);
        return successResponse(res, "Classes fetched successfully.", classes);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to fetch classes.");
    }
};

/**
 * Delete a class
 */
const deleteClass = async (req, res) => {
    try {
        await classService.deleteClass(req.params.id);
        return successResponse(res, "Class deleted successfully.");
    } catch (error) {
        return errorResponse(res, error.message || "Failed to delete class.", 404);
    }
};

// ✅ Export all functions using CommonJS
module.exports = {
    createNewClass,
    assignTeacherToClass,
    updateClass,
    getAllClasses,
    getClassById,
    getClassesBySchoolId,
    deleteClass,
};
