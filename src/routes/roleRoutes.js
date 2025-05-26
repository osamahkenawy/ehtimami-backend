const express = require('express');
const router = express.Router();
const roleController = require('@/controllers/roleController');

router.get('/getRoles', roleController.getAllRoles);
router.post('/insert-role', roleController.createRole);
router.delete('/:roleId', roleController.deleteRole);

module.exports = router;