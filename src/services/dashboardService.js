// /services/dashboardService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getDashboardSummary = async () => {
  const totalSchools = await prisma.school.count();
  const activeSchools = await prisma.school.count({
    where: { status: { name: 'Active' } }
});
const inActiveSchools = await prisma.school.count({
    where: { status: { name: 'Inactive' } }
});
const totalUsers = await prisma.user.count();
const activeUsers = await prisma.user.count({
    where: { statusId: 1 } // Assuming '1' is for 'Active'
});
const inActiveUsers = await prisma.user.count({
    where: { statusId: 2 } // Assuming '1' is for 'Active' 
});
const TerminatedUsers = await prisma.user.count({
    where: { statusId: 3 } // Assuming '1' is for 'Active'
});
return {
   schools: {
    all: totalSchools,
    active: activeSchools,
    inactive: inActiveSchools
   },
   users: {
    all: totalUsers,
    active: activeUsers,
    inactive: inActiveUsers,
    terminated: TerminatedUsers
   },
};
};


module.exports = {
    getDashboardSummary
};
