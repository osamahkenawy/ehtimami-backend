require("module-alias/register");
const express = require("express");
const { PORT } = require("@config/config");
const cors = require("cors");
const authRoutes = require("@routes/authRoutes");
const schoolRoutes = require("@routes/schoolRoutes");
const userRoutes = require("@routes/userRoutes");
const dashboardRoutes = require("@routes/dashboardRoutes");
const classRoutes = require("@routes/classRoutes");
const app = express();
app.use(express.json());
// ✅ Allow CORS for all routes
app.use(cors({
    origin: "*", // Change this to your frontend URL in production
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// Use Auth Routes
app.use("/auth", authRoutes); // ✅ auth routes
app.use("/schools", schoolRoutes);  // ✅ school routes
app.use("/users", userRoutes);  // ✅ user Routes
app.use("/dashboards",dashboardRoutes) // ✅ Dashboard Routes
app.use("/classes",classRoutes) // ✅ Class Routes

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
