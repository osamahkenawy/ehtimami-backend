const express = require("express");
const { registerTeacherController,getAllTeachersController, deleteTeacherController,updateTeacherController, assignTeacherToClassesController, getTeachersBySchoolController, getTeacherByIdController } = require("@/controllers/teacherController");
const { authenticate } = require("@middlewares/authMiddleware");
const { checkSchoolExistsById } = require("@/middlewares/checkSchoolExists");

const router = express.Router();

// ✅ Register Teacher
router.post("/register",authenticate, registerTeacherController);

// ✅ Assign Teacher to Classes
router.post("/assign-classes",authenticate, assignTeacherToClassesController);

// ✅ Get All Teachers
router.get("/", authenticate, getAllTeachersController);

router.post("/by-school", authenticate, checkSchoolExistsById, getTeachersBySchoolController);
router.get("/:teacherId",authenticate, getTeacherByIdController);

// ✅ Delete Teacher
router.delete("/:teacherId",authenticate, deleteTeacherController);

router.put("/:teacherId",authenticate, updateTeacherController);

module.exports = router;
