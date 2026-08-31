const User = require("../models/User");

// =====================================================
// GET ALL WORKERS - ADMIN ONLY
// =====================================================

const getAllWorkers = async (req, res) => {
    try {
        const workers = await User.find({ role: "Worker" })
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: workers.length,
            workers,
        });

    } catch (error) {
        console.error("Get Workers Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// =====================================================
// GET SINGLE WORKER - ADMIN ONLY
// =====================================================

const getWorkerById = async (req, res) => {
    try {
        const worker = await User.findOne({
            _id: req.params.workerId,
            role: "Worker",
        }).select("-password");

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        return res.status(200).json({
            success: true,
            worker,
        });

    } catch (error) {
        console.error("Get Worker Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// =====================================================
// UPDATE WORKER ACTIVE STATUS - ADMIN ONLY
// =====================================================

const updateWorkerStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false",
            });
        }

        const worker = await User.findOne({
            _id: req.params.workerId,
            role: "Worker",
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        worker.isActive = isActive;

        await worker.save();

        return res.status(200).json({
            success: true,
            message: `Worker ${
                isActive ? "activated" : "deactivated"
            } successfully`,
            worker: {
                id: worker._id,
                name: worker.name,
                email: worker.email,
                isActive: worker.isActive,
            },
        });

    } catch (error) {
        console.error("Update Worker Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


module.exports = {
    getAllWorkers,
    getWorkerById,
    updateWorkerStatus,
};