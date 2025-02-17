const { PrismaClient } = require("@prisma/client");
const { hashPassword, comparePassword, generateToken } = require("../services/authService");
const { successResponse, errorResponse } = require("../utils/responseUtil");

const prisma = new PrismaClient();

// ✅ Register User
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, roleIds } = req.body;

        if (!firstName || !lastName || !email || !password || !roleIds) {
            return errorResponse(res, "Missing required fields.");
        }

        console.log("🔍 Debug: Incoming Password Type:", typeof password); // Debug

        if (typeof password !== "string") {
            return errorResponse(res, "Password must be a string.");
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                roles: { create: roleIds.map(roleId => ({ roleId })) },
            },
            include: { roles: { include: { role: true } } },
        });

        return successResponse(res, "User registered successfully", user, 201);
    } catch (error) {
        console.error("❌ Debug Error:", error.message); // Log the error message
        return errorResponse(res, error.message || "An error occurred.");
    }
};



// ✅ Login User
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

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
        return successResponse(res, "Login successful", { token });
    } catch (error) {
        return errorResponse(res, error.message || "An error occurred.");
    }
};

module.exports = { register, login };
