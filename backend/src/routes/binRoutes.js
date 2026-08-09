const express = require("express");

const router = express.Router();

const { createBin, getAllBins, getBinById, updateBin, deleteBin} = require("../controllers/binController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

// Create Public Bin - Admin Only
router.post(
    "/",
    protect,
    authorize("Admin"),
    createBin
);

// Get All Public Bins
router.get(
    "/",
    protect,
    getAllBins
);

// Get Single Public Bin
router.get(
    "/:binId",
    protect,
    getBinById
);

// Update Public Bin - Admin Only
router.put(
    "/:binId",
    protect,
    authorize("Admin"),
    updateBin
);

// Delete Public Bin - Admin Only
router.delete(
    "/:binId",
    protect,
    authorize("Admin"),
    deleteBin
);

module.exports = router;