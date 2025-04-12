// src/services/teacherService.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { getEmailTemplate } = require("@/utils/emailUtil");
const { z } = require("zod");
const { successResponse, errorResponse } = require("@/utils/responseUtil");
const { sendEmail } = require("@/middlewares/sendEmailMiddleware");

const prisma = new PrismaClient();

const teacherSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    schoolId: z.number().int().positive(),
    phone: z.string().optional(),
    profile: z.object({
      marital_status: z.enum(["SINGLE", "MARRIED", "DIVORCED"]).optional(),
      nationality: z.string().optional(),
      birth_date: z.string().optional(),
      join_date: z.string().optional(),
      gender: z.number().min(1).max(3).optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      avatar: z.string().url().optional(),
      occupation: z.string().optional(),
      bio: z.string().optional()
    }).optional()
  });
  
const generateRandomPassword = () => crypto.randomBytes(8).toString("hex");

const registerTeacher = async (req, res) => {
  try {
    const validated = teacherSchema.safeParse(req.body);
    if (!validated.success) {
      const errorMessages = validated.error.errors.map(err => err.message).join(", ");
      return errorResponse(res, `Validation Failed: ${errorMessages}`);
    }

    const { firstName, lastName, email, schoolId, phone, profile = {} } = validated.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse(res, "A user with this email already exists.");

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return errorResponse(res, "School not found.");

    const generatedPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const {
      marital_status = "SINGLE",
      nationality = "Unknown",
      birth_date,
      join_date,
      gender = 1,
      address,
      latitude,
      longitude,
      avatar,
      occupation,
      bio
    } = profile;

    const newTeacher = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone?.replace(/\s+/g, "") || null,
        password: hashedPassword,
        status: "ACTIVE",
        is_verified: false,
        roles: {
          create: { role: { connect: { name: "teacher" } } }
        },
        schools: {
          create: { schoolId }
        },
        profile: {
          create: {
            bio: bio || `Teacher at ${school.school_name}`,
            marital_status,
            nationality,
            birth_date: birth_date ? new Date(birth_date) : null,
            join_date: join_date ? new Date(join_date) : new Date(),
            gender,
            address,
            latitude,
            longitude,
            avatar
          }
        }
      },
      include: {
        roles: { include: { role: true } },
        profile: true
      }
    });

    const emailContent = `
      <h3>Hello ${firstName},</h3>
      <p>Your teacher account has been created successfully in the Ehtimami system.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${generatedPassword}</p>
      <p>Please login and change your password immediately.</p>
      <p>Best regards,<br/>Ehtimami School Management</p>
    `;

    await sendEmail(email, "Welcome to Ehtimami System", emailContent);

    return successResponse(res, "Teacher registered successfully.", newTeacher, 201);
  } catch (err) {
    console.error("Error registering teacher:", err);
    return errorResponse(res, "An unexpected error occurred.");
  }
};

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

const updateTeacher = async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const updateData = req.body;

    if (isNaN(teacherId)) return errorResponse(res, "Invalid teacher ID.");

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { profile: true },
    });

    if (!teacher) return errorResponse(res, "Teacher not found.");

    const {
      firstName, lastName, email, statusId, schoolId,
      profile = {}
    } = updateData;

    const {
      marital_status, nationality, birth_date, join_date, gender,
      address, latitude, longitude, avatar, occupation, phone, bio
    } = profile;

    const profileUpdate = {
      ...(bio && { bio }),
      ...(marital_status && { marital_status }),
      ...(nationality && { nationality }),
      ...(birth_date && { birth_date: new Date(birth_date) }),
      ...(join_date && { join_date: new Date(join_date) }),
      ...(gender && { gender }),
      ...(address && { address }),
      ...(latitude && { latitude }),
      ...(longitude && { longitude }),
      ...(avatar && { avatar }),
      ...(occupation && { occupation }),
      ...(phone && { phone: phone.replace(/\s+/g, "") })
    };

    const updatedTeacher = await prisma.user.update({
      where: { id: teacherId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(statusId && { status: "ACTIVE" }),
        ...(schoolId && {
          schools: { upsert: { where: { userId_schoolId: { userId: teacherId, schoolId } }, update: {}, create: { schoolId } } }
        }),
        profile: Object.keys(profileUpdate).length > 0 ? {
          update: profileUpdate
        } : undefined
      },
      include: {
        profile: true,
        roles: { include: { role: true } }
      }
    });

    return successResponse(res, "Teacher updated successfully.", updatedTeacher);
  } catch (error) {
    console.error("Error updating teacher:", error);
    return errorResponse(res, "An unexpected error occurred.");
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    if (!teacherId || isNaN(teacherId)) return errorResponse(res, "Invalid teacher ID.");

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) return errorResponse(res, "Teacher not found.");

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
        roles: { some: { roleId: 2 } }
      },
      include: {
        profile: true,
        schools: { include: { school: true } },
        teacherClasses: { include: { class: true } },
        roles: { include: { role: true } }
      }
    });

    return successResponse(res, "Teachers fetched successfully.", teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return errorResponse(res, "An unexpected error occurred.");
  }
};
const getTeachersBySchool = async (req, res) => {
  try {
    const { schoolId } = req.body;

    if (!schoolId || isNaN(schoolId)) {
      return errorResponse(res, "Invalid or missing school ID.");
    }

    const teachers = await prisma.user.findMany({
      where: {
        roles: {
          some: { role: { name: "teacher" } }
        },
        schools: {
          some: { schoolId: Number(schoolId) }
        }
      },
      include: {
        profile: true,
        schools: { include: { school: true } },
        teacherClasses: { include: { class: true } },
        roles: { include: { role: true } }
      }
    });

    return successResponse(res, "Teachers fetched successfully.", teachers);
  } catch (error) {
    console.error("Error fetching teachers by school:", error);
    return errorResponse(res, "An unexpected error occurred.");
  }
};

const getTeacherById = async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    if (isNaN(teacherId)) return errorResponse(res, "Invalid teacher ID.");

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        profile: true,
        schools: { include: { school: true } },
        teacherClasses: { include: { class: true } },
        roles: { include: { role: true } }
      }
    });

    if (!teacher) return errorResponse(res, "Teacher not found.");

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
  getTeacherById,
  getTeachersBySchool
};
