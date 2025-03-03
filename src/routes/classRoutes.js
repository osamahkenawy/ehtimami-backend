const express = require('express');
const router = express.Router();
const {
    createNewClass,
    getAllClasses,
    getClassById,
    updateClass,
    deleteClass,
    getClassesBySchoolId
} = require('@/controllers/classController');
const { checkSchoolExists, checkTeacherExists } = require('@/middlewares/schoolAndTeacherMiddleware');

// Route to create a new class after checking school and teacher existence
router.post('/create-new-class', checkSchoolExists, checkTeacherExists, createNewClass);

// Route to retrieve all classes
router.get('/', getAllClasses);

// Route to retrieve a class by ID
router.get('/:id', getClassById);

// Route to update a class by ID
router.put('/:id', checkSchoolExists, checkTeacherExists, updateClass);

// Route to delete a class by ID
router.delete('/:id', deleteClass);

router.get('/school/:schoolId', getClassesBySchoolId);
module.exports = router;
