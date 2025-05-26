const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllRolesWithUserCount = async () => {
  return await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });
};

const createRole = async (name) => {
  return await prisma.role.create({ data: { name } });
};

const deleteRole = async (roleId) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { users: true },
  });

  if (!role) throw new Error("Role not found");
  if (role.users.length > 0) throw new Error("Cannot delete role with users");

  return await prisma.role.delete({ where: { id: roleId } });
};

module.exports = {
  getAllRolesWithUserCount,
  createRole,
  deleteRole,
};
