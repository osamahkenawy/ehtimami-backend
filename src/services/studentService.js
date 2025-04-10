// src/services/studentService.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const getAllStudents = async () => {
  return prisma.student.findMany({
    include: {
      user: { include: { profile: true, roles: { include: { role: true } } } },
      school: true,
      studentClasses: {
        include: {
          class: true
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
      studentClasses: { include: { class: true } }
    }
  });
};

const getStudentsByClassId = async (classId) => {
  return prisma.studentClass.findMany({
    where: { classId: Number(classId) },
    include: {
      student: {
        include: {
          user: { include: { profile: true } },
          studentClasses: true
        }
      }
    }
  });
};

const createStudent = async (data) => {
    const { firstName, lastName, email, password, schoolId, grade, section, student_no, classIds = [] } = data;
  
    const hashedPassword = await bcrypt.hash(password || "Ehtimami@123", 10);
  
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          status: "ACTIVE",
          is_verified: true,
          roles: { create: { role: { connect: { name: "student" } } } },
          profile: { create: {} }
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
        // Ensure each classId exists
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
  
      return student;
    });
  };

const deleteStudent = async (studentId) => {
  return prisma.student.delete({ where: { id: Number(studentId) } });
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
  createStudent,
  deleteStudent,
  activateStudent,
  deactivateStudent
};