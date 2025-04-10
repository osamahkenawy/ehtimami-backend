const studentService = require("@/services/studentService");
const { successResponse, errorResponse } = require("@/utils/responseUtil");

const getAllStudents = async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    return successResponse(res, "All students fetched successfully", students);
  } catch (error) {
    return errorResponse(res, "Failed to fetch students.");
  }
};

const getStudentsBySchoolId = async (req, res) => {
  try {
    const students = await studentService.getStudentsBySchoolId(req.params.schoolId);
    return successResponse(res, "Students by school fetched successfully", students);
  } catch (error) {
    return errorResponse(res, "Failed to fetch students by school.");
  }
};

const getStudentsByClassId = async (req, res) => {
  try {
    const students = await studentService.getStudentsByClassId(req.params.classId);
    return successResponse(res, "Students by class fetched successfully", students);
  } catch (error) {
    return errorResponse(res, "Failed to fetch students by class.");
  }
};

const createStudent = async (req, res) => {
  try {
    const student = await studentService.createStudent(req.body);
    return successResponse(res, "Student created successfully", student);
  } catch (error) {
    return errorResponse(res, error.message || "Failed to create student.");
  }
};

const deleteStudent = async (req, res) => {
  try {
    await studentService.deleteStudent(req.params.studentId);
    return successResponse(res, "Student deleted successfully");
  } catch (error) {
    return errorResponse(res, "Failed to delete student.");
  }
};

const activateStudent = async (req, res) => {
  try {
    await studentService.activateStudent(req.params.studentId);
    return successResponse(res, "Student activated successfully");
  } catch (error) {
    return errorResponse(res, "Failed to activate student.");
  }
};

const deactivateStudent = async (req, res) => {
  try {
    await studentService.deactivateStudent(req.params.studentId);
    return successResponse(res, "Student deactivated successfully");
  } catch (error) {
    return errorResponse(res, "Failed to deactivate student.");
  }
};

module.exports = {
  getAllStudents,
  getStudentsBySchoolId,
  getStudentsByClassId,
  createStudent,
  deleteStudent,
  activateStudent,
  deactivateStudent,
};
