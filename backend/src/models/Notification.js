const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        role: {
            type: String,
            enum: ["Admin", "Worker"],
            required: true,
        },

        type: {
            type: String,
            enum: [
                "JOB_CREATED",
                "JOB_ASSIGNED",
                "JOB_ACCEPTED",
                "JOB_REJECTED",
                "JOB_COMPLETED",
                "JOB_REASSIGNED",
                "SYSTEM",
                "IMPORTANT",
            ],
            default: "SYSTEM",
        },

        title: {
            type: String,
            required: true,
        },

        message: {
            type: String,
            required: true,
        },

        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            default: null,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);