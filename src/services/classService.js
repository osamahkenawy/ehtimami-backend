const { PrismaClient } = require("@prisma/client");
const { classSchema } = require("@/validators/classValidator");

const prisma = new PrismaClient();

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
                  select: { id: true }
              })
            : Promise.resolve([])
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
        try {
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
                    max_students: classData.max_students,
                    roomNumber: classData.roomNumber || "",
                    class_logo: classData.class_logo || null,
                    status: classData.status,
                    days_of_week: JSON.stringify(daysOfWeek),
                    schedule: JSON.stringify(classData.schedule || {}),
                    start_time: classData.start_time,
                    end_time: classData.end_time,
                    credits: classData.credits,
                    startDate: classData.startDate ? new Date(classData.startDate) : new Date(),
                    endDate: classData.endDate ? new Date(classData.endDate) : new Date(),
                    school: { connect: { id: classData.schoolId } },
                    teachers: classData.teacherId
                        ? { create: [{ teacherId: classData.teacherId }] }
                        : undefined,
                },
            });

            if (classData.studentIds && classData.studentIds.length > 0) {
                const studentClassEntries = classData.studentIds.map((studentId) => ({
                    studentId,
                    classId: createdClass.id,
                }));
                await tx.studentClass.createMany({ data: studentClassEntries });
            }

            return createdClass;
        } catch (error) {
            console.error("Error creating class:", error);
            throw new Error("Failed to create class. Please check the provided data.");
        }
    });
};

const assignTeacherToClass = async (classId, teacherId) => {
    return await prisma.$transaction(async (tx) => {
        const existingClass = await tx.class.findUnique({ where: { id: classId } });
        if (!existingClass) throw new Error("Class not found.");

        const teacher = await tx.user.findUnique({
            where: { id: teacherId },
            include: { roles: { include: { role: true } } }
        });

        if (!teacher || !teacher.roles.some(role => role.role.name === "teacher")) {
            throw new Error("Assigned user is not a teacher.");
        }

        return await tx.class.update({
            where: { id: classId },
            data: { teacherId }
        });
    });
};

const getAllClasses = async () => {
    return prisma.class.findMany({
        include: {
            teachers: {
                include: {
                    teacher: {
                        include: {
                            profile: true,
                        }
                    }
                }
            },
            studentClasses: {
                include: {
                    student: {
                        include: {
                            user: { include: { profile: true } }
                        }
                    }
                }
            },
            school: true
        }
    });
};

const getClassById = async (classId) => {
    return prisma.class.findUnique({
        where: { id: classId },
        include: {
            teachers: true,
            school: true,
            studentClasses: {
                include: {
                    student: {
                        include: {
                            user: { include: { profile: true } }
                        }
                    }
                }
            }
        }
    });
};

const getClassesBySchoolId = async (schoolId) => {
    return prisma.class.findMany({
        where: { schoolId },
        include: { teachers: true, school: true }
    });
};

const updateClass = async (classId, updateData) => {
    return prisma.class.update({
        where: { id: classId },
        data: updateData
    });
};

const deleteClass = async (classId) => {
    return prisma.class.delete({
        where: { id: Number(classId) }
    });
};

module.exports = {
    createClass,
    assignTeacherToClass,
    getAllClasses,
    getClassById,
    getClassesBySchoolId,
    updateClass,
    deleteClass
};
