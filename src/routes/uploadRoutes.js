const express = require("express");
const upload = require("@/middlewares/uploadMiddleware");
const { uploadFile } = require("@/controllers/uploadController");

const router = express.Router();

router.post("/upload", (req, res, next) => {
    next();
  }, upload.single("file"), (req, res, next) => {
    next();
  }, uploadFile);
  
module.exports = router;
