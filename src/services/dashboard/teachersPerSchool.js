const { PrismaClient } = require("@prisma/client");
const { successResponse, errorResponse } = require("@/utils/responseUtil");

const prisma = new PrismaClient();

module.exports = async (req, res) => {
  try {
    // Get all schools with their teacher count (users with 'teacher' role assigned and linked via UserSchool)
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        school_name: true,
        users: {
          where: {
            user: {
              roles: {
                some: {
                  role: {
                    name: "teacher"
                  }
                }
              }
            }
          },
          select: {
            userId: true
          }
        }
      },
      orderBy: {
        school_name: "asc"
      }
    });

    const formattedData = schools.map((school) => ({
      schoolName: school.school_name,
      teacherCount: school.users.length
    }));

    return successResponse(
      res,
      "Teacher counts per school retrieved successfully",
      formattedData
    );
  } catch (err) {
    console.error("Error fetching teachers per school:", err);
    return errorResponse(res, "Failed to retrieve teacher data", 500, err);
  }
};
