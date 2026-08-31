const express = require("express");

const router = express.Router();

const { register, login, getMe, updateLocation, updateAvailability, getWorkerLocation, updateProfile, changePassword} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Register User
router.post(
    "/register",
    protect,
    authorize("Admin"),
    register
);

// Login User
router.post("/login", login);

// Get Current User
router.get("/me", protect, getMe);

// Update Current User Profile

router.put(
    "/profile",
    protect,
    updateProfile
);


// Change Current User Password

router.put(
    "/change-password",
    protect,
    changePassword
);

// Update Current Worker Location
router.put(
    "/location",
    protect,
    updateLocation
);


// Admin Only Test Route
router.get(
    "/admin-test",
    protect,
    authorize("Admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome Admin! Admin access granted",
        });
    }
);

// Worker Only Test Route
router.get(
    "/worker-test",
    protect,
    authorize("Worker"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome Worker! Worker access granted",
            user: req.user,
        });
    }
);

// Update Worker Availability
router.put(
    "/availability",
    protect,
    authorize("Worker"),
    updateAvailability
);
// Admin Only - Get Worker GPS Location

router.get(
    "/worker/:workerId/location",
    protect,
    authorize("Admin"),
    getWorkerLocation
);

module.exports = router;