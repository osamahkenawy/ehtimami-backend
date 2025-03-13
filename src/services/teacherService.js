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
    birth_date: z.string().optional(),
    gender: z.number().min(1).max(3, "Gender must be 1 (Male), 2 (Female), or 3 (Other)").default(1),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    avatar: z.string().url("Invalid URL format for avatar").optional(),
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
                status: "ACTIVE", // ✅ Fix: Use status instead of statusId
                roles: {
                    create: [{ roleId: 2 }] // Assign teacher role
                },
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
                        avatar
                    }
                },
                schools: {
                    create: [{ schoolId }] // ✅ Ensure the teacher is linked to a school
                }
            },
            include: {
                roles: { include: { role: true } },
                profile: true
            }
        });
        

        return successResponse(res, "Teacher registered successfully.", newTeacher, 201);
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
                    some: { roleId: 2 } // 🔍 Only users with the teacher role
                }
            },
            include: {
                schools: {
                    include: {
                        school: {
                            select: {
                                id: true,
                                school_name: true
                            }
                        }
                    }
                },
                teacherClasses: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                name: true,
                                gradeLevel: true,
                                subject: true
                            }
                        }
                    }
                },
                profile: {
                    select: {
                        bio: true,
                        avatar: true,
                        marital_status: true,
                        nationality: true,
                        birth_date: true,
                        gender: true,
                        address: true,
                        latitude: true,
                        longitude: true
                    }
                }
            }
        });

        // 🔹 Formatting the Response
        const formattedTeachers = teachers.map(teacher => ({
            teacherId: teacher.id,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            school: teacher.schools.length > 0 ? {
                schoolId: teacher.schools[0].school.id,
                school_name: teacher.schools[0].school.school_name
            } : null,
            profile: teacher.profile || null,
            classes: teacher.teacherClasses.map(tc => ({
                id: tc.class.id,
                name: tc.class.name,
                gradeLevel: tc.class.gradeLevel,
                subject: tc.class.subject
            }))
        }));

        return successResponse(res, "Teachers fetched successfully.", formattedTeachers);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};
const getTeacherById = async (teacherId) => {
    try {
        // 🔹 Fetch Teacher Basic Info
        const teacher = await prisma.$queryRaw`
            SELECT 
                u.id AS teacherId, 
                u.firstName, 
                u.lastName, 
                u.email, 
                u.status, 
                s.id AS schoolId,
                s.school_name,
                up.id AS profileId,
                up.bio, 
                up.avatar, 
                up.marital_status, 
                up.nationality, 
                up.birth_date, 
                up.join_date, 
                up.gender, 
                up.address
            FROM User u
            LEFT JOIN UserProfile up ON u.id = up.userId
            LEFT JOIN UserSchool us ON u.id = us.userId
            LEFT JOIN School s ON us.schoolId = s.id
            WHERE u.id = ${teacherId} 
            LIMIT 1;
        `;

        if (!teacher || teacher.length === 0) {
            return { error: "Teacher not found." };
        }

        // 🔹 Fetch Teacher Roles
        const roles = await prisma.$queryRaw`
            SELECT r.name 
            FROM Role r
            INNER JOIN UserAccessRoles ur ON r.id = ur.roleId
            WHERE ur.userId = ${teacherId};
        `;

        // 🔹 Fetch Assigned Classes
        const classes = await prisma.$queryRaw`
            SELECT c.id, c.name, c.gradeLevel, c.subject, c.academic_year
            FROM Class c
            INNER JOIN ClassTeacher ct ON c.id = ct.classId
            WHERE ct.teacherId = ${teacherId};
        `;

        // ✅ Final Response Object
        return {
            teacherId: teacher[0].teacherId,
            firstName: teacher[0].firstName,
            lastName: teacher[0].lastName,
            email: teacher[0].email,
            status: teacher[0].status,
            school: teacher[0].schoolId
                ? {
                      schoolId: teacher[0].schoolId,
                      school_name: teacher[0].school_name
                  }
                : null,
            profile: {
                profileId: teacher[0].profileId,
                bio: teacher[0].bio,
                avatar: teacher[0].avatar,
                marital_status: teacher[0].marital_status,
                nationality: teacher[0].nationality,
                birth_date: teacher[0].birth_date,
                join_date: teacher[0].join_date,
                gender: teacher[0].gender,
                address: teacher[0].address
            },
            roles: roles.map((r) => r.name),
            classes: classes
        };
    } catch (error) {
        console.error("Error fetching teacher:", error);
        return { error: "An unexpected error occurred while fetching the teacher." };
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
