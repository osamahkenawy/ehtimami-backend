const { PrismaClient } = require("@prisma/client");
const { hashPassword, comparePassword, generateToken } = require("@/services/authService");
const { successResponse, errorResponse } = require("@/utils/responseUtil");
const { sendPushNotification } = require("@config/firebaseAdmin");

const prisma = new PrismaClient();


// ✅ Register User
// ✅ Register User (Now Supports Internal Calls)
const register = async (req, res = null) => {
    try {
        const { firstName, lastName, email, password, roleIds, bio, avatar } = req.body || req;

        if (!firstName || !lastName || !email || !password || !roleIds || !Array.isArray(roleIds)) {
            if (res) return errorResponse(res, "Missing required fields or invalid roleIds format.");
            throw new Error("Missing required fields or invalid roleIds format.");
        }

        const hashedPassword = await hashPassword(password);

        // 🔍 Check if all role IDs exist
        const validRoles = await prisma.role.findMany({
            where: { id: { in: roleIds } },
        });

        const validRoleIds = validRoles.map(role => role.id);
        if (validRoleIds.length !== roleIds.length) {
            if (res) return errorResponse(res, "Some role IDs are invalid.");
            throw new Error("Some role IDs are invalid.");
        }

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                statusId: 1, // Active by default
                roles: { create: validRoleIds.map(roleId => ({ roleId })) },
                profile: bio || avatar ? { create: { bio, avatar } } : undefined,
            },
            include: {
                roles: { include: { role: true } },
                profile: true,
                status: true,
            },
        });

        if (res) return successResponse(res, "User registered successfully", user, 201);
        return { success: true, data: user };
    } catch (error) {
        if (res) return errorResponse(res, error.message || "An error occurred.");
        return { success: false, error: error.message };
    }
};



// ✅ Login User
const login = async (req, res) => {
    try {
        const { email, password, deviceToken } = req.body;

        if (!email || !password) {
            return errorResponse(res, "Email and password are required.");
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { roles: { include: { role: true } } },
        });

        if (!user) {
            return errorResponse(res, "Invalid credentials.", 401);
        }

        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return errorResponse(res, "Invalid credentials.", 401);
        }

        const token = generateToken(user);

        // 📢 Send push notification after successful login
        if (deviceToken) {
            await sendPushNotification(
                deviceToken,
                "Welcome to Ehtimami",
                `Hello ${user.firstName}, welcome to Ehtimami! 🎉`
            );
        }

        return successResponse(res, "Login successful", { token });
    } catch (error) {
        return errorResponse(res, error.message || "An error occurred.");
    }
};

module.exports = { register, login };
