const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getDashboardSummary = async () => {
  try {
    // ✅ Batch queries for optimized performance
    const [
      totalSchools,
      activeSchools,
      inactiveSchools,
      totalUsers,
      activeUsers,
      inactiveUsers,
      terminatedUsers,
      totalClasses,
      activeClasses,
      inactiveClasses
    ] = await prisma.$transaction([
      prisma.school.count(),
      prisma.school.count({ where: { status: "ACTIVE" } }), // ✅ Use raw string for enums
      prisma.school.count({ where: { status: "INACTIVE" } }),

      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }), // ✅ Use raw string for enums
      prisma.user.count({ where: { status: "INACTIVE" } }),
      prisma.user.count({ where: { status: "TERMINATED" } }),

      prisma.class.count(),
      prisma.class.count({ where: { status: "active" } }),
      prisma.class.count({ where: { status: "inactive" } })
    ]);

    // ✅ Return structured dashboard summary
    return {
      schools: {
        total: totalSchools,
        active: activeSchools,
        inactive: inactiveSchools
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        terminated: terminatedUsers
      },
      classes: {
        total: totalClasses,
        active: activeClasses,
        inactive: inactiveClasses
      }
    };
  } catch (error) {
    console.error("❌ Error fetching dashboard summary:", error);
    return { error: "An unexpected error occurred while fetching dashboard data." };
  }
};

module.exports = {
    getDashboardSummary
};
