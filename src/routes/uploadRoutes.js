const express = require("express");
const uploadFileController = require("@/controllers/uploadController");

const router = express.Router();

// ✅ Debugging Middleware
router.post("/upload", (req, res, next) => {
  next();
}, uploadFileController.uploadFile);

module.exports = router;
