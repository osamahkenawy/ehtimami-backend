const { successResponse, errorResponse } = require("@/utils/responseUtil");
const schoolService = require("@/services/schoolService");

// ✅ Create a new school
const createSchool = async (req, res) => {
    try {
        const {
            school_name, school_unique_id, school_address, school_lat, school_lng,
            school_type, school_manager_id, school_email, school_phone,
            school_region, school_city, school_district, education_level, curriculum,
            school_logo
        } = req.body;

        if (!school_name || !school_unique_id || !school_email || !school_phone) {
            return errorResponse(res, "Missing required fields.");
        }

        const newSchool = await schoolService.createSchool(req.body);
        return successResponse(res, "School created successfully.", newSchool, 201);
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

module.exports = {
    createSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    deleteSchool,
};
