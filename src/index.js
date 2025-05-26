require("module-alias/register");
const express = require("express");
const { PORT } = require("@config/config");
const cors = require("cors");
const authRoutes = require("@routes/authRoutes");
const schoolRoutes = require("@routes/schoolRoutes");
const userRoutes = require("@routes/userRoutes");
const dashboardRoutes = require("@routes/dashboardRoutes");
const classRoutes = require("@routes/classRoutes");
const uploadRoutes = require("@routes/uploadRoutes");
const teacherRoutes = require("@routes/teacherRoutes");
const studentRoutes = require("@routes/studentRoutes");
const roleRoutes = require('@routes/roleRoutes');


const app = express();

// ✅ Increase request body size limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
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
app.use("/dashboards", dashboardRoutes);
app.use("/classes",classRoutes) // ✅ Class Routes
app.use("/api", uploadRoutes);
app.use("/teacher",teacherRoutes); // ✅ Teacher Routes
app.use("/student",studentRoutes); // ✅ Student Routes
app.use("/roles",roleRoutes); // ✅ Roles Routes


// 4️⃣ ✅ Global 404 handler — after all routes
app.use((req, res) => {
    res.status(404).json({ status: 404, message: "Route not found" });
  });
  
  // 5️⃣ ✅ Centralized error middleware — last in stack
  app.use((err, req, res, next) => {
    console.error("🔥 Error Handler:", err.stack);
    res.status(err.status || 500).json({
      status: err.status || 500,
      message: err.message || "Internal Server Error"
    });
  });
  
  
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
