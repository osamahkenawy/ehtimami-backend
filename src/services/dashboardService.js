const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getDashboardSummary = async () => {
  const totalSchools = await prisma.school.count();
  const activeSchools = await prisma.school.count({
    where: { status: { name: 'Active' } }
  });
  const inactiveSchools = await prisma.school.count({
    where: { status: { name: 'Inactive' } }
  });

  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({
    where: { statusId: 1 }
  });
  const inactiveUsers = await prisma.user.count({
    where: { statusId: 2 }
  });
  const terminatedUsers = await prisma.user.count({
    where: { statusId: 3 }
  });

  const totalClasses = await prisma.class.count();
  const activeClasses = await prisma.class.count({
    where: { status: 'active' }
  });
  const inactiveClasses = await prisma.class.count({
    where: { status: 'inactive' }
  });

  return {
    schools: {
      all: totalSchools,
      active: activeSchools,
      inactive: inactiveSchools
    },
    users: {
      all: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      terminated: terminatedUsers
    },
    classes: {
      all: totalClasses,
      active: activeClasses,
      inactive: inactiveClasses
    }
  };
};

module.exports = {
    getDashboardSummary
};
