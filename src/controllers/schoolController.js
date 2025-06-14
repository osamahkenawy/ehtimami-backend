const { successResponse, errorResponse } = require("@/utils/responseUtil");
const schoolService = require("@/services/schoolService");

// ✅ Create a new school
const createSchool = async (req, res) => {
    try {
        const result = await schoolService.createSchool(req.body);

        if (result.error) {
            return errorResponse(res, result.error);
        }

        return successResponse(res, "School created successfully.", result.data, 201);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to create school.");
    }
};

// ✅ Get all schools
const getAllSchools = async (req, res) => {
    try {
        const schools = await schoolService.getAllSchools();
        return successResponse(res, "Schools fetched successfully.", schools);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to fetch schools.");
    }
};

// ✅ Get a school by ID
const getSchoolById = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const school = await schoolService.getSchoolById(schoolId);

        if (!school) {
            return errorResponse(res, "School not found.", 404);
        }

        return successResponse(res, "School details fetched successfully.", school);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to fetch school.");
    }
};

// ✅ Update school details
const updateSchool = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const updateData = req.body;

        const updatedSchool = await schoolService.updateSchool(schoolId, updateData);
        return successResponse(res, "School updated successfully.", updatedSchool);
    } catch (error) {
        return errorResponse(res, error.message || "Failed to update school.");
    }
};

// ✅ Delete a school
const deleteSchool = async (req, res) => {
    try {
        const { schoolId } = req.params;

        await schoolService.deleteSchool(schoolId);
        return successResponse(res, "School deleted successfully.");
    } catch (error) {
        return errorResponse(res, error.message || "Failed to delete school.");
    }
};

const fetchSchoolUsers = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const result = await schoolService.getSchoolUsersByRole(userId);
        return successResponse(res, "School users fetched successfully", result);
    } catch (err) {
        console.error("❌ Error:", err);
        return errorResponse(res, err.message || "Failed to fetch school users");
    }
};
const fetchAllUsersBySchoolId = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const result = await schoolService.getAllUsersBySchoolId(schoolId);
        return successResponse(res, "Users fetched successfully by school ID", result);
    } catch (err) {
        console.error("❌ Error:", err);
        return errorResponse(res, err.message || "Failed to fetch school users");
    }
};
module.exports = {
    createSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    deleteSchool,
    fetchSchoolUsers,
    fetchAllUsersBySchoolId
};
