const roleService = require('@/services/roleService');
const { successResponse, errorResponse } = require('@/utils/responseUtil');

const getAllRoles = async (req, res) => {
  try {
    const roles = await roleService.getAllRolesWithUserCount();
    return successResponse(res, roles, 'Roles fetched');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fetch roles');
  }
};

const createRole = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return errorResponse(res, 'Role name is required', 400);

    const role = await roleService.createRole(name);
    return successResponse(res, role, 'Role created');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to create role');
  }
};

const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    await roleService.deleteRole(parseInt(roleId));
    return successResponse(res, null, 'Role deleted');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to delete role');
  }
};

module.exports = {
  getAllRoles,
  createRole,
  deleteRole,
};
