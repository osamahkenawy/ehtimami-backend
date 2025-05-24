const adminDashboard = require("@/services/dashboard/adminDashboard");
const studentsPerSchool = require("@/services/dashboard/studentsPerSchool");
const teachersPerSchool = require("@/services/dashboard/teachersPerSchool");
const recentRegistrations = require("@/services/dashboard/recentRegistrations");
const classUtilization = require("@/services/dashboard/classUtilization");

const { successResponse, errorResponse } = require("@/utils/responseUtil");

const getAdminDashboardCards = async (req, res) => {
  try {
    const { stats } = await adminDashboard(req);
    return successResponse(res, "Admin dashboard cards fetched", stats);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getStudentsPerSchool = async (req, res) => {
  try {
    const data = await studentsPerSchool(req);
    return successResponse(res, "Student counts per school retrieved successfully", data);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};
const getTeachersPerSchool = async (req, res) => {
    return await teachersPerSchool(req, res);
  };
  const getRecentRegistrations = async (req, res) => {
    return await recentRegistrations(req, res);
  };
  const getClassUtilization = async (req, res) => {
    return await classUtilization(req, res);
  };
module.exports = {
  getAdminDashboardCards,
  getStudentsPerSchool,
  getTeachersPerSchool,
  getRecentRegistrations,
  getClassUtilization,
};
