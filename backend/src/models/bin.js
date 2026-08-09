const mongoose = require("mongoose");

const binSchema = new mongoose.Schema(
    {
        binId: {
            type: String,
            required: [true, "Bin ID is required"],
            unique: true,
            trim: true,
        },

        name: {
            type: String,
            required: [true, "Bin name is required"],
            trim: true,
        },

        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true,
        },

        latitude: {
            type: Number,
            required: [true, "Latitude is required"],
        },

        longitude: {
            type: Number,
            required: [true, "Longitude is required"],
        },

        status: {
            type: String,
            enum: ["Active", "Inactive", "Maintenance"],
            default: "Active",
        },

        fillLevel: {
            type: Number,
            default: 0,
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

        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Bin", binSchema);