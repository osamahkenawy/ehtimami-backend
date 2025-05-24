const { PrismaClient } = require("@prisma/client");
const { startOfMonth, subMonths, endOfMonth } = require("date-fns");

const prisma = new PrismaClient();
const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

module.exports = async (req) => {
  const [
    totalStudents,
    totalTeachers,
    totalParents,
    totalSchools,
    totalUsers,
    activeUsers,
    inactiveUsers,
    verifiedUsers,
    usersLastMonth,
    totalClasses,
    fullClasses,
    upcomingClasses,
    studentsWithHealthNotes,
    specialNeedsStudents,
    teachersWithoutClasses,
    studentsWithoutParents
  ] = await Promise.all([
    prisma.student.count(),
    prisma.user.count({
      where: {
        roles: {
          some: {
            role: {
              name: "teacher" // ✅ check Role.name through UserAccessRoles
            }
          }
        }
      }
    }),
    prisma.parent.count(),
    prisma.school.count(),
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "INACTIVE" } }),
    prisma.user.count({ where: { is_verified: true } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    }),
    prisma.class.count(),
    prisma.class.count({
      where: {
        studentClasses: { some: {} },
        max_students: { gt: 0 }
      }
    }),
    prisma.class.count({
      where: {
        startDate: { gt: new Date() }
      }
    }),
    prisma.student.count({
      where: {
        health_notes: { not: null }
      }
    }),
    prisma.student.count({
      where: {
        is_special_needs: true
      }
    }),
    prisma.employee.count({
      where: {
        position: {
          contains: "teacher"
        },
        NOT: {
          user: {
            teacherClasses: {
              some: {}
            }
          }
        }
      }
    }),
    prisma.student.count({
      where: {
        parents: {
          none: {}
        }
      }
    })
  ]);

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { profile: true }
  });

  return {
    stats: {
      totalStudents,
      totalTeachers,
      totalParents,
      totalSchools,
      totalUsers,
      activeUsers,
      inactiveUsers,
      verifiedUsers,
      totalClasses,
      fullClasses,
      upcomingClasses,
      studentsWithHealthNotes,
      specialNeedsStudents,
      teachersWithoutClasses,
      studentsWithoutParents,
      usersLastMonth
    },
    recentUsers
  };
};
