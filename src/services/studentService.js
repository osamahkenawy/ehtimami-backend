// src/services/studentService.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { studentSchema, updateStudentSchema } = require("@/validators/student.schema");
const { sendEmail, getEmailTemplate } = require("@/utils/emailUtil");

const prisma = new PrismaClient();
const studentInclude = {
  user: { include: { profile: true, roles: { include: { role: true } } } },
  school: true,
  mainClass: true,
  studentClasses: { include: { class: true } },
  parents: { include: { user: { include: { profile: true } } } }
};

const getAllStudents = async () => {
  return prisma.student.findMany({ include: studentInclude });
};

const getStudentsBySchoolId = async (schoolId) => {
  return prisma.student.findMany({
    where: { schoolId: Number(schoolId) },
    include: studentInclude
  });
};

const getStudentsByClassId = async (classId) => {
  return prisma.student.findMany({
    where: {
      studentClasses: {
        some: { classId: Number(classId) }
      }
    },
    include: studentInclude
  });
};


const getStudentById = async (userId) => {
  if (!userId) {
    throw new Error("userId is required to fetch student.");
  }

  return prisma.student.findUnique({
    where: { userId: Number(userId) },
    include: studentInclude
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
    classIds = [], parentInfo = [], profile = {},
    admission_date, previous_school, guardian_name, guardian_relation, guardian_contact,
    is_special_needs, learning_style, health_notes, device_id, student_category
  } = parsed.data;

  if (profile.birth_date) profile.birth_date = new Date(profile.birth_date);
  if (profile.join_date) profile.join_date = new Date(profile.join_date);

  const hashedPassword = await bcrypt.hash(password || "student@123", 10);
  const parentsToEmail = [];

  const student = await prisma.$transaction(async (tx) => {
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

    let mainClassId = null;
    if (classIds.length > 0) {
      const existingClasses = await tx.class.findMany({ where: { id: { in: classIds } }, select: { id: true } });
      const validClassIds = existingClasses.map(cls => cls.id);
      const invalidClassIds = classIds.filter(id => !validClassIds.includes(id));
      if (invalidClassIds.length > 0) throw new Error(`Invalid class IDs: ${invalidClassIds.join(", ")}`);
      mainClassId = validClassIds.length > 0 ? validClassIds[0] : null;
    }

    const student = await tx.student.create({
      data: {
        userId: user.id,
        schoolId,
        grade,
        section,
        student_no,
        mainClassId,
        admission_date: admission_date ? new Date(admission_date) : undefined,
        previous_school,
        guardian_name,
        guardian_relation,
        guardian_contact,
        is_special_needs: is_special_needs ?? false,
        learning_style,
        health_notes,
        device_id,
        student_category
      }
    });

    if (classIds.length > 0) {
      const studentClassLinks = classIds.map(classId => ({ classId, studentId: student.id }));
      await tx.studentClass.createMany({ data: studentClassLinks });
    }

    if (parentInfo.length > 0) {
      for (const parent of parentInfo) {
        let parentUser = await tx.user.findUnique({ where: { email: parent.email } });

        if (!parentUser) {
          const hashedParentPassword = await bcrypt.hash("Parent@123", 10);

          parentUser = await tx.user.create({
            data: {
              firstName: parent.firstName,
              lastName: parent.lastName,
              email: parent.email,
              phone: parent.phone || null,
              password: hashedParentPassword,
              status: "ACTIVE",
              is_verified: true,
              roles: { create: { role: { connect: { id: 4 } } } },
              profile: { create: {} }
            }
          });

          parentsToEmail.push({
            email: parent.email,
            parentName: `${parent.firstName} ${parent.lastName}`,
          });
        }

        await tx.parent.upsert({
          where: { userId: parentUser.id },
          update: { students: { connect: { id: student.id } } },
          create: { userId: parentUser.id, students: { connect: { id: student.id } } }
        });
      }
    }

    return student;
  });

  // ✅ After transaction ends, send emails (non-blocking)
  (async () => {
    for (const parent of parentsToEmail) {
      try {
        const welcomeHtml = getEmailTemplate("parentWelcome", {
          parentName: parent.parentName,
          email: parent.email,
          password: parent.password,
          childName: `${firstName} ${lastName}`
        });
        await sendEmail(
          parent.email,
          "Your Parent Account Created - Ehtimami",
          welcomeHtml
        );
      } catch (error) {
        console.error(`Failed to send email to ${parent.email}`, error.message);
      }
    }
  })();

  return student;
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
    classIds = [],
    parentInfo = [],
    admission_date,
    previous_school,
    guardian_name,
    guardian_relation,
    guardian_contact,
    is_special_needs,
    learning_style,
    health_notes,
    device_id,
    student_category
  } = parsed.data;

  const student = await prisma.student.findUnique({ where: { userId: Number(userId) } });
  if (!student) throw new Error("Student not found");

  if (profile.birth_date) profile.birth_date = new Date(profile.birth_date);
  if (profile.join_date) profile.join_date = new Date(profile.join_date);

  const parentsToEmail = [];

  const updatedStudent = await prisma.$transaction(async (tx) => {
    // 🛠 Update the User (firstName, lastName, email, phone, profile)
    await tx.user.update({
      where: { id: Number(userId) },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        profile: { upsert: { update: profile, create: profile } }
      }
    });

    // 🛠 Validate Class IDs
    let mainClassId = student.mainClassId;
    if (Array.isArray(classIds) && classIds.length > 0) {
      const existingClasses = await tx.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true }
      });

      const validClassIds = existingClasses.map(cls => cls.id);
      const invalidClassIds = classIds.filter(id => !validClassIds.includes(id));

      if (invalidClassIds.length > 0) {
        throw new Error(`Invalid class IDs: ${invalidClassIds.join(", ")}`);
      }

      mainClassId = validClassIds.length > 0 ? validClassIds[0] : null;

      // 🛠 Update student's classes
      await tx.studentClass.deleteMany({ where: { studentId: student.id } });
      const links = validClassIds.map(classId => ({ studentId: student.id, classId }));
      await tx.studentClass.createMany({ data: links });
    }

    // 🛠 Update the Student
    await tx.student.update({
      where: { id: student.id },
      data: {
        grade,
        section,
        student_no,
        mainClassId,
        admission_date: admission_date ? new Date(admission_date) : undefined,
        previous_school,
        guardian_name,
        guardian_relation,
        guardian_contact,
        is_special_needs: is_special_needs ?? student.is_special_needs,
        learning_style,
        health_notes,
        device_id,
        student_category
      }
    });

    // 🛠 Handle Parents
    if (parentInfo.length > 0) {
      for (const parent of parentInfo) {
        let parentUser = await tx.user.findUnique({ where: { email: parent.email } });

        if (!parentUser) {
          const hashedParentPassword = await bcrypt.hash("Parent@123", 10);

          parentUser = await tx.user.create({
            data: {
              firstName: parent.firstName,
              lastName: parent.lastName,
              email: parent.email,
              phone: parent.phone || null,
              password: hashedParentPassword,
              status: "ACTIVE",
              is_verified: true,
              roles: { create: { role: { connect: { id: 4 } } } },
              profile: { create: {} }
            }
          });

          parentsToEmail.push({
            email: parent.email,
            password: "Parent@123", // 📧 Send Password too!
            parentName: `${parent.firstName} ${parent.lastName}`
          });
        }

        await tx.parent.upsert({
          where: { userId: parentUser.id },
          update: { students: { connect: { id: student.id } } },
          create: { userId: parentUser.id, students: { connect: { id: student.id } } }
        });
      }
    }

    return tx.student.findUnique({
      where: { id: student.id },
      include: studentInclude
    });
  });

  // ✅ After transaction ends, send emails asynchronously
  (async () => {
    for (const parent of parentsToEmail) {
      try {
        const welcomeHtml = getEmailTemplate("parentWelcome", {
          parentName: parent.parentName,
          email: parent.email,
          password: parent.password,
          childName: `${firstName} ${lastName}`
        });
        await sendEmail(
          parent.email,
          "Your Parent Account Created - Ehtimami",
          welcomeHtml
        );
      } catch (error) {
        console.error(`Failed to send email to ${parent.email}`, error.message);
      }
    }
  })();

  return updatedStudent;
};



