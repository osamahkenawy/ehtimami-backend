const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Create a new class within a school.
 */
const createClass = async (data) => {
    return await prisma.$transaction(async (tx) => {
        const {
            name, gradeLevel, capacity, teacherId, roomNumber, schedule,
            startDate, endDate, schoolId
        } = data;

        // ✅ Ensure the school exists
        const school = await tx.school.findUnique({
            where: { id: schoolId }
        });

        if (!school) {
            throw new Error("Invalid school ID.");
        }

        let assignedTeacher = null;

        if (teacherId) {
            // ✅ Ensure the teacher exists & has the teacher role
            assignedTeacher = await tx.user.findUnique({
                where: { id: teacherId },
                include: { roles: { include: { role: true } } }
            });

            if (!assignedTeacher) {
                throw new Error("Teacher does not exist.");
            }

            const isTeacherRole = assignedTeacher.roles.some(role => role.role.name === "teacher");
            if (!isTeacherRole) {
                throw new Error("Assigned user is not a teacher.");
            }

            // ✅ Ensure the teacher belongs to the same school
            if (assignedTeacher.schoolId !== schoolId) {
                throw new Error("Teacher does not belong to this school.");
            }
        }

        // ✅ Create the class (Fix `teacherId` issue)
        return await tx.class.create({
            data: {
                name,
                gradeLevel,
                capacity: capacity ? capacity : 0,
                teacher: assignedTeacher ? { connect: { id: teacherId } } : undefined, // ✅ Corrected relation
                roomNumber:  roomNumber ? roomNumber : "",
                schedule,
                startDate: startDate ? new Date(startDate) : new Date(), // ✅ Convert to Date
                endDate: endDate ? new Date(endDate) : new Date(), // ✅ Convert to Date
                school: {
                    connect: { id: schoolId }, // ✅ Connect to school
                },
                status: "active",
            }
        });
    });
};


/**
 * Assign a teacher to an existing class.
 */
const assignTeacherToClass = async (classId, teacherId) => {
    return await prisma.$transaction(async (tx) => {
        // ✅ Ensure the class exists
        const existingClass = await tx.class.findUnique({
            where: { id: classId }
        });

        if (!existingClass) {
            throw new Error("Class not found.");
        }

        // ✅ Ensure the teacher exists and has the teacher role
        const teacher = await tx.user.findUnique({
            where: { id: teacherId },
            include: { roles: { include: { role: true } } }
        });

        if (!teacher) {
            throw new Error("Teacher does not exist.");
        }

        const isTeacherRole = teacher.roles.some(role => role.role.name === "teacher");
        if (!isTeacherRole) {
            throw new Error("Assigned user is not a teacher.");
        }

        // ✅ Ensure the teacher belongs to the same school as the class
        if (teacher.schoolId !== existingClass.schoolId) {
            throw new Error("Teacher does not belong to this school.");
        }

        // ✅ Assign teacher to class
        return await tx.class.update({
            where: { id: classId },
            data: { teacherId }
        });
    });
};

/**
 * Get all classes.
 */
const getAllClasses = async () => {
    return await prisma.class.findMany({
        include: {
            teacher: true,
            school: true
        }
    });
};

/**
 * Get a single class by its ID.
 */
const getClassById = async (classId) => {
    return await prisma.class.findUnique({
        where: { id: classId },
        include: {
            teacher: true,
            school: true
        }
    });
};

/**
 * Get all classes within a specific school.
 */
const getClassesBySchoolId = async (schoolId) => {
    return await prisma.class.findMany({
        where: { schoolId },
        include: {
            teacher: true,
            school: true
        }
    });
};

/**
 * Update a class.
 */
const updateClass = async (classId, updateData) => {
    return await prisma.class.update({
        where: { id: classId },
        data: updateData
    });
};

/**
 * Delete a class by its ID.
 */
const deleteClass = async (classId) => {
    return await prisma.class.delete({
        where: { id: Number(classId) }, // ✅ Ensure ID is a number
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
