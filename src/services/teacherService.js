const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { getEmailTemplate } = require("@/utils/emailUtil"); // Import utility
const { z } = require("zod");
const { successResponse, errorResponse } = require("@/utils/responseUtil");
const { sendEmail } = require("@/middlewares/sendEmailMiddleware"); // Import email middleware

const prisma = new PrismaClient();

// ✅ Zod Schema for Teacher Registration
const teacherSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters long"),
    lastName: z.string().min(2, "Last name must be at least 2 characters long"),
    email: z.string().email("Invalid email format"),
    schoolId: z.number().int().positive("Invalid school ID"),
    profile: z.object({
        marital_status: z.enum(["SINGLE", "MARRIED", "DIVORCED"]).default("SINGLE"),
        nationality: z.string().min(2, "Nationality must be at least 2 characters long").default("Unknown"),
        birth_date: z.string().optional(),
        join_date: z.string().optional(),
        gender: z.number().min(1).max(3, "Gender must be 1 (Male), 2 (Female), or 3 (Other)").default(1),
        address: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        avatar: z.string().url("Invalid URL format for avatar").optional(),
        occupation: z.string().optional(),
        phone: z.string().optional(),
        bio: z.string().optional()
    }).optional(),
    statusId: z.number().default(1)
});

// ✅ Function to generate a random password
const generateRandomPassword = () => {
    return crypto.randomBytes(8).toString("hex"); // Generates a secure 16-character password
};

// ✅ Register a new teacher
const registerTeacher = async (req, res) => {
    try {
        // 🔍 Validate Request Data
        const validatedData = teacherSchema.safeParse(req.body);
        if (!validatedData.success) {
            const errors = validatedData.error.errors.map(err => err.message).join(", ");
            return errorResponse(res, `Validation Failed: ${errors}`);
        }

        const { firstName, lastName, email, schoolId, profile } = req.body;

        // 🔍 Check if email exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return errorResponse(res, "A user with this email already exists.");
        }

        // 🔍 Validate School
        const school = await prisma.school.findUnique({ where: { id: schoolId } });
        if (!school) {
            return errorResponse(res, "Invalid school ID.");
        }

        // ✅ Extract profile fields safely
        const { 
            marital_status, nationality, birth_date, gender, address, latitude, longitude, avatar, occupation, phone, bio 
        } = profile || {};

        // ✅ Ensure `join_date` is set to the current date if not provided
        const joinDate = profile?.join_date ? new Date(profile.join_date) : new Date();

        // ✅ Trim spaces from phone number
        const cleanedPhone = phone ? phone.replace(/\s+/g, "") : null; 

        // ✅ Generate a random password and hash it
        const generatedPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // ✅ Create Teacher with UserProfile
        const newTeacher = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                status: "ACTIVE",
                roles: { create: [{ roleId: 2 }] }, // Assign teacher role
                profile: {
                    create: {
                        bio: bio || `Teacher at ${school.school_name}`,
                        marital_status,
                        nationality,
                        birth_date: birth_date ? new Date(birth_date) : null,
                        join_date: joinDate, // ✅ Fixed join_date
                        gender,
                        address,
                        occupation,
                        latitude,
                        longitude,
                        avatar,
                        phone: cleanedPhone // ✅ Trimmed phone number
                    }
                },
                schools: { create: [{ schoolId }] }
            },
            include: {
                roles: { include: { role: true } },
                profile: true
            }
        });

        // ✅ Send Email with the generated password
        // await sendEmail(email, "Welcome to Ehtimami System", `
        //     <h3>Hello ${firstName},</h3>
        //     <p>Your account has been created. Here are your login details:</p>
        //     <p><strong>Email:</strong> ${email}</p>
        //     <p><strong>Password:</strong> ${generatedPassword}</p>
        //     <p>Please change your password after logging in.</p>
        //     <br/>
        //     <p>Best regards,</p>
        //     <p>School Administration</p>
        // `);
        const emailContent = getEmailTemplate("welcomeTeacher", {
            firstName,
            email,
            password: generatedPassword
        });
        
        await sendEmail(email, "Welcome to Ehtimami System", emailContent);

        return successResponse(res, "Teacher registered successfully. A password has been sent via email.", newTeacher, 201);
    } catch (error) {
        console.error("Error registering teacher:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};


/**
 * ✅ Assign Teacher to Multiple Classes
 */
const assignTeacherToClasses = async (req, res) => {
    try {
        const { teacherId, classIds } = req.body;

        if (!teacherId || !Array.isArray(classIds) || classIds.length === 0) {
            return errorResponse(res, "Teacher ID and at least one Class ID are required.");
        }

        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
            include: { roles: true },
        });

        if (!teacher) return errorResponse(res, "Teacher not found.");
        if (!teacher.roles.some(role => role.roleId === 2)) {
            return errorResponse(res, "User is not a teacher.");
        }

        await prisma.classTeacher.createMany({
            data: classIds.map(classId => ({ teacherId, classId })),
            skipDuplicates: true,
        });

        return successResponse(res, "Teacher assigned to classes successfully.");
    } catch (error) {
        console.error("Error assigning teacher to classes:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

/**
 * ✅ Update Teacher Details
 */
const updateTeacher = async (req, res) => {
    try {
        const teacherId = parseInt(req.params.teacherId);
        const updateData = req.body;

        if (isNaN(teacherId)) {
            return errorResponse(res, "Invalid teacher ID.");
        }

        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
            include: { profile: true },
        });

        if (!teacher) return errorResponse(res, "Teacher not found.");

        let userUpdateData = {};
        let profileUpdateData = {};

        const userFields = ["firstName", "lastName", "email", "statusId", "schoolId"];
        const profileFields = ["marital_status", "nationality", "birth_date", "gender", "address", "latitude", "longitude", "avatar"];

        for (const field of userFields) {
            if (updateData[field] !== undefined) {
                userUpdateData[field] = updateData[field];
            }
        }

        for (const field of profileFields) {
            if (updateData[field] !== undefined) {
                profileUpdateData[field] = updateData[field];
            }
        }

        const updatedTeacher = await prisma.user.update({
            where: { id: teacherId },
            data: {
                ...userUpdateData,
                profile: Object.keys(profileUpdateData).length > 0 ? { update: profileUpdateData } : undefined,
            },
            include: {
                roles: { include: { role: true } },
                profile: true,
            },
        });

        return successResponse(res, "Teacher updated successfully.", updatedTeacher);
    } catch (error) {
        console.error("Error updating teacher:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

/**
 * ✅ Delete a Teacher
 */
const deleteTeacher = async (req, res) => {
    try {
        const teacherId = parseInt(req.params.teacherId);

        if (!teacherId || isNaN(teacherId)) {
            return errorResponse(res, "Invalid teacher ID.");
        }

        // Check if teacher exists
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
        });

        if (!teacher) {
            return errorResponse(res, "Teacher not found.");
        }

        await prisma.$transaction(async (tx) => {
            await tx.classTeacher.deleteMany({ where: { teacherId } });
            await tx.userProfile.deleteMany({ where: { userId: teacherId } });
            await tx.user.delete({ where: { id: teacherId } });
        });

        return successResponse(res, "Teacher deleted successfully.");
    } catch (error) {
        console.error("Error deleting teacher:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};


const getAllTeachers = async (req, res) => {
    try {
        const teachers = await prisma.user.findMany({
            where: {
                roles: {
                    some: { roleId: 2 } // Only users with the teacher role
                }
            },
            include: {
                profile: true, // Include all profile details
                schools: {
                    include: {
                        school: true // Include full school details
                    }
                },
                teacherClasses: {
                    include: {
                        class: true // Include full class details
                    }
                },
                roles: true // Include roles
            }
        });

        return successResponse(res, "Teachers fetched successfully.", teachers);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};


const getTeacherById = async (req, res) => {
    try {
        const teacherId = parseInt(req.params.teacherId);

        if (isNaN(teacherId)) {
            return errorResponse(res, "Invalid teacher ID.");
        }

        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
            include: {
                profile: true, // Include full profile details
                schools: {
                    include: {
                        school: true // Include full school details
                    }
                },
                teacherClasses: {
                    include: {
                        class: true // Include full class details
                    }
                },
                roles: true // Include roles
            }
        });

        if (!teacher) {
            return errorResponse(res, "Teacher not found.", 404);
        }

        return successResponse(res, "Teacher details fetched successfully.", teacher);
    } catch (error) {
        console.error("Error fetching teacher by ID:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};


module.exports = {
    registerTeacher,
    assignTeacherToClasses,
    updateTeacher,
    deleteTeacher,
    getAllTeachers,
    getTeacherById
};
