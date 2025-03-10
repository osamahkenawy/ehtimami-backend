const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = require("@config/config");

// ✅ Hash password
const hashPassword = async (password) => {
    console.log("🔍 Debug Password:", password);

    if (typeof password !== "string") {
        throw new Error("Password must be a string");
    }

    const salt = await bcrypt.genSalt(10); // Generate salt properly
    return await bcrypt.hash(password, salt);
};

// ✅ Compare password
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// ✅ Generate JWT Token (Now Includes `profileId`)
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id, // ✅ User ID
            profileId: user.profile ? user.profile.id : null, // ✅ Profile ID (If exists)
            email: user.email,
            roles: user.roles.map(r => r.role.name),
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
};
