const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("@config/config");

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized. Token required." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Store user data in request
        next();
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }

};

module.exports = { authenticate };
