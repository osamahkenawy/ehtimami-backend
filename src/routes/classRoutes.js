const express = require('express');
const router = express.Router();
const {
    createNewClass,
    getAllClasses,
    getClassById,
    getClassesBySchoolId,
    updateClass,
    deleteClass,
    assignTeacherToClass
} = require('@/controllers/classController');

const { checkSchoolExists, checkTeacherExists } = require('@/middlewares/schoolAndTeacherMiddleware');
const { validateClassUpdate, validateClassCreate } = require("@/validators/classValidator");

// ✅ Create a new class with validation (Teacher is Optional at Creation)
router.post('/create-new-class',  checkSchoolExists, createNewClass);

// ✅ Assign a teacher to a class
router.post('/assign-teacher', checkTeacherExists, assignTeacherToClass);

// ✅ Get all classes
router.get('/', getAllClasses);

// ✅ Get a class by ID
router.get('/:id', getClassById);

// ✅ Update a class by ID
router.put('/:id',  updateClass);

// ✅ Delete a class by ID
router.delete('/:id', deleteClass);

// ✅ Get all classes by school ID
router.get('/school/:schoolId', getClassesBySchoolId);

module.exports = router;
