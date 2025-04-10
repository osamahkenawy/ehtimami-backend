const express = require("express");
const {
  getAllStudents,
  getStudentById,
  getStudentsBySchoolId,
  getStudentsByClassId,
  createStudent,
  updateStudent,
  deleteStudent,
  activateStudent,
  deactivateStudent
} = require("@/controllers/studentController");

const router = express.Router();

router.get("/all", getAllStudents);
router.get("/:studentId", getStudentById);
router.get("/school/:schoolId", getStudentsBySchoolId);
router.get("/class/:classId", getStudentsByClassId);
router.post("/", createStudent);
router.put("/:studentId", updateStudent);
router.delete("/:studentId", deleteStudent);
router.patch("/:studentId/activate", activateStudent);
router.patch("/:studentId/deactivate", deactivateStudent);

module.exports = router;
