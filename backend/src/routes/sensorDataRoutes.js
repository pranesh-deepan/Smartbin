const express = require("express");

const router = express.Router();

const {
    createSensorData,
} = require("../controllers/sensorDataController");

const {
    protect,
} = require("../middleware/authMiddleware");

// Receive sensor data
router.post(
    "/",
    protect,
    createSensorData
);

module.exports = router;