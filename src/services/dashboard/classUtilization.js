const { PrismaClient } = require("@prisma/client");
const { successResponse, errorResponse } = require("@/utils/responseUtil");

const prisma = new PrismaClient();

module.exports = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      select: {
        name: true,
        max_students: true,
        studentClasses: true,
      },
    });

    const result = classes
      .filter(c => c.max_students > 0)
      .map(c => ({
        className: c.name,
        utilization: parseFloat(((c.studentClasses.length / c.max_students) * 100).toFixed(2)),
      }));

    return successResponse(res, "Class utilization fetched", result);
  } catch (err) {
    console.error("Error fetching class utilization:", err);
    return errorResponse(res, "Failed to fetch utilization", 500, err);
  }
};
