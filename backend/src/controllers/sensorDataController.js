const Bin = require("../models/Bin");
const SensorData = require("../models/SensorData");
const {
    validateSensorData,
} = require("../validations/sensorDataValidation");

const createSensorData = async (req, res) => {
    try {
        // Validate sensor data
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

        // Check whether the bin exists
        const bin = await Bin.findOne({ binId });

        if (!bin) {
            return res.status(404).json({
                success: false,
                message: "Bin not found",
            });
        }

        // Store historical sensor reading
        const sensorData = await SensorData.create({
            binId,
            fillLevel,
            gasLevel,
            temperature,
            batteryLevel,
        });

        // Update current bin status
        bin.fillLevel = fillLevel;
        bin.gasLevel = gasLevel;
        bin.temperature = temperature;
        bin.batteryLevel = batteryLevel;
        bin.lastUpdated = new Date();

        await bin.save();

        // Check collection threshold
        const collectionRequired = fillLevel >= 90;

        return res.status(201).json({
            success: true,
            message: "Sensor data recorded successfully",
            collectionRequired,
            sensorData,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    createSensorData,
};