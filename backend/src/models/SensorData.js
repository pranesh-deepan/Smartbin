const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema(
    {
        binId: {
            type: String,
            required: true,
            trim: true,
        },

        fillLevel: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },

        gasLevel: {
            type: Number,
            default: 0,
            min: 0,
        },

        temperature: {
            type: Number,
            default: 0,
        },

        batteryLevel: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("SensorData", sensorDataSchema);