const Job = require("../models/Job");
const Bin = require("../models/Bin");
const User = require("../models/User");
const { calculateDistance } = require("../utils/distanceCalculator");

const {
    notifyAdmins,
    notifyWorker,
} = require("./notificationController");


// ============================================================
// NOTIFICATION HELPER
// ============================================================
// Notifications should never stop the actual job operation.
// If notification creation fails, the job operation will still
// continue successfully.
// ============================================================

const sendNotificationSafely = async (notificationFunction, data) => {
    try {
        await notificationFunction(data);
    } catch (error) {
        console.error("Notification error:", error);
    }
};


// ============================================================
// CREATE JOB
// ============================================================

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

        // ----------------------------------------------------
        // NOTIFY ADMINS
        // ----------------------------------------------------

        await sendNotificationSafely(notifyAdmins, {
            type: "JOB_CREATED",
            title: "New Collection Job",
            message: `A new garbage collection job has been created for ${bin.binId}.`,
            job: job._id,
        });

        return res.status(201).json({
            success: true,
            message: "Garbage collection job created successfully",
            job,
        });

    } catch (error) {
        console.error("Create job error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// ============================================================
// FIND NEARBY WORKERS
// ============================================================

const findNearbyWorkers = async (req, res) => {
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

            "currentLocation.latitude": {
                $ne: null,
            },

            "currentLocation.longitude": {
                $ne: null,
            },
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
        console.error("Find nearby workers error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// ============================================================
// AUTOMATICALLY ASSIGN NEAREST WORKER
// ============================================================

const automaticallyAssignNearestWorker = async (job) => {
    try {
        const rejectedWorkerIds = job.rejectedWorkers || [];

        // Find available workers
        const workers = await User.find({
            role: "Worker",

            isActive: true,

            availability: "Available",

            _id: {
                $nin: rejectedWorkerIds,
            },

            "currentLocation.latitude": {
                $ne: null,
            },

            "currentLocation.longitude": {
                $ne: null,
            },
        }).select(
            "_id name email availability currentLocation"
        );

        // No workers available
        if (workers.length === 0) {
            job.worker = null;
            job.status = "Pending";

            await job.save();

            return null;
        }

        // Calculate distance from bin to each worker
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

        // No worker with valid GPS
        if (nearestWorkers.length === 0) {
            job.worker = null;
            job.status = "Pending";

            await job.save();

            return null;
        }

        // Get nearest worker
        const nearestWorker = nearestWorkers[0].worker;

        // Assign worker
        job.worker = nearestWorker._id;
        job.status = "Assigned";

        await job.save();

        console.log(
            `Job ${job._id} automatically assigned to nearest Worker ${nearestWorker.name}`
        );

        // ----------------------------------------------------
        // NOTIFY ASSIGNED WORKER
        // ----------------------------------------------------

        await sendNotificationSafely(notifyWorker, {
            workerId: nearestWorker._id,

            type: "JOB_ASSIGNED",

            title: "New Job Available",

            message:
                "A new garbage collection job has been assigned to you. Please accept or decline the job.",

            job: job._id,
        });

        return nearestWorker;

    } catch (error) {
        console.error(
            "Automatic Worker assignment error:",
            error
        );

        throw error;
    }
};

// ============================================================
// AUTOMATICALLY CREATE JOB FOR HIGH FILL BIN
// ============================================================

const createAutomaticJobForBin = async (bin) => {
    try {
        // ----------------------------------------------------
        // CHECK BIN
        // ----------------------------------------------------

        if (!bin) {
            console.log("Automatic job creation skipped: Bin not found");
            return null;
        }

        // Only active bins should generate collection jobs
        if (bin.status !== "Active") {
            console.log(
                `Automatic job creation skipped: ${bin.binId} is ${bin.status}`
            );
            return null;
        }

        // ----------------------------------------------------
        // CHECK FILL LEVEL
        // ----------------------------------------------------

        const fillLevel = Number(bin.fillLevel) || 0;

        if (fillLevel < 90) {
            return null;
        }

        // ----------------------------------------------------
        // CHECK EXISTING ACTIVE JOB
        // ----------------------------------------------------

        const existingJob = await Job.findOne({
            bin: bin._id,
            status: {
                $in: ["Pending", "Assigned", "Accepted"],
            },
        });

        if (existingJob) {
            console.log(
                `Active job already exists for ${bin.binId}. No new job created.`
            );

            return existingJob;
        }

        // ----------------------------------------------------
        // CREATE NEW JOB
        // ----------------------------------------------------

        const job = await Job.create({
            bin: bin._id,

            binLocation: {
                latitude: bin.latitude,
                longitude: bin.longitude,
            },

            fillLevel: fillLevel,

            status: "Pending",
        });

        console.log(
            `🚨 Automatic job created for ${bin.binId} at ${fillLevel}% fill level`
        );

        // ----------------------------------------------------
        // NOTIFY ADMINS
        // ----------------------------------------------------

        await sendNotificationSafely(notifyAdmins, {
            type: "JOB_CREATED",

            title: "New Collection Job",

            message:
                `Bin ${bin.binId} has reached ${fillLevel}% capacity. ` +
                "A garbage collection job has been created automatically.",

            job: job._id,
        });

        // ----------------------------------------------------
        // AUTOMATICALLY ASSIGN NEAREST WORKER
        // ----------------------------------------------------

        const assignedWorker =
            await automaticallyAssignNearestWorker(job);

        if (assignedWorker) {
            console.log(
                `✅ ${bin.binId} job assigned to Worker ${assignedWorker.name}`
            );
        } else {
            console.log(
                `⚠️ No available Worker found for ${bin.binId}. Job remains Pending.`
            );
        }

        return job;

    } catch (error) {
        console.error(
            `Automatic job creation error for bin ${bin?.binId}:`,
            error
        );

        return null;
    }
};

// ============================================================
// AUTO ASSIGN WORKER API
// ============================================================

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

        // Only Pending jobs can be assigned
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
        console.error("Auto assign worker error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// ============================================================
// MANUALLY ASSIGN WORKER
// ============================================================

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

        // ----------------------------------------------------
        // NOTIFY WORKER
        // ----------------------------------------------------

        await sendNotificationSafely(notifyWorker, {
            workerId: worker._id,

            type: "JOB_ASSIGNED",

            title: "New Job Available",

            message:
                "A new garbage collection job has been assigned to you. Please accept or decline the job.",

            job: job._id,
        });

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
        console.error("Assign worker error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// ============================================================
// ACCEPT JOB
// ============================================================

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

        // ----------------------------------------------------
        // NOTIFY ADMINS
        // ----------------------------------------------------

        await sendNotificationSafely(notifyAdmins, {
            type: "JOB_ACCEPTED",

            title: "Job Accepted",

            message:
                `Worker ${worker.name} has accepted the garbage collection job.`,

            job: job._id,
        });

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
        console.error("Accept job error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// ============================================================
// REJECT JOB
// ============================================================

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

        // Get current worker before removing assignment
        const rejectingWorker = await User.findById(workerId);

        // ----------------------------------------------------
        // ADD WORKER TO REJECTED LIST
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // NOTIFY ADMINS ABOUT REJECTION
        // ----------------------------------------------------

        await sendNotificationSafely(notifyAdmins, {
            type: "JOB_REJECTED",

            title: "Job Rejected",

            message:
                `Worker ${rejectingWorker?.name || "Worker"} has rejected a garbage collection job.`,

            job: job._id,
        });

        // ----------------------------------------------------
        // AUTOMATICALLY FIND NEXT WORKER
        // ----------------------------------------------------

        const nextWorker =
            await automaticallyAssignNearestWorker(job);

        // No next worker
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

        // ----------------------------------------------------
        // NOTIFY NEXT WORKER
        // automaticallyAssignNearestWorker() already sends
        // JOB_ASSIGNED notification.
        // ----------------------------------------------------

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
        console.error("Reject job error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// ============================================================
// COMPLETE JOB
// ============================================================

const completeJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        // ----------------------------------------------------
        // FIND JOB
        // ----------------------------------------------------

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        // ----------------------------------------------------
        // VERIFY WORKER
        // ----------------------------------------------------

        if (
            !job.worker ||
            job.worker.toString() !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this job",
            });
        }

        // ----------------------------------------------------
        // JOB MUST BE ACCEPTED
        // ----------------------------------------------------

        if (job.status !== "Accepted") {
            return res.status(400).json({
                success: false,
                message:
                    "Only Accepted jobs can be completed",
            });
        }

        // ----------------------------------------------------
        // FIND CURRENT BIN
        // ----------------------------------------------------

        const bin = await Bin.findById(job.bin);

        if (!bin) {
            return res.status(404).json({
                success: false,
                message: "Bin not found",
            });
        }

        // ----------------------------------------------------
        // BIN MUST BE EMPTY
        // ----------------------------------------------------

        const currentFillLevel =
            Number(bin.fillLevel) || 0;

        if (currentFillLevel > 0) {
            return res.status(400).json({
                success: false,

                message:
                    "Job can only be completed when the bin fill level reaches 0%",

                fillLevel: currentFillLevel,
            });
        }

        // ----------------------------------------------------
        // FIND WORKER
        // ----------------------------------------------------

        const worker =
            await User.findById(req.user.id);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        // ----------------------------------------------------
        // COMPLETE JOB
        // ----------------------------------------------------

        job.status = "Completed";

        job.completedAt = new Date();

        // Keep job fill level synchronized
        job.fillLevel = 0;

        // ----------------------------------------------------
        // WORKER BECOMES AVAILABLE
        // ----------------------------------------------------

        worker.availability = "Available";

        await job.save();

        await worker.save();

        // ----------------------------------------------------
        // NOTIFY ADMINS
        // ----------------------------------------------------

        await sendNotificationSafely(notifyAdmins, {
            type: "JOB_COMPLETED",

            title: "Job Completed",

            message:
                `Worker ${worker.name} has completed a garbage collection job.`,

            job: job._id,
        });

        // ----------------------------------------------------
        // NOTIFY WORKER
        // ----------------------------------------------------

        await sendNotificationSafely(notifyWorker, {
            workerId: worker._id,

            type: "JOB_COMPLETED",

            title: "Collection Completed",

            message:
                "The garbage collection job has been successfully completed.",

            job: job._id,
        });

        return res.status(200).json({
            success: true,

            message:
                "Garbage collection completed successfully",

            job: {
                id: job._id,
                bin: job.bin,
                worker: job.worker,
                status: job.status,
                acceptedAt: job.acceptedAt,
                completedAt: job.completedAt,
                fillLevel: job.fillLevel,
            },

            worker: {
                id: worker._id,
                name: worker.name,
                availability:
                    worker.availability,
            },
        });

    } catch (error) {
        console.error(
            "Complete job error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// ============================================================
// GET JOB BY ID
// ============================================================

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
        console.error("Get job by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// ============================================================
// GET ALL JOBS
// ============================================================

const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find()

            .populate("bin")

            .populate("worker")

            .sort({
                createdAt: -1,
            });

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });

    } catch (error) {
        console.error(
            "Get all jobs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// ============================================================
// GET MY JOBS - WORKER
// ============================================================

const getMyJobs = async (req, res) => {
    try {
        const workerId = req.user.id;

        const jobs = await Job.find({
            worker: workerId,
        })

            .populate("bin")

            .sort({
                createdAt: -1,
            });

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });

    } catch (error) {
        console.error(
            "Get worker jobs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


module.exports = {
    createJob,
    findNearbyWorkers,
    automaticallyAssignNearestWorker,
    autoAssignWorker,
    assignWorker,
    acceptJob,
    rejectJob,
    completeJob,
    getJobById,
    getAllJobs,
    getMyJobs,
    createAutomaticJobForBin,
};