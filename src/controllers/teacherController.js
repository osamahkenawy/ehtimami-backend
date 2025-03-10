const { registerTeacher, assignTeacherToClasses, getAllTeachers , getTeachersBySchool, updateTeacher , getTeacherById, deleteTeacher} = require("@/services/teacherService");
const { errorResponse } = require("@/utils/responseUtil");

/**
 * ✅ Register a Teacher
 */
const registerTeacherController = async (req, res) => {
    try {
        return await registerTeacher(req, res);
    } catch (error) {
        console.error("Controller Error:", error);
        return errorResponse(res, error.message || "Failed to register teacher.");
    }
};

/**
 * ✅ Assign Teacher to Multiple Classes
 */
const assignTeacherToClassesController = async (req, res) => {
    try {
        return await assignTeacherToClasses(req, res);
    } catch (error) {
        console.error("Controller Error:", error);
        return errorResponse(res, error.message || "Failed to assign teacher to classes.");
    }
};

const getAllTeachersController = async (req, res) => {
    try {
        return await getAllTeachers(req, res);
    } catch (error) {
        console.error("Controller Error:", error);
        return errorResponse(res, error.message || "Failed to fetch teachers.");
    }
};
const getTeachersBySchoolController = async (req, res) => {
    try {
        return await getTeachersBySchool(req, res);
    } catch (error) {
        console.error("Controller Error:", error);
        return errorResponse(res, error.message || "Failed to fetch teachers.");
    }
};
const getTeacherByIdController = async (req, res) => {
    try {
        return await getTeacherById(req, res);
    } catch (error) {
        console.error("Controller Error:", error);
        return errorResponse(res, error.message || "Failed to fetch teacher.");
    }
};
/**
 * ✅ Controller to Update Teacher (Calls the Service)
 */
const updateTeacherController = async (req, res) => {
    try {
        const teacherId = parseInt(req.params.teacherId);
        const updateData = req.body;

        if (isNaN(teacherId)) {
            return errorResponse(res, "Invalid teacher ID.");
        }

        // Call the service function
        const result = await updateTeacher(teacherId, updateData);

        if (result.error) {
            return errorResponse(res, result.error, 400);
        }

        return successResponse(res, "Teacher updated successfully.", result.data);
    } catch (error) {
        console.error("Error in updateTeacherController:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};
const deleteTeacherController = async (req, res) => {
    try {
        return await deleteTeacher(req, res);
    } catch (error) {
        console.error("Controller Error:", error);
        return errorResponse(res, error.message || "Failed to delete teacher.");
    }
};

module.exports = {
    registerTeacherController,
    assignTeacherToClassesController,
    getAllTeachersController,
    getTeachersBySchoolController,
    getTeacherByIdController,
    deleteTeacherController,
    updateTeacherController
};
