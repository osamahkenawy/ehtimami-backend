const express = require("express");
const { PORT } = require("./config");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());

// Use Auth Routes
app.use("/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
