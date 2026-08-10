const express = require("express");

const router = express.Router();

const { createJob, findNearbyWorkers, } = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Create Garbage Collection Job - Admin Only
router.post(
    "/",
    protect,
    authorize("Admin"),
    createJob
);

// Find Nearby Available Workers - Admin Only
router.get(
    "/:jobId/nearby-workers",
    protect,
    authorize("Admin"),
    findNearbyWorkers
);

module.exports = router;