const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { successResponse, errorResponse } = require("@/utils/responseUtil");

const prisma = new PrismaClient();

// ✅ Zod Schema for Teacher Registration
const teacherSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters long"),
    lastName: z.string().min(2, "Last name must be at least 2 characters long"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    schoolId: z.number().int().positive("Invalid school ID"),
    marital_status: z.enum(["SINGLE", "MARRIED", "DIVORCED"]).default("SINGLE"),
    nationality: z.string().min(2, "Nationality must be at least 2 characters long").default("Unknown"),
    birth_date: z.string().optional(), // Optional in case of existing users
    gender: z.number().min(1).max(3, "Gender must be 1 (Male), 2 (Female), or 3 (Other)").default(1),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    avatar: z.string().url("Invalid URL format for avatar").optional(), // ✅ New field for avatar
    statusId: z.number().default(1),
});

/**
 * ✅ Register a new teacher
 */
const registerTeacher = async (req, res) => {
    try {
        // 🔍 Validate Request Data
        const validatedData = teacherSchema.safeParse(req.body);
        if (!validatedData.success) {
            const errors = validatedData.error.errors.map(err => err.message).join(", ");
            return errorResponse(res, `Validation Failed: ${errors}`);
        }

        const { firstName, lastName, email, password, schoolId, marital_status, nationality, birth_date, gender, address, latitude, longitude, avatar } = validatedData.data;

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

        // ✅ Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Create Teacher with UserProfile
        const newTeacher = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                schoolId, // ✅ Assign to school
                statusId: 1, // Active
                roles: { create: [{ roleId: 2 }] }, // ✅ Assign "teacher" role
                profile: {
                    create: {
                        bio: `Teacher at ${school.school_name}`,
                        marital_status,
                        nationality,
                        birth_date: birth_date ? new Date(birth_date) : null,
                        join_date: new Date(),
                        gender,
                        address,
                        latitude,
                        longitude,
                        avatar, // ✅ Store avatar URL in profile
                    },
                },
            },
            include: {
                roles: { include: { role: true } },
                profile: true,
            },
        });

        return successResponse(res, "Teacher registered successfully.", newTeacher, 201);
    } catch (error) {
        console.error("Error registering teacher:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

/**
 * ✅ Assign Teacher to Multiple Classes (Only within their school)
 */
const assignTeacherToClasses = async (req, res) => {
    try {
        const { teacherId, classIds } = req.body;

        // 🔍 Validate Input
        if (!teacherId || !Array.isArray(classIds) || classIds.length === 0) {
            return errorResponse(res, "Teacher ID and at least one Class ID are required.");
        }

        // 🔍 Fetch Teacher
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
            include: { roles: true },
        });

        if (!teacher) return errorResponse(res, "Teacher not found.");
        if (!teacher.roles.some(role => role.roleId === 2)) {
            return errorResponse(res, "User is not a teacher.");
        }
        if (!teacher.schoolId) return errorResponse(res, "Teacher is not assigned to any school.");

        // 🔍 Validate Class IDs
        const classes = await prisma.class.findMany({ where: { id: { in: classIds } } });
        if (classes.length !== classIds.length) {
            return errorResponse(res, "Some class IDs are invalid.");
        }

        // 🔍 Check School Consistency
        const classSchoolIds = new Set(classes.map(cls => cls.schoolId));
        if (classSchoolIds.size > 1 || !classSchoolIds.has(teacher.schoolId)) {
            return errorResponse(res, "All classes must belong to the teacher's school.");
        }

        // ✅ Assign Classes
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

const getAllTeachers = async (req, res) => {
    try {
        const teachers = await prisma.user.findMany({
            where: {
                roles: {
                    some: { roleId: 2 } // 🔍 Only users with the teacher role
                }
            },
            include: {
                school: true, // ✅ Include school details
                teacherClasses: {
                    include: {
                        class: true // ✅ Include assigned classes
                    }
                },
                profile: true
            }
        });

        return successResponse(res, "Teachers fetched successfully.", teachers);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

/**
 * ✅ Get teachers by `schoolId` (Now using middleware)
 */
const getTeachersBySchool = async (req, res) => {
    try {
        const schoolId = req.school.id; // ✅ School is already validated by middleware

        // ✅ Fetch teachers for the given school
        const teachers = await prisma.user.findMany({
            where: {
                schoolId: schoolId,
                roles: { some: { roleId: 2 } } // 🔍 Only teachers
            },
            include: {
                school: true, // ✅ Include school details
                teacherClasses: {
                    include: { class: true } // ✅ Include assigned classes
                },
                profile: true
            }
        });

        return successResponse(res, "Teachers fetched successfully.", teachers);
    } catch (error) {
        console.error("Error fetching teachers by school:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

/**
 * ✅ Get a Teacher by `teacherId`
 */
const getTeacherById = async (req, res) => {
    try {
        const { teacherId } = req.params;

        if (!teacherId || isNaN(teacherId)) {
            return errorResponse(res, "Invalid or missing teacher ID.");
        }

        // 🔍 Find teacher in the database
        const teacher = await prisma.user.findUnique({
            where: {
                id: parseInt(teacherId),
                roles: { some: { roleId: 2 } } // 🔍 Ensure the user is a teacher
            },
            include: {
                school: true, // ✅ Include school details
                teacherClasses: {
                    include: { class: true } // ✅ Include assigned classes
                },
                profile: true
            }
        });

        if (!teacher) {
            return errorResponse(res, "Teacher not found.");
        }

        return successResponse(res, "Teacher details fetched successfully.", teacher);
    } catch (error) {
        console.error("Error fetching teacher by ID:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

/**
 * ✅ Update Teacher Details (Only Update Sent Fields)
 */
const updateTeacher = async (req, res) => {
    try {
        const teacherId = parseInt(req.params.teacherId);
        const updateData = req.body;

        if (isNaN(teacherId)) {
            return errorResponse(res, "Invalid teacher ID.");
        }

        // 🔍 Check if teacher exists
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
            include: { profile: true, teacherClasses: true },
        });

        if (!teacher) {
            return errorResponse(res, "Teacher not found.", 404);
        }

        // ✅ Prepare User and Profile Update Data
        let userUpdateData = {};
        let profileUpdateData = {};

        const userFields = ["firstName", "lastName", "email", "statusId", "schoolId"];
        const profileFields = [
            "marital_status", "nationality", "birth_date", "join_date", "gender",
            "address", "latitude", "longitude", "avatar"
        ];

        // 🔹 Only update fields that are provided in the request
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

        // ✅ Update User and Profile
        const updatedTeacher = await prisma.user.update({
            where: { id: teacherId },
            data: {
                ...userUpdateData,
                profile: Object.keys(profileUpdateData).length > 0 ? { update: profileUpdateData } : undefined,
            },
            include: {
                roles: { include: { role: true } },
                profile: true,
                school: true,
                teacherClasses: { include: { class: true } },
            },
        });

        // ✅ Update Class Assignments if classIds are provided
        if (updateData.classIds && Array.isArray(updateData.classIds)) {
            await prisma.classTeacher.deleteMany({ where: { teacherId } }); // Clear old classes

            await prisma.classTeacher.createMany({
                data: updateData.classIds.map(classId => ({
                    teacherId,
                    classId
                })),
            });
        }

        // 🔥 **Format Response**
        const formattedTeacher = {
            teacherId: updatedTeacher.id,
            firstName: updatedTeacher.firstName,
            lastName: updatedTeacher.lastName,
            email: updatedTeacher.email,
            school: updatedTeacher.school ? {
                schoolId: updatedTeacher.school.id,
                school_name: updatedTeacher.school.school_name
            } : null,
            profile: updatedTeacher.profile ? {
                profileId: updatedTeacher.profile.id,
                marital_status: updatedTeacher.profile.marital_status,
                nationality: updatedTeacher.profile.nationality,
                birth_date: updatedTeacher.profile.birth_date,
                join_date: updatedTeacher.profile.join_date,
                gender: updatedTeacher.profile.gender,
                address: updatedTeacher.profile.address,
                latitude: updatedTeacher.profile.latitude,
                longitude: updatedTeacher.profile.longitude,
                avatar: updatedTeacher.profile.avatar,
            } : null,
            classes: updatedTeacher.teacherClasses.map(tc => ({
                id: tc.class.id,
                name: tc.class.name
            })),
        };

        return successResponse(res, "Teacher updated successfully.", formattedTeacher);
    } catch (error) {
        console.error("Error updating teacher:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

/**
 * ✅ **Delete a Teacher by `teacherId`**
 */
const deleteTeacher = async (req, res) => {
    try {
        const profileId = parseInt(req.params.profileId);

        if (!profileId || isNaN(profileId)) {
            return errorResponse(res, "Invalid or missing profile ID.");
        }

        // 🔍 Step 1: Fetch `userId` using `profileId`
        const profile = await prisma.userProfile.findUnique({
            where: { id: profileId },
            select: { userId: true }, // Only fetch `userId`
        });

        if (!profile || !profile.userId) {
            return errorResponse(res, "Teacher not found.");
        }

        const userId = profile.userId;

        // 🔍 Step 2: Check if User Exists and is a Teacher
        const teacher = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: true, // Ensure user has teacher role
                teacherClasses: true, // Include assigned classes
            },
        });

        if (!teacher) {
            return errorResponse(res, "Teacher not found.");
        }

        // Ensure the user has a teacher role
        const hasTeacherRole = teacher.roles.some(role => role.roleId === 2);
        if (!hasTeacherRole) {
            return errorResponse(res, "User is not a teacher.");
        }

        // 🔄 Step 3: Delete Teacher Data in Transaction
        await prisma.$transaction(async (tx) => {
            // ❌ Delete all class assignments for the teacher
            await tx.classTeacher.deleteMany({
                where: { teacherId: userId },
            });

            // ❌ Delete teacher profile
            await tx.userProfile.delete({
                where: { id: profileId },
            });

            // ❌ Delete teacher account
            await tx.user.delete({
                where: { id: userId },
            });
        });

        return successResponse(res, "Teacher deleted successfully.");
    } catch (error) {
        console.error("Error deleting teacher:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};



module.exports = {
    registerTeacher,
    assignTeacherToClasses,
    getAllTeachers,
    getTeachersBySchool,
    getTeacherById,
    deleteTeacher,
    updateTeacher
};
