const { getDashboardSummary } = require("@/services/dashboardService");
const { successResponse, errorResponse } = require("@/utils/responseUtil");

const fetchDashboardCounts = async (req, res) => {
    try {
        const counts = await getDashboardSummary();
        return successResponse(res, "Retrieved counts successfully", counts);
    } catch (error) {
        return errorResponse(res, "Failed to retrieve counts", error.message);
    }
};

module.exports = {
    fetchDashboardCounts
};
