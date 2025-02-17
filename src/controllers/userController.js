const { PrismaClient } = require("@prisma/client");
const { successResponse, errorResponse } = require("../utils/responseUtil");

const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { roles: { include: { role: true } }, profile: true },
        });

        return successResponse(res, "Users fetched successfully", users);
    } catch (error) {
        return errorResponse(res, error.message || "An error occurred.");
    }
};

const getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return errorResponse(res, "Invalid user ID.");
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } }, profile: true },
        });

        if (!user) {
            return errorResponse(res, "User not found.", 404);
        }

        return successResponse(res, "User fetched successfully", user);
    } catch (error) {
        return errorResponse(res, error.message || "An error occurred.");
    }
};

module.exports = { getAllUsers, getUserById };
