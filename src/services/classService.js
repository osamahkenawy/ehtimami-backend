const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Create a new class within a school.
 */
const createClass = async (data) => {
    const {
        name, gradeLevel, capacity, teacherId, roomNumber, schedule,
        startDate, endDate, schoolId
    } = data;

    try {
        return await prisma.class.create({
            data: {
                name,
                gradeLevel,
                capacity,
                teacherId,
                roomNumber,
                schedule,  // Assuming schedule is already a JSON object
                startDate,
                endDate,
                schoolId,
                status: "active"
            }
        });
    } catch (error) {
        console.error("Error creating class:", error);
        throw new Error("Failed to create class.");
    }
};

/**
 * Get all classes.
 */
const getAllClasses = async () => {
    try {
        return await prisma.class.findMany({
            include: {
                teacher: true,
                school: true
            }
        });
    } catch (error) {
        console.error("Error fetching all classes:", error);
        throw new Error("Failed to fetch all classes.");
    }
};

/**
 * Get a single class by its ID.
 */
const getClassById = async (classId) => {
    try {
        return await prisma.class.findUnique({
            where: { id: parseInt(classId) },
            include: {
                teacher: true,
                school: true
            }
        });
    } catch (error) {
        console.error("Error fetching class by ID:", error);
        throw new Error("Class not found.");
    }
};

/**
 * Update a class.
 */
const updateClass = async (classId, updateData) => {
    try {
        return await prisma.class.update({
            where: { id: parseInt(classId) },
            data: updateData
        });
    } catch (error) {
        console.error("Error updating class:", error);
        throw new Error("Failed to update class.");
    }
};

/**
 * Delete a class by its ID.
 */
const deleteClass = async (classId) => {
    try {
        return await prisma.class.delete({
            where: { id: parseInt(classId) }
        });
    } catch (error) {
        console.error("Error deleting class:", error);
        throw new Error("Failed to delete class.");
    }
};

const getClassesBySchoolId = async (schoolId) => {
    return await prisma.class.findMany({
        where: { schoolId: parseInt(schoolId) },
        include: {
            teacher: true,
            school: true
        }
    });
};

module.exports = {
    createClass,
    getAllClasses,
    getClassById,
    updateClass,
    deleteClass,
    getClassesBySchoolId
};
