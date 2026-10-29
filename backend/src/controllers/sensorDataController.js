
const Bin = require("../models/bin");
const SensorData = require("../models/SensorData");
const DeviceMapping = require("../models/DeviceMapping");
const {
    validateSensorData,
} = require("../validations/sensorDataValidation");

// Existing endpoint: authenticated users submit sensor data.
const createSensorData = async (req, res) => {
    try {
        const { isValid, errors } = validateSensorData(req.body);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                errors,
            });
        }

        const {
            binId,
            fillLevel,
            gasLevel = 0,
            temperature = 0,
            batteryLevel = 100,
        } = req.body;

        const bin = await Bin.findOne({ binId });

        if (!bin) {
            return res.status(404).json({
                success: false,
                message: "Bin not found",
            });
        }

        const sensorData = await SensorData.create({
            binId,
            fillLevel,
            gasLevel,
            temperature,
            batteryLevel,
        });

        bin.fillLevel = fillLevel;
        bin.gasLevel = gasLevel;
        bin.temperature = temperature;
        bin.batteryLevel = batteryLevel;
        bin.lastUpdated = new Date();

        await bin.save();

        return res.status(201).json({
            success: true,
            message: "Sensor data recorded successfully",
            collectionRequired: fillLevel >= 90,
            sensorData,
        });
    } catch (error) {
        console.error("Create sensor data error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// New endpoint: ESP32 submits its device ID and fill percentage.
const createDeviceSensorData = async (req, res) => {
    try {
        const { deviceId, fillPercent } = req.body;

        if (
            typeof deviceId !== "string" ||
            !deviceId.trim() ||
            fillPercent === undefined ||
            fillPercent === null ||
            (typeof fillPercent !== "number" &&
                typeof fillPercent !== "string") ||
            String(fillPercent).trim() === "" ||
            !Number.isFinite(Number(fillPercent)) ||
            Number(fillPercent) < 0 ||
            Number(fillPercent) > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid deviceId and fillPercent (0-100) are required",
            });
        }

        const deviceMapping = await DeviceMapping.findOne({
            deviceId: deviceId.trim(),
        });

        if (!deviceMapping) {
            return res.status(404).json({
                success: false,
                message: "This device is not assigned to a bin",
            });
        }

        const bin = await Bin.findOne({
            binId: deviceMapping.binId,
        });

        if (!bin) {
            return res.status(404).json({
                success: false,
                message: "The assigned bin was not found",
            });
        }

        const fillLevel = Number(fillPercent);

        // Store only binId and fillLevel in SensorData.
        const sensorData = await SensorData.create({
            binId: bin.binId,
            fillLevel,
        });

        // Update the current bin reading for the dashboard.
        bin.fillLevel = fillLevel;
        bin.lastUpdated = new Date();

        await bin.save();

        return res.status(201).json({
            success: true,
            message: "Device sensor data recorded successfully",
            collectionRequired: fillLevel >= 90,
            sensorData,
        });
    } catch (error) {
        console.error("Device sensor data error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    createSensorData,
    createDeviceSensorData,
};
