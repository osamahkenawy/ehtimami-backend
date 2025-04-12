const studentService = require("@/services/studentService");
const { successResponse, errorResponse } = require("@/utils/responseUtil");

const getAllStudents = async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    return successResponse(res, "Students fetched successfully", students);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await studentService.getStudentById(studentId);
    if (!student) return errorResponse(res, "Student not found", 404);
    return successResponse(res, "Student fetched successfully", student);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getStudentsBySchoolId = async (req, res) => {
  try {
    const students = await studentService.getStudentsBySchoolId(req.params.schoolId);
    return successResponse(res, "Students by school fetched", students);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getStudentsByClassId = async (req, res) => {
  try {
    const students = await studentService.getStudentsByClassId(req.params.classId);
    return successResponse(res, "Students by class fetched", students);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const createStudent = async (req, res) => {
  try {
    const student = await studentService.createStudent(req.body);
    return successResponse(res, "Student created successfully", student);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const updated = await studentService.updateStudent(studentId, req.body);
    return successResponse(res, "Student updated successfully", updated);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const deleteStudent = async (req, res) => {
  try {
    await studentService.deleteStudent(req.params.studentId);
    return successResponse(res, "Student deleted successfully");
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const activateStudent = async (req, res) => {
  try {
    await studentService.activateStudent(req.params.studentId);
    return successResponse(res, "Student activated");
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const deactivateStudent = async (req, res) => {
  try {
    await studentService.deactivateStudent(req.params.studentId);
    return successResponse(res, "Student deactivated");
  } catch (err) {
    return errorResponse(res, err.message);
  }
};


const connectParentsToStudent = async (req, res) => {
    const { studentId } = req.params;
    const { parentUserIds } = req.body;
  
    try {
      if (!Array.isArray(parentUserIds) || parentUserIds.length === 0) {
        return res.status(400).json({ message: "parentUserIds must be a non-empty array." });
      }
  
      await studentService.connectStudentWithParents(Number(studentId), parentUserIds);
      return res.status(200).json({ message: "Parents connected successfully." });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Failed to connect parents." });
    }
  };

module.exports = {
  getAllStudents,
  getStudentById,
  getStudentsBySchoolId,
  getStudentsByClassId,
  createStudent,
  updateStudent,
  deleteStudent,
  activateStudent,
  deactivateStudent,
  connectParentsToStudent
};
