const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require("@/utils/responseUtil");

module.exports = async (req, res) => {
  try {
    const results = await prisma.$queryRaw`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count
      FROM User
      WHERE createdAt IS NOT NULL
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6;
    `;

    const formatted = results
      .map((row) => ({
        month: row.month,
        count: Number(row.count) // ✅ Convert BigInt to Number
      }))
      .reverse(); // Display oldest to newest

    return successResponse(res, "Recent registrations fetched", formatted);
  } catch (err) {
    console.error("Error fetching recent registrations:", err);
    return errorResponse(res, "Failed to fetch recent registrations", 500, err);
  }
};
