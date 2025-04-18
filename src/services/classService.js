// src/services/classService.js
const { PrismaClient } = require("@prisma/client");
const { classSchema } = require("@/validators/classValidator");

const prisma = new PrismaClient();

const defaultInclude = {
  teachers: {
    include: {
      teacher: {
        include: { profile: true },
      },
    },
  },
  studentClasses: {
    include: {
      student: {
        include: {
          user: { include: { profile: true } },
        },
      },
    },
  },
  mainStudents: {
    include: {
      user: { include: { profile: true } },
    },
  },
  school: true,
};

const validateReferences = async ({ code, schoolId, teacherId, studentIds = [] }) => {
  const [existingClass, school, teacher, students] = await Promise.all([
    prisma.class.findUnique({ where: { code } }),
    prisma.school.findUnique({ where: { id: schoolId } }),
    teacherId
      ? prisma.user.findUnique({
          where: { id: teacherId },
          include: { roles: { include: { role: true } } },
        })
      : Promise.resolve(null),
    studentIds.length > 0
      ? prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  if (existingClass) return { error: `A class with code '${code}' already exists.` };
  if (!school) return { error: "School not found." };
  if (teacherId && (!teacher || !teacher.roles.some((r) => r.role.name === "teacher"))) {
    return { error: `Teacher with ID ${teacherId} not found or is not a teacher.` };
  }

  const foundStudentIds = new Set(students.map((s) => s.id));
  const missingIds = studentIds.filter((id) => !foundStudentIds.has(id));
  if (missingIds.length > 0) {
    return { error: `Invalid student IDs: ${missingIds.join(", ")}` };
  }

  return {};
};

const createClass = async (data) => {
  const validated = classSchema.safeParse(data);
  if (!validated.success) {
    return {
      error: validated.error.errors.map((err) => err.message).join(", "),
    };
  }

  const classData = validated.data;
  const validationError = await validateReferences(classData);
  if (validationError.error) return validationError;

  const daysOfWeek = Object.keys(classData.schedule || {}).filter(
    (day) => classData.schedule[day] !== ""
  );

  return await prisma.$transaction(async (tx) => {
    const createdClass = await tx.class.create({
      data: {
        code: classData.code,
        name: classData.name,
        gradeLevel: classData.gradeLevel,
        subject: classData.subject,
        semester: classData.semester,
        academic_year: classData.academic_year,
        teaching_method: classData.teaching_method,
        capacity: classData.capacity,
        max_students: classData.capacity || 1,
        max_students: classData.max_students,
        roomNumber: classData.roomNumber || "",
        class_logo: classData.class_logo || null,
        status: classData.status,
        days_of_week: JSON.stringify(daysOfWeek),
        schedule: JSON.stringify(classData.schedule || {}),
        credits: classData.credits,
        startDate: classData.startDate ? new Date(classData.startDate) : new Date(),
        endDate: classData.endDate ? new Date(classData.endDate) : new Date(),
        school: { connect: { id: classData.schoolId } },
        teachers: classData.teacherId
          ? { create: [{ teacherId: classData.teacherId }] }
          : undefined,
      },
    });

    if (classData.studentIds?.length > 0) {
      const studentClassEntries = classData.studentIds.map((studentId) => ({
        studentId,
        classId: createdClass.id,
      }));
      await tx.studentClass.createMany({ data: studentClassEntries });

      await tx.student.updateMany({
        where: { id: { in: classData.studentIds } },
        data: { mainClassId: createdClass.id },
      });
    }

    return createdClass;
  });
};

const assignTeacherToClass = async (classId, teacherId) => {
  return await prisma.$transaction(async (tx) => {
    const existingClass = await tx.class.findUnique({ where: { id: classId } });
    if (!existingClass) throw new Error("Class not found.");

    const teacher = await tx.user.findUnique({
      where: { id: teacherId },
      include: { roles: { include: { role: true } } },
    });

    if (!teacher || !teacher.roles.some((r) => r.role.name === "teacher")) {
      throw new Error("Assigned user is not a teacher.");
    }

    return await tx.class.update({
      where: { id: classId },
      data: {
        teachers: {
          create: { teacherId },
        },
      },
    });
  });
};

const getAllClasses = async () => {
  return prisma.class.findMany({ include: defaultInclude });
};

const getClassById = async (classId) => {
  return prisma.class.findUnique({
    where: { id: classId },
    include: defaultInclude,
  });
};

const getClassesBySchoolId = async (schoolId) => {
  return prisma.class.findMany({
    where: { schoolId },
    include: defaultInclude,
  });
};
const updateClass = async (classId, updateData) => {
  console.log("UPDATE PAYLOAD:", updateData); // 🧪 Debug log

  const {
    schoolId,
    teacherId, // ignored in main update, handled separately if needed
    studentIds, // optional, not directly updated here
    ...rest
  } = updateData;

  return prisma.class.update({
    where: { id: classId },
    data: {
      ...rest,
      school: {
        connect: { id: schoolId }
      }
    }
  });
};


const deleteClass = async (classId) => {
  return prisma.class.delete({
    where: { id: Number(classId) },
  });
};

module.exports = {
  createClass,
  assignTeacherToClass,
  getAllClasses,
  getClassById,
  getClassesBySchoolId,
  updateClass,
  deleteClass,
};
