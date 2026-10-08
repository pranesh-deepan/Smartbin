const User = require("../models/User");
const Job = require("../models/Job");

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


// =====================================================
// DELETE WORKER - ADMIN ONLY
// =====================================================
// Soft delete:
// Worker remains in MongoDB so old job/history records
// are not broken. The worker is marked as inactive.
//
// A worker cannot be deleted while they have an active job.
// =====================================================

const deleteWorker = async (req, res) => {
    try {
        const workerId = req.params.workerId;

        // -------------------------------------------------
        // Find worker
        // -------------------------------------------------

        const worker = await User.findOne({
            _id: workerId,
            role: "Worker",
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        // -------------------------------------------------
        // Check active jobs
        // -------------------------------------------------

        const activeJob = await Job.findOne({
            worker: workerId,
            status: {
                $in: [
                    "Assigned",
                    "Accepted",
                    "in_progress",
                    "in progress",
                ],
            },
        });

        if (activeJob) {
            return res.status(409).json({
                success: false,
                message:
                    "This worker cannot be deleted because they have an active job. Complete or reassign the job first.",
                jobId: activeJob._id,
                jobStatus: activeJob.status,
            });
        }

        // -------------------------------------------------
        // Soft delete worker
        // -------------------------------------------------

        worker.isActive = false;

        // Make sure the deleted worker is not considered
        // available for automatic job assignment.
        if (worker.availability !== undefined) {
            worker.availability = "Available";
        }

        await worker.save();

        return res.status(200).json({
            success: true,
            message: "Worker deleted successfully",
            worker: {
                id: worker._id,
                name: worker.name,
                email: worker.email,
                isActive: worker.isActive,
            },
        });

    } catch (error) {
        console.error("Delete Worker Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getAllWorkers,
    getWorkerById,
    updateWorkerStatus,
    deleteWorker,
};