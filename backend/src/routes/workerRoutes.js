const express = require("express");

const router = express.Router();

const {
    getAllWorkers,
    getWorkerById,
    updateWorkerStatus,
    deleteWorker,
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


// =====================================================
// DELETE WORKER
// Admin Only
// =====================================================

router.delete(
    "/:workerId",
    protect,
    authorize("Admin"),
    deleteWorker
);


module.exports = router;