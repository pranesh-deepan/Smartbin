const express = require("express");

const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Register User
router.post("/register", register);

// Login User
router.post("/login", login);

// Get Current User
router.get("/me", protect, getMe);

// Admin Only Test Route
router.get("/admin-test", protect, authorize("Admin"), (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin access granted",
        user: req.user,
    });
});

module.exports = router;