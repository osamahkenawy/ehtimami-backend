const express = require("express");
const router = express.Router();
const { fetchDashboardCounts } = require("@/controllers/dashboardController");

// Define a route for fetching school counts
router.get("/cards", fetchDashboardCounts);

module.exports = router;
