const express = require("express");
const { getAllUsers, getUserById , getUserByProfileId } = require("@controllers/userController");
const { authenticate } = require("@middlewares/authMiddleware");


const router = express.Router();


router.get("/get-all-users", authenticate, getAllUsers);  
router.get("/:userId",authenticate, getUserById);

/**
 * ✅ Route to fetch a user by `profileId`
 */
router.get("/profile/:profileId",authenticate, getUserByProfileId);

module.exports = router;
