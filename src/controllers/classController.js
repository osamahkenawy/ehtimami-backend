const { successResponse, errorResponse } = require("../utils/responseUtil");
const classService = require("@/services/classService");

// Create a new class
const createNewClass = async (req, res) => {
    try {
        const classData = await classService.createClass(req.body);
        return successResponse(res, "Class created successfully.", classData, 201);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to create class.");
    }
};

// Get all classes
const getAllClasses = async (req, res) => {
    try {
        const classes = await classService.getAllClasses();
        return successResponse(res, "Classes retrieved successfully.", classes);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to retrieve classes.");
    }
};

// Get a class by ID
const getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        const classData = await classService.getClassById(id);
        if (classData) {
            return successResponse(res, "Class retrieved successfully.", classData);
        } else {
            return errorResponse(res, "Class not found.", 404);
        }
    } catch (error) {
        return errorResponse(res, error.message || "Failed to retrieve class.");
    }
};

// Update a class
const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedClass = await classService.updateClass(id, updateData);
        return successResponse(res, "Class updated successfully.", updatedClass);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to update class.");
    }
};

// Delete a class
const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        await classService.deleteClass(id);
        return successResponse(res, "Class deleted successfully.");
    } catch (error) {
        return errorResponse(res, error.message || "Failed to delete class.", 404);
    }
};

// ✅ Get all classes by school ID
const getClassesBySchoolId = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const classes = await classService.getClassesBySchoolId(schoolId);
        return successResponse(res, "Classes fetched successfully.", classes);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to fetch classes.");
    }
};

module.exports = {
    createNewClass,
    getAllClasses,
    getClassById,
    updateClass,
    deleteClass,
    getClassesBySchoolId
};
