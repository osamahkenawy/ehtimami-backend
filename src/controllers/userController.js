const { successResponse, errorResponse } = require("@/utils/responseUtil");
const userService = require("@/services/userService");

const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        return successResponse(res, "Users fetched successfully", users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

const getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) return errorResponse(res, "Invalid user ID.");

        const user = await userService.getUserById(userId);
        if (!user) return errorResponse(res, "User not found.", 404);

        return successResponse(res, "User fetched successfully", user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

const getUserByProfileId = async (req, res) => {
    try {
        const profileId = parseInt(req.params.profileId);
        if (isNaN(profileId)) return errorResponse(res, "Invalid profile ID.");

        const user = await userService.getUserByProfileId(profileId);
        if (!user) return errorResponse(res, "User not found.", 404);

        return successResponse(res, "User fetched successfully by profile ID.", user);
    } catch (error) {
        console.error("Error fetching user by profile ID:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};
// ✅ Verify User by ID (calls userService)
const verifyUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { is_verified = true } = req.body; // ✅ Accept true/false from body

        const updatedUser = await userService.verifyUserById(userId, is_verified);

        const message = is_verified
            ? "User verified successfully."
            : "User unverified successfully.";

        return successResponse(res, message, { userId: updatedUser.id });
    } catch (error) {
        console.error("Error verifying/unverifying user:", error);
        return errorResponse(res, error.message || "Failed to update verification status.");
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) return errorResponse(res, "Invalid user ID.");

        const updatedUser = await userService.updateUserProfile(userId, req.body);

        return successResponse(res, "User profile updated successfully.", updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        return errorResponse(res, error.message || "Failed to update profile.");
    }
};


module.exports = {
    getAllUsers,
    getUserById,
    getUserByProfileId,
    verifyUserById,
    updateUserProfile
};
