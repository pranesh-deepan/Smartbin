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


const automaticallyAssignNearestWorker = async (job) => {
    try {
        const rejectedWorkerIds = job.rejectedWorkers || [];

        const workers = await User.find({
            role: "Worker",
            isActive: true,
            availability: "Available",
            _id: {
                $nin: rejectedWorkerIds,
            },
            "currentLocation.latitude": { $ne: null },
            "currentLocation.longitude": { $ne: null },
        }).select(
            "_id name email availability currentLocation"
        );

        if (workers.length === 0) {
            job.worker = null;
            job.status = "Pending";

            await job.save();

            return null;
        }

        const nearestWorkers = workers
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
                    worker,
                    distance,
                };
            })
            .sort((a, b) => a.distance - b.distance);

        if (nearestWorkers.length === 0) {
            job.worker = null;
            job.status = "Pending";

            await job.save();

            return null;
        }

        const nearestWorker = nearestWorkers[0].worker;

        job.worker = nearestWorker._id;
        job.status = "Assigned";

        await job.save();

        console.log(
            `Job ${job._id} automatically assigned to nearest Worker ${nearestWorker.name}`
        );

        return nearestWorker;

    } catch (error) {
        console.error(
            "Automatic Worker assignment error:",
            error
        );

        throw error;
    }
};

const autoAssignWorker = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        if (job.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    "Only Pending jobs can be automatically assigned",
            });
        }

        const worker =
            await automaticallyAssignNearestWorker(job);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message:
                    "No available Worker found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Nearest available Worker assigned automatically",
            job: {
                id: job._id,
                status: job.status,
                worker: job.worker,
            },
            worker: {
                id: worker._id,
                name: worker.name,
                email: worker.email,
                availability: worker.availability,
            },
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const assignWorker = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { workerId } = req.body;

        // Validate Worker ID
        if (!workerId) {
            return res.status(400).json({
                success: false,
                message: "Worker ID is required",
            });
        }

        // Find Job
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        // Job must be Pending
        if (job.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Only Pending jobs can be assigned",
            });
        }

        // Find Worker
        const worker = await User.findById(workerId);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        // Verify Worker role
        if (worker.role !== "Worker") {
            return res.status(400).json({
                success: false,
                message: "Selected user is not a Worker",
            });
        }

        // Verify Worker is active
        if (!worker.isActive) {
            return res.status(400).json({
                success: false,
                message: "Worker account is inactive",
            });
        }

        // Verify Worker is available
        if (worker.availability !== "Available") {
            return res.status(400).json({
                success: false,
                message: "Worker is not available",
            });
        }

        // Assign Worker
        job.worker = worker._id;
        job.status = "Assigned";

        await job.save();

        return res.status(200).json({
            success: true,
            message: "Worker assigned to job successfully",
            job: {
                id: job._id,
                bin: job.bin,
                worker: job.worker,
                status: job.status,
            },
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const acceptJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Find Job
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        // Make sure the logged-in Worker is assigned to this job
        if (!job.worker || job.worker.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this job",
            });
        }

        // Job must be Assigned
        if (job.status !== "Assigned") {
            return res.status(400).json({
                success: false,
                message: "Only Assigned jobs can be accepted",
            });
        }

        // Find Worker
        const worker = await User.findById(req.user.id);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        // Worker must be active
        if (!worker.isActive) {
            return res.status(403).json({
                success: false,
                message: "Worker account is inactive",
            });
        }

        // Accept Job
        job.status = "Accepted";
        job.acceptedAt = new Date();

        // Worker becomes Busy only after accepting
        worker.availability = "Busy";

        await job.save();
        await worker.save();

        return res.status(200).json({
            success: true,
            message: "Job accepted successfully",
            job: {
                id: job._id,
                bin: job.bin,
                worker: job.worker,
                status: job.status,
                acceptedAt: job.acceptedAt,
            },
            worker: {
                id: worker._id,
                name: worker.name,
                availability: worker.availability,
            },
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const rejectJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        // Make sure this Worker is currently assigned
        if (
            !job.worker ||
            job.worker.toString() !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this job",
            });
        }

        // Job must be Assigned
        if (job.status !== "Assigned") {
            return res.status(400).json({
                success: false,
                message: "Only Assigned jobs can be rejected",
            });
        }

        const workerId = req.user.id;

        // Add Worker to rejected list
        if (
            !job.rejectedWorkers.some(
                (id) => id.toString() === workerId
            )
        ) {
            job.rejectedWorkers.push(workerId);
        }

        // Remove current Worker
        job.worker = null;

        // Return job to Pending temporarily
        job.status = "Pending";

        await job.save();

        // Automatically find next nearest Worker
        const nextWorker =
            await automaticallyAssignNearestWorker(job);

        if (!nextWorker) {
            return res.status(200).json({
                success: true,
                message:
                    "Job rejected. No available Worker found. Job remains Pending.",
                job: {
                    id: job._id,
                    status: job.status,
                    worker: job.worker,
                },
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Job rejected. Assigned to the next nearest available Worker.",
            job: {
                id: job._id,
                status: job.status,
                worker: job.worker,
            },
            nextWorker: {
                id: nextWorker._id,
                name: nextWorker.name,
                email: nextWorker.email,
                availability: nextWorker.availability,
            },
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const completeJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Find Job
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        // Make sure the logged-in Worker is assigned to this job
        if (!job.worker || job.worker.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this job",
            });
        }

        // Job must be Accepted
        if (job.status !== "Accepted") {
            return res.status(400).json({
                success: false,
                message: "Only Accepted jobs can be completed",
            });
        }

        // Find Worker
        const worker = await User.findById(req.user.id);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        // Worker must be active
        if (!worker.isActive) {
            return res.status(403).json({
                success: false,
                message: "Worker account is inactive",
            });
        }

        // Complete Job
        job.status = "Completed";
        job.completedAt = new Date();

        // Worker becomes Available again
        worker.availability = "Available";

        await job.save();
        await worker.save();

        return res.status(200).json({
            success: true,
            message: "Garbage collection job completed successfully",
            job: {
                id: job._id,
                bin: job.bin,
                worker: job.worker,
                status: job.status,
                acceptedAt: job.acceptedAt,
                completedAt: job.completedAt,
            },
            worker: {
                id: worker._id,
                name: worker.name,
                availability: worker.availability,
            },
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId)
            .populate("bin")
            .populate(
                "worker",
                "name email phone role availability currentLocation"
            );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        return res.status(200).json({
            success: true,
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

const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate("bin")
            .populate("worker")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });

    } catch (error) {
        console.error("Get all jobs error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    createJob,findNearbyWorkers,automaticallyAssignNearestWorker,autoAssignWorker,assignWorker,acceptJob,rejectJob,completeJob,getJobById,getAllJobs,
};