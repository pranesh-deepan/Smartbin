
const express = require("express");
const router = express.Router();

const {
  createSensorData,
  createDeviceSensorData,
} = require("../controllers/sensorDataController");

const { protect } = require("../middleware/authMiddleware");
const { deviceAuth } = require("../middleware/deviceAuth");

router.post("/", protect, createSensorData);
router.post("/device", deviceAuth, createDeviceSensorData);

module.exports = router;
