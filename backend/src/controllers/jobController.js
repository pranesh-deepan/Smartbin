const Job = require("../models/Job");
const Bin = require("../models/Bin");
const User = require("../models/User");
const { calculateDistance } = require("../utils/distanceCalculator");

const createJob = async (req, res) => {
    try {
        const { binId } = req.body;

        // Validate Bin ID
        if (!binId) {
            return res.status(400).json({
                success: false,
                message: "Bin ID is required",
            });
        }

        // Find Bin
        const bin = await Bin.findOne({ binId });

        if (!bin) {
            return res.status(404).json({
                success: false,
                message: "Bin not found",
            });
        }

        // Check for existing active job
        const existingJob = await Job.findOne({
            bin: bin._id,
            status: {
                $in: ["Pending", "Assigned", "Accepted"],
            },
        });

        if (existingJob) {
            return res.status(400).json({
                success: false,
                message: "An active job already exists for this bin",
            });
        }

        // Create Job
        const job = await Job.create({
            bin: bin._id,
            binLocation: {
                latitude: bin.latitude,
                longitude: bin.longitude,
            },
            fillLevel: bin.fillLevel,
            status: "Pending",
        });

        return res.status(201).json({
            success: true,
            message: "Garbage collection job created successfully",
            job,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const findNearbyWorkers = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Find the job
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        // Only Pending jobs should search for Workers
        if (job.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Workers can only be searched for Pending jobs",
            });
        }

        // Find available Workers with location
        const workers = await User.find({
            role: "Worker",
            isActive: true,
            availability: "Available",
            "currentLocation.latitude": { $ne: null },
            "currentLocation.longitude": { $ne: null },
        }).select("-password");

        const nearbyWorkers = workers
            .filter((worker) => {
                return (
                    worker.currentLocation &&
                    typeof worker.currentLocation.latitude === "number" &&
                    typeof worker.currentLocation.longitude === "number"
                );
            })
            .map((worker) => {
                const distance = calculateDistance(
                    job.binLocation.latitude,
                    job.binLocation.longitude,
                    worker.currentLocation.latitude,
                    worker.currentLocation.longitude
                );

                return {
                    id: worker._id,
                    name: worker.name,
                    email: worker.email,
                    latitude: worker.currentLocation.latitude,
                    longitude: worker.currentLocation.longitude,
                    distance: Number(distance.toFixed(2)),
                };
            })
            .sort((a, b) => a.distance - b.distance);

        return res.status(200).json({
            success: true,
            message: "Nearby available Workers found successfully",
            jobId: job._id,
            binLocation: job.binLocation,
            workers: nearbyWorkers,
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
    createJob,findNearbyWorkers,
};