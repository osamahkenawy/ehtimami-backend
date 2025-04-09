const express = require("express");
const { register, login,    forgotPassword,
    resetPassword } = require("@controllers/authController");

const router = express.Router();

// 🔐 Authentication Routes
router.post("/register", register);
router.post("/login", login);

// 🔁 Password Recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
