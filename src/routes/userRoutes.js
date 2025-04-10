const express = require("express");
const { getAllUsers, getUserById , getUserByProfileId, verifyUserById, updateUserProfile, getUsersByRole } = require("@controllers/userController");
const { authenticate } = require("@middlewares/authMiddleware");


const router = express.Router();


router.get("/get-all-users", authenticate, getAllUsers);  
router.get("/:userId",authenticate, getUserById);
router.patch("/verify/:userId",authenticate, verifyUserById);
router.put("/profile/:userId", authenticate , updateUserProfile);


/**
 * ✅ Route to fetch a user by `profileId`
 */

router.get("/profile/:profileId",authenticate, getUserByProfileId);
router.get("/role/:role", authenticate, getUsersByRole);

module.exports = router;
