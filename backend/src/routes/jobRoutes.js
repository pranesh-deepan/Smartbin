const express = require("express");

const router = express.Router();

const { createJob, findNearbyWorkers, autoAssignWorker, assignWorker, acceptJob, rejectJob, completeJob, getJobById, getAllJobs, getMyJobs } = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Create Garbage Collection Job - Admin Only
router.post(
    "/",
    protect,
    authorize("Admin"),
    createJob
);

// Get All Jobs - Admin Only

router.get(
    "/",
    protect,
    authorize("Admin"),
    getAllJobs
);

// Get Current Worker's Jobs - Worker Only
router.get(
    "/my-jobs",
    protect,
    authorize("Worker"),
    getMyJobs
);

// Get Job Details - Admin Only

router.get(
    "/:jobId",
    protect,
    authorize("Admin"),
    getJobById
);

// Find Nearby Available Workers - Admin Only
router.get(
    "/:jobId/nearby-workers",
    protect,
    authorize("Admin"),
    findNearbyWorkers
);
// Automatically Assign Nearest Available Worker to Job - Admin Only
router.put(
    "/:jobId/auto-assign",
    protect,
    authorize("Admin"),
    autoAssignWorker
);

// Assign Worker to Job - Admin Only
router.put(
    "/:jobId/assign",
    protect,
    authorize("Admin"),
    assignWorker
);

// Accept Assigned Job - Worker Only
router.put(
    "/:jobId/accept",
    protect,
    authorize("Worker"),
    acceptJob
);
//Reject Assigned Job - Worker Only
router.put(
    "/:jobId/reject",
    protect,
    authorize("Worker"),
    rejectJob
);

// Complete Accepted Job - Worker Only
router.put(
    "/:jobId/complete",
    protect,
    authorize("Worker"),
    completeJob
);

module.exports = router;