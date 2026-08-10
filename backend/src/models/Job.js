const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        bin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bin",
            required: true,
        },

        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        binLocation: {
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
        },

        fillLevel: {
            type: Number,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Assigned",
                "Accepted",
                "Completed",
                "Cancelled",
            ],
            default: "Pending",
        },

        acceptedAt: {
            type: Date,
            default: null,
        },

        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Job", jobSchema);