const express = require("express");

const router = express.Router();

const {
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} = require("../controllers/notificationController");

const {
    protect,
} = require("../middleware/authMiddleware");

// =====================================================
// GET MY NOTIFICATIONS
// =====================================================

router.get(
    "/",
    protect,
    getMyNotifications
);

// =====================================================
// MARK ALL AS READ
// IMPORTANT: KEEP THIS BEFORE /:notificationId/read
// =====================================================

router.put(
    "/read-all",
    protect,
    markAllNotificationsRead
);

// =====================================================
// MARK ONE AS READ
// =====================================================

router.put(
    "/:notificationId/read",
    protect,
    markNotificationRead
);

module.exports = router;