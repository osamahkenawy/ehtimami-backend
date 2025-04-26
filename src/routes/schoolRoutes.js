const express = require("express");
const { createSchool, getAllSchools, getSchoolById, updateSchool, deleteSchool, fetchSchoolUsers, fetchAllUsersBySchoolId } = require("@controllers/schoolController");
const { authenticate } = require("@middlewares/authMiddleware");
const {checkSchoolExists} = require("@middlewares/checkSchoolExists");

const router = express.Router();

router.post("/create-new-school", authenticate, checkSchoolExists, createSchool);  // ✅ Middleware prevents duplicate schools
router.get("/get-all-schools", authenticate, getAllSchools);  
router.get("/:schoolId", authenticate, getSchoolById);  
router.put("/:schoolId", authenticate, updateSchool);  
router.delete("/:schoolId", authenticate, deleteSchool);  
router.get("/users/:userId",authenticate, fetchSchoolUsers);
router.get("/all-users/:schoolId", authenticate, fetchAllUsersBySchoolId);

module.exports = router;
