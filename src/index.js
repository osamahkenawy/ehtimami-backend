require("module-alias/register");
const express = require("express");
const { PORT } = require("@config/config");
const authRoutes = require("@/routes/authRoutes");


const app = express();
app.use(express.json());

// Use Auth Routes
app.use("/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
