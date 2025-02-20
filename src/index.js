require("module-alias/register");
const express = require("express");
const cors = require("cors");
const { PORT } = require("@config/config");
const authRoutes = require("@/routes/authRoutes");

const app = express();

// ✅ Enable CORS for all origins (*)
app.use(cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true
}));

app.use(express.json());

// ✅ Use Auth Routes
app.use("/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
