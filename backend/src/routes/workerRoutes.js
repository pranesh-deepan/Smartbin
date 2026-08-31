const express = require("express");

const router = express.Router();

const {
    getAllWorkers,
    getWorkerById,
    updateWorkerStatus,
} = require("../controllers/workerController");

const {
    protect,
    authorize,
} = require("../middleware/authMiddleware");


// =====================================================
// GET ALL WORKERS
// Admin Only
// =====================================================

router.get(
    "/",
    protect,
    authorize("Admin"),
    getAllWorkers
);


// =====================================================
// GET SINGLE WORKER
// Admin Only
// =====================================================

router.get(
    "/:workerId",
    protect,
    authorize("Admin"),
    getWorkerById
);


// =====================================================
// UPDATE WORKER ACTIVE STATUS
// Admin Only
// =====================================================

router.put(
    "/:workerId/status",
    protect,
    authorize("Admin"),
    updateWorkerStatus
);


module.exports = router;