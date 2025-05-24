const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async (req) => {
  const studentsPerSchool = await prisma.school.findMany({
    select: {
      school_name: true,
      _count: {
        select: {
          students: true
        }
      }
    },
    orderBy: {
      school_name: "asc"
    }
  });

  return studentsPerSchool.map((school) => ({
    schoolName: school.school_name,
    studentCount: school._count.students
  }));
};
