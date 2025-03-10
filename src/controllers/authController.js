const { PrismaClient, UserStatus } = require("@prisma/client");
const { hashPassword, comparePassword, generateToken } = require("@/services/authService");
const { successResponse, errorResponse } = require("@/utils/responseUtil");
const { sendPushNotification } = require("@config/firebaseAdmin");

const prisma = new PrismaClient();

// ✅ Register User (Now Supports Internal Calls)
const register = async (req, res = null) => {
    try {
        const { firstName, lastName, email, password, roleIds, schoolId, bio, avatar } = req.body || req;

        // 🔍 Validate required fields
        if (!firstName || !lastName || !email || !password || !roleIds || !Array.isArray(roleIds)) {
            throw new Error("Missing required fields or invalid roleIds format.");
        }

        // 🔍 Ensure `schoolId` is mandatory if the teacher role (`2`) is included
        if (roleIds.includes(2) && !schoolId) {
            throw new Error("School ID is required for teacher registration.");
        }

        // 🔍 Hash the password
        const hashedPassword = await hashPassword(password);

        // 🔍 Validate role IDs
        const validRoles = await prisma.role.findMany({ where: { id: { in: roleIds } } });
        const validRoleIds = validRoles.map(role => role.id);

        if (validRoleIds.length !== roleIds.length) {
            throw new Error("Some role IDs are invalid.");
        }

        // 🔍 Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error("A user with this email already exists.");
        }

        // ✅ Create new user
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                status: UserStatus.ACTIVE, // ✅ Set Active Status
                schools: schoolId ? { create: [{ schoolId }] } : undefined, // ✅ Assign school if provided
                roles: { create: validRoleIds.map(roleId => ({ roleId })) },
                profile: bio || avatar ? { create: { bio, avatar } } : undefined,
            },
            include: {
                roles: { include: { role: true } },
                profile: true,
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
            include: {
                roles: { include: { role: true } },
                profile: true,
            },
        });

        if (!user) {
            return errorResponse(res, "Invalid credentials.", 401);
        }

        // 🔍 Check password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return errorResponse(res, "Invalid credentials.", 401);
        }

        // ✅ Generate Token
        const token = generateToken(user);

        // 📢 Send push notification after successful login
        if (deviceToken) {
            await sendPushNotification(
                deviceToken,
                "Welcome to Ehtimami",
                `Hello ${user.firstName}, welcome to Ehtimami! 🎉`
            );
        }

        return successResponse(res, "Login successful", { token, user });
    } catch (error) {
        return errorResponse(res, error.message || "An error occurred.");
    }
};

module.exports = { register, login };
