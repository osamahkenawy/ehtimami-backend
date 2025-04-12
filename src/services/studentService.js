// src/services/studentService.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { studentSchema, updateStudentSchema } = require("@/validators/student.schema");

const prisma = new PrismaClient();

const getAllStudents = async () => {
  return prisma.student.findMany({
    include: {
      user: { include: { profile: true, roles: { include: { role: true } } } },
      school: true,
      studentClasses: { include: { class: true } },
      parents: {
        include: {
          user: { include: { profile: true } }
        }
      }
    }
  });
};

const getStudentsBySchoolId = async (schoolId) => {
  return prisma.student.findMany({
    where: { schoolId: Number(schoolId) },
    include: {
      user: { include: { profile: true } },
      studentClasses: { include: { class: true } },
      parents: {
        include: {
          user: { include: { profile: true } }
        }
      }
    }
  });
};

const getStudentsByClassId = async (classId) => {
  return prisma.studentClass.findMany({
    where: { classId: Number(classId) },
    include: {
      student: {
        include: {
          user: { include: { profile: true, roles: { include: { role: true } } } },
          school: true,
          studentClasses: { include: { class: true } },
          parents: {
            include: {
              user: { include: { profile: true } }
            }
          }
        }
      }
    }
  });
};

const getStudentById = async (userId) => {
  return prisma.student.findUnique({
    where: { userId: Number(userId) },
    include: {
      user: { include: { profile: true, roles: { include: { role: true } } } },
      school: true,
      studentClasses: { include: { class: true } },
      parents: {
        include: {
          user: { include: { profile: true } }
        }
      }
    }
  });
};

const connectStudentWithParents = async (studentId, parentUserIds = []) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Student not found");

  return prisma.$transaction(async (tx) => {
    await tx.parent.deleteMany({ where: { students: { some: { id: studentId } }, userId: { in: parentUserIds } } });
    const data = parentUserIds.map(userId => ({ userId, students: { connect: { id: studentId } } }));
    return Promise.all(data.map(p => tx.parent.upsert({
      where: { userId: p.userId },
      update: { students: { connect: { id: studentId } } },
      create: p
    })));
  });
};

const createStudent = async (data) => {
  const parsed = studentSchema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error.errors.map(err => err.message).join(", ");
    throw new Error(message);
  }
  const {
    firstName, lastName, email, password, phone, schoolId, grade, section, student_no,
    classIds = [], parentUserIds = [], profile = {}
  } = parsed.data;

  if (profile.birth_date) profile.birth_date = new Date(profile.birth_date);
  if (profile.join_date) profile.join_date = new Date(profile.join_date);

  const hashedPassword = await bcrypt.hash(password || "Ehtimami@123", 10);

  return prisma.$transaction(async (tx) => {
    const existingEmail = await tx.user.findUnique({ where: { email } });
    if (existingEmail) throw new Error(`User with email '${email}' already exists.`);

    const existingStudent = await tx.student.findUnique({ where: { student_no } });
    if (existingStudent) throw new Error(`Student number '${student_no}' already exists.`);

    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        status: "ACTIVE",
        is_verified: true,
        roles: { create: { role: { connect: { name: "student" } } } },
        profile: { create: profile }
      }
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        schoolId,
        grade,
        section,
        student_no
      }
    });

    if (classIds.length > 0) {
      const existingClasses = await tx.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true }
      });

      const validClassIds = existingClasses.map(cls => cls.id);
      const invalidClassIds = classIds.filter(id => !validClassIds.includes(id));

      if (invalidClassIds.length > 0) {
        throw new Error(`Invalid class IDs: ${invalidClassIds.join(", ")}`);
      }

      const studentClassLinks = validClassIds.map(classId => ({
        classId,
        studentId: student.id
      }));

      await tx.studentClass.createMany({ data: studentClassLinks });
    }

    if (parentUserIds.length > 0) {
      await connectStudentWithParents(student.id, parentUserIds);
    }

    return student;
  });
};

const updateStudent = async (userId, updateData) => {
  const parsed = updateStudentSchema.safeParse(updateData);
  if (!parsed.success) {
    const message = parsed.error.errors.map(err => err.message).join(", ");
    throw new Error(message);
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    profile = {},
    grade,
    section,
    student_no,
    classIds = []
  } = parsed.data;

  const student = await prisma.student.findUnique({ where: { userId: Number(userId) } });
  if (!student) throw new Error("Student not found");

  if (profile.birth_date) profile.birth_date = new Date(profile.birth_date);
  if (profile.join_date) profile.join_date = new Date(profile.join_date);

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: Number(userId) },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        profile: {
          upsert: {
            update: profile,
            create: profile
          }
        }
      }
    });

    await tx.student.update({
      where: { id: student.id },
      data: {
        grade,
        section,
        student_no
      }
    });

    if (Array.isArray(classIds)) {
      await tx.studentClass.deleteMany({ where: { studentId: student.id } });
      const links = classIds.map(classId => ({ studentId: student.id, classId }));
      await tx.studentClass.createMany({ data: links });
    }

    return await tx.student.findUnique({
      where: { id: student.id },
      include: {
        user: { include: { profile: true, roles: { include: { role: true } } } },
        school: true,
        studentClasses: { include: { class: true } },
        parents: { include: { user: { include: { profile: true } } } }
      }
    });
  });
};

const deleteStudent = async (studentId) => {
  const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
  if (!student) throw new Error("Student not found");

  return prisma.$transaction(async (tx) => {
    await tx.studentClass.deleteMany({ where: { studentId: student.id } });
    await tx.parent.deleteMany({ where: { students: { some: { id: student.id } } } });
    await tx.userProfile.deleteMany({ where: { userId: student.userId } });
    await tx.student.delete({ where: { id: student.id } });
    await tx.user.delete({ where: { id: student.userId } });
    return true;
  });
};

const activateStudent = async (studentId) => {
  const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
  return prisma.user.update({ where: { id: student.userId }, data: { status: "ACTIVE" } });
};

const deactivateStudent = async (studentId) => {
  const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
  return prisma.user.update({ where: { id: student.userId }, data: { status: "INACTIVE" } });
};

module.exports = {
  getAllStudents,
  getStudentsBySchoolId,
  getStudentsByClassId,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  activateStudent,
  deactivateStudent,
  connectStudentWithParents
};