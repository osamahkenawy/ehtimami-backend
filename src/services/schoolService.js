const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createSchool = async (data) => {
    return prisma.school.create({ data });
};

const getAllSchools = async () => {
    return prisma.school.findMany({
        include: { manager: true }, // Includes school manager details
    });
};

const getSchoolById = async (schoolId) => {
    return prisma.school.findUnique({
        where: { id: parseInt(schoolId) },
        include: { manager: true },
    });
};

const updateSchool = async (schoolId, updateData) => {
    return prisma.school.update({
        where: { id: parseInt(schoolId) },
        data: updateData,
    });
};

const deleteSchool = async (schoolId) => {
    return prisma.school.delete({
        where: { id: parseInt(schoolId) },
    });
};

module.exports = {
    createSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    deleteSchool,
};
