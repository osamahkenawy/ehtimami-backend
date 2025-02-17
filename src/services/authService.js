const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = require("../config");

// Hash password

const hashPassword = async (password) => {
    console.log("🔍 Debug Password:", password);

    if (typeof password !== "string") {
        throw new Error("Password must be a string");
    }

    const salt = await bcrypt.genSalt(10); // Generate salt properly
    return await bcrypt.hash(password, salt);
};

module.exports = {
    hashPassword
};

// Compare password
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, roles: user.roles.map(r => r.role.name) },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
};
