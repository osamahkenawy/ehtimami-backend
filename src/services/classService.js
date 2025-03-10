const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");

const prisma = new PrismaClient();

const classSchema = z.object({
    code: z.string().min(3, "Code must be at least 3 characters long"), 
    name: z.string().min(2, "Class name must be at least 2 characters long"),
    gradeLevel: z.string().min(1, "Grade level is required"),
    subject: z.string().min(2, "Subject name is required").default("General"),
    semester: z.number().min(1).default(1),
    academic_year: z.string().default("2024-2025"),
    teaching_method: z.enum(["online", "in-person", "hybrid"]).default("in-person"),
    capacity: z.number().min(1).optional().default(30),
    max_students: z.number().min(1).optional().default(35),
    roomNumber: z.string().optional(),
    class_logo: z.string().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
    schedule: z.record(z.string()).optional(), 
    start_time: z.string().default("08:00:00"),
    end_time: z.string().default("10:00:00"),
    credits: z.number().min(1).optional().default(3),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    schoolId: z.number(),
    teacherId: z.number().nullable().optional()
});

/**
 * ✅ Generate Unique Class Code
 */
const createClass = async (data) => {
    // ✅ Validate input using Zod
    const validatedData = classSchema.safeParse(data);

    if (!validatedData.success) {
        return { error: validatedData.error.errors.map(err => err.message).join(", ") };
    }

    const classData = validatedData.data;

    // ✅ Extract non-empty days from the schedule to create `days_of_week`
    const daysOfWeek = Object.keys(classData.schedule || {}).filter(
        (day) => classData.schedule[day] !== ""
    );

    return await prisma.$transaction(async (tx) => {
        return await tx.class.create({
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
                days_of_week: daysOfWeek.length ? JSON.stringify(daysOfWeek) : JSON.stringify([]), // ✅ Always store as JSON array
                schedule: classData.schedule ? JSON.stringify(classData.schedule) : JSON.stringify({}), // ✅ Convert schedule to JSON
                start_time: classData.start_time,
                end_time: classData.end_time,
                credits: classData.credits,
                startDate: classData.startDate ? new Date(classData.startDate) : new Date(), // ✅ Use current date if null
                endDate: classData.endDate ? new Date(classData.endDate) : new Date(), // ✅ Use current date if null
                school: { connect: { id: classData.schoolId } },
                teacher: classData.teacherId ? { connect: { id: classData.teacherId } } : undefined,
            }
        });
    });
};
/**
 * ✅ Create a class and store the schedule as JSON
 */

/**
 * ✅ Assign a teacher to an existing class.
 */
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

/**
 * ✅ Get all classes
 */
const getAllClasses = async () => {
    return prisma.class.findMany({
        include: { teachers: true, school: true }
    });
};

/**
 * ✅ Get a single class by its ID
 */
const getClassById = async (classId) => {
    return prisma.class.findUnique({
        where: { id: classId },
        include: { teachers: true, school: true }
    });
};

/**
 * ✅ Get all classes within a specific school
 */
const getClassesBySchoolId = async (schoolId) => {
    return prisma.class.findMany({
        where: { schoolId },
        include: { teachers: true, school: true }
    });
};

/**
 * ✅ Update a class
 */
const updateClass = async (classId, updateData) => {
    return prisma.class.update({
        where: { id: classId },
        data: updateData
    });
};

/**
 * ✅ Delete a class
 */
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
