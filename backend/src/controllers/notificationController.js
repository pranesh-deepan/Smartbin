const Notification = require("../models/Notification");
const User = require("../models/User");

// =====================================================
// GET MY NOTIFICATIONS
// =====================================================

const getMyNotifications = async (req, res) => {

    try {

        const notifications =
            await Notification.find({
                recipient: req.user.id,
            })
                .populate(
                    "job",
                    "status fillLevel binLocation bin"
                )
                .sort({
                    createdAt: -1,
                })
                .limit(100);

        const unreadCount =
            await Notification.countDocuments({
                recipient: req.user.id,
                isRead: false,
            });

        return res.status(200).json({

            success: true,

            unreadCount,

            notifications,

        });

    } catch (error) {

        console.error(
            "Get notifications error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Internal Server Error",

        });

    }

};


// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

const markNotificationRead = async (
    req,
    res
) => {

    try {

        const {
            notificationId,
        } = req.params;

        const notification =
            await Notification.findOne({
                _id: notificationId,
                recipient: req.user.id,
            });

        if (!notification) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification not found",

            });

        }

        notification.isRead = true;

        await notification.save();

        return res.status(200).json({

            success: true,

            message:
                "Notification marked as read",

        });

    } catch (error) {

        console.error(
            "Mark notification read error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Internal Server Error",

        });

    }

};


// =====================================================
// MARK ALL AS READ
// =====================================================

const markAllNotificationsRead = async (
    req,
    res
) => {

    try {

        await Notification.updateMany(
            {
                recipient: req.user.id,
                isRead: false,
            },
            {
                $set: {
                    isRead: true,
                },
            }
        );

        return res.status(200).json({

            success: true,

            message:
                "All notifications marked as read",

        });

    } catch (error) {

        console.error(
            "Mark all notifications read error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Internal Server Error",

        });

    }

};


// =====================================================
// CREATE NOTIFICATION
// =====================================================

const createNotification = async ({
    recipient,
    role,
    type,
    title,
    message,
    job = null,
}) => {

    try {

        return await Notification.create({

            recipient,

            role,

            type,

            title,

            message,

            job,

        });

    } catch (error) {

        console.error(
            "Create notification error:",
            error
        );

        return null;

    }

};


// =====================================================
// NOTIFY ALL ADMINS
// =====================================================

const notifyAdmins = async ({
    type,
    title,
    message,
    job = null,
}) => {

    try {

        const admins =
            await User.find({
                role: "Admin",
                isActive: true,
            }).select("_id");

        if (!admins.length) {

            return;

        }

        const notifications =
            admins.map((admin) => ({

                recipient: admin._id,

                role: "Admin",

                type,

                title,

                message,

                job,

            }));

        await Notification.insertMany(
            notifications
        );

    } catch (error) {

        console.error(
            "Notify admins error:",
            error
        );

    }

};


// =====================================================
// NOTIFY WORKER
// =====================================================

const notifyWorker = async ({
    workerId,
    type,
    title,
    message,
    job = null,
}) => {

    try {

        const worker =
            await User.findOne({
                _id: workerId,
                role: "Worker",
                isActive: true,
            });

        if (!worker) {

            return null;

        }

        return await createNotification({

            recipient:
                worker._id,

            role:
                "Worker",

            type,

            title,

            message,

            job,

        });

    } catch (error) {

        console.error(
            "Notify worker error:",
            error
        );

        return null;

    }

};


module.exports = {

    getMyNotifications,

    markNotificationRead,

    markAllNotificationsRead,

    createNotification,

    notifyAdmins,

    notifyWorker,

};