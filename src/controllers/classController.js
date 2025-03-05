const { successResponse, errorResponse } = require("@/utils/responseUtil");
const classService = require("@/services/classService");

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

module.exports = {
    createNewClass,
    assignTeacherToClass,
    getAllClasses: async (req, res) => {
        try {
            const classes = await classService.getAllClasses();
            return successResponse(res, "Classes retrieved successfully.", classes);
        } catch (error) {
            return errorResponse(res, error.message || "Failed to retrieve classes.");
        }
    },
    getClassById: async (req, res) => {
        try {
            const classData = await classService.getClassById(req.params.id);
            return classData
                ? successResponse(res, "Class retrieved successfully.", classData)
                : errorResponse(res, "Class not found.", 404);
        } catch (error) {
            return errorResponse(res, error.message || "Failed to retrieve class.");
        }
    },
    getClassesBySchoolId: async (req, res) => {
        try {
            const classes = await classService.getClassesBySchoolId(req.params.schoolId);
            return successResponse(res, "Classes fetched successfully.", classes);
        } catch (error) {
            return errorResponse(res, error.message || "Failed to fetch classes.");
        }
    },
    updateClass: async (req, res) => {
        try {
            const updatedClass = await classService.updateClass(req.params.id, req.body);
            return successResponse(res, "Class updated successfully.", updatedClass);
        } catch (error) {
            return errorResponse(res, error.message || "Failed to update class.");
        }
    },
    deleteClass: async (req, res) => {
        try {
            await classService.deleteClass(req.params.id);
            return successResponse(res, "Class deleted successfully.");
        } catch (error) {
            return errorResponse(res, error.message || "Failed to delete class.", 404);
        }
    }
};
