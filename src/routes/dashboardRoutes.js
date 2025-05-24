const express = require("express");
const {
  getAdminDashboardCards,
  getStudentsPerSchool,
  getTeachersPerSchool,
  getRecentRegistrations,
  getClassUtilization,
} = require("@/controllers/dashboardController");

const router = express.Router();

// Admin Dashboard Cards (metrics)
router.get("/cards", getAdminDashboardCards);

// Students per School (for chart usage)
router.get("/students-per-school", getStudentsPerSchool);
router.get("/teachers-per-school", getTeachersPerSchool);
router.get("/recent-registrations", getRecentRegistrations);
router.get("/class-utilization", getClassUtilization);

module.exports = router;
