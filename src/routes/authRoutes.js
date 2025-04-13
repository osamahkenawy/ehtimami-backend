const express = require("express");
const { register, login,    forgotPassword,
    resetPassword, getAllRolesController } = require("@controllers/authController");

const router = express.Router();

// 🔐 Authentication Routes
router.post("/register", register);
router.post("/login", login);

// 🔁 Password Recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get('/roles', getAllRolesController);

module.exports = router;
