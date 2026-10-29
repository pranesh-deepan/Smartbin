
const express = require("express");
const router = express.Router();

const {
  assignDevice,
  getDeviceMappings,
} = require("../controllers/deviceMappingController");

const { protect } = require("../middleware/authMiddleware");

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

router.get("/", protect, adminOnly, getDeviceMappings);
router.post("/", protect, adminOnly, assignDevice);

module.exports = router;
