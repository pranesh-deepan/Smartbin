const express = require("express");
const cors = require("cors");
const binRoutes = require("./routes/binRoutes");
const authRoutes = require("./routes/authRoutes");
const sensorDataRoutes = require("./routes/sensorDataRoutes");
const jobRoutes = require("./routes/jobRoutes");
const workerRoutes = require("./routes/workerRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bins", binRoutes);
app.use("/api/sensor-data", sensorDataRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/workers", workerRoutes);

// Test Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to SmartBin-W API 🚀"
    });
});

module.exports = app;