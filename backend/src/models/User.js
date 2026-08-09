const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: [true, "Password is required"],
        },

        role: {
          type: String,
          enum: ["Admin", "Worker"],
          required: [true, "Role is required"],
        },

        // Worker phone number
        phone: {
            type: String,
            default: "",
        },

        // Current GPS location of worker
        currentLocation: {
            latitude: {
                type: Number,
                default: null,
            },
            longitude: {
                type: Number,
                default: null,
            },
        },

        // Worker status
        availability: {
            type: String,
            enum: ["Available", "Busy"],
            default: "Available",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);