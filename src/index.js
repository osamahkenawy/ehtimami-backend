require("module-alias/register");
const express = require("express");
const { PORT } = require("@config/config");
const authRoutes = require("@routes/authRoutes");
const schoolRoutes = require("@routes/schoolRoutes");

const app = express();
app.use(express.json());

// Use Auth Routes
app.use("/auth", authRoutes); // ✅ auth routes
app.use("/schools", schoolRoutes);  // ✅ school routes

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
