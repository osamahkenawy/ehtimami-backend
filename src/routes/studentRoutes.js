const express = require("express");
const {
  getAllStudents,
  getStudentsBySchoolId,
  getStudentsByClassId,
  createStudent,
  deleteStudent,
  activateStudent,
  deactivateStudent
} = require("@/controllers/studentController");

const { authenticate } = require("@/middlewares/authMiddleware");
const { validateCreateStudent } = require("@/middlewares/studentValidator");

const router = express.Router();

router.get("/all", authenticate, getAllStudents);
router.get("/school/:schoolId", authenticate, getStudentsBySchoolId);
router.get("/class/:classId", authenticate, getStudentsByClassId);
router.post("/create", authenticate, validateCreateStudent, createStudent);
router.delete("/:studentId", authenticate, deleteStudent);
router.patch("/activate/:studentId", authenticate, activateStudent);
router.patch("/deactivate/:studentId", authenticate, deactivateStudent);

module.exports = router;