const deleteStudent = async (studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(studentId) },
    include: { parents: true } // we need parents now
  });
  if (!student) throw new Error("Student not found");

  return prisma.$transaction(async (tx) => {
    // 1. Remove all student-class links
    await tx.studentClass.deleteMany({ where: { studentId: student.id } });

    // 2. Disconnect this student from all parents
    await Promise.all(
      student.parents.map(async (parent) => {
        await tx.parent.update({
          where: { id: parent.id },
          data: {
            students: {
              disconnect: { id: student.id }
            }
          }
        });
      })
    );

    // 3. Delete student's profile
    await tx.userProfile.deleteMany({ where: { userId: student.userId } });

    // 4. Delete the student record
    await tx.student.delete({ where: { id: student.id } });

    // 5. Delete the student's user account
    await tx.user.delete({ where: { id: student.userId } });

    // 6. Check if parents still have other students
    for (const parent of student.parents) {
      const parentWithStudents = await tx.parent.findUnique({
        where: { id: parent.id },
        include: { students: true }
      });

      if (!parentWithStudents || parentWithStudents.students.length === 0) {
        await tx.userProfile.deleteMany({ where: { userId: parent.userId } });
        await tx.parent.delete({ where: { id: parent.id } });
        await tx.user.delete({ where: { id: parent.userId } });
      }
    }

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

const getStudentsWithMedicalConditions = async (schoolId = null) => {
  const whereCondition = {
    AND: [
      { health_notes: { not: null } },
      { health_notes: { not: "" } }
    ]
  };

  if (schoolId) {
    whereCondition.AND.push({ schoolId: Number(schoolId) });
  }

  return prisma.student.findMany({
    where: whereCondition,
    include: studentInclude
  });
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
  connectStudentWithParents,
  getStudentsWithMedicalConditions,
};