import React, {
    useEffect,
    useState,
} from "react";

import "./NotificationBell.css";

const API_BASE_URL =
    "http://localhost:5000/api";

const NotificationBell = () => {

    const [
        notifications,
        setNotifications,
    ] = useState([]);

    const [
        unreadCount,
        setUnreadCount,
    ] = useState(0);

    const [
        open,
        setOpen,
    ] = useState(false);


    // =====================================================
    // FETCH NOTIFICATIONS
    // =====================================================

    const fetchNotifications = async () => {

        try {

            const token =
                localStorage.getItem(
                    "smartbin_token"
                );

            if (!token) {

                console.warn(
                    "Notification: token not found"
                );

                return;

            }


            const response =
                await fetch(
                    `${API_BASE_URL}/notifications`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                console.error(
                    "Notification API error:",
                    data.message
                );

                return;

            }


            if (data.success) {

                setNotifications(
                    data.notifications || []
                );

                setUnreadCount(
                    data.unreadCount || 0
                );

            }

        } catch (error) {

            console.error(
                "Notification fetch error:",
                error
            );

        }

    };


    // =====================================================
    // POLLING
    // =====================================================

    useEffect(() => {

        fetchNotifications();


        const interval =
            setInterval(
                fetchNotifications,
                3000
            );


        return () => {

            clearInterval(interval);

        };

    }, []);


    // =====================================================
    // MARK ONE READ
    // =====================================================

    const markAsRead = async (
        notificationId
    ) => {

        try {

            const token =
                localStorage.getItem(
                    "smartbin_token"
                );


            await fetch(
                `${API_BASE_URL}/notifications/${notificationId}/read`,
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            await fetchNotifications();

        } catch (error) {

            console.error(
                "Mark notification error:",
                error
            );

        }

    };


    // =====================================================
    // MARK ALL READ
    // =====================================================

    const markAllRead = async () => {

        try {

            const token =
                localStorage.getItem(
                    "smartbin_token"
                );


            await fetch(
                `${API_BASE_URL}/notifications/read-all`,
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            await fetchNotifications();

        } catch (error) {

            console.error(
                "Mark all notifications error:",
                error
            );

        }

    };


    // =====================================================
    // ICON
    // =====================================================

    const getIcon = (type) => {

        switch (type) {

            case "JOB_CREATED":
                return "📋";

            case "JOB_ASSIGNED":
                return "🚚";

            case "JOB_ACCEPTED":
                return "✓";

            case "JOB_REJECTED":
                return "↩";

            case "JOB_REASSIGNED":
                return "🔄";

            case "JOB_COMPLETED":
                return "✅";

            case "IMPORTANT":
                return "⚠️";

            default:
                return "🔔";

        }

    };


    // =====================================================
    // ACCEPT JOB
    // =====================================================

    const acceptJob = async (
        event,
        notification
    ) => {

        event.stopPropagation();

        const token =
            localStorage.getItem(
                "smartbin_token"
            );


        if (!notification.job?._id) {

            alert(
                "Job information is missing."
            );

            return;

        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/jobs/${notification.job._id}/accept`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },
                    }
                );


            const data =
                await response.json();


            if (
                response.ok &&
                data.success
            ) {

                await markAsRead(
                    notification._id
                );

            } else {

                alert(
                    data.message ||
                    "Unable to accept job."
                );

            }

        } catch (error) {

            console.error(error);

            alert(
                "Unable to connect to server."
            );

        }

    };


    // =====================================================
    // REJECT JOB
    // =====================================================

    const rejectJob = async (
        event,
        notification
    ) => {

        event.stopPropagation();

        const token =
            localStorage.getItem(
                "smartbin_token"
            );


        if (!notification.job?._id) {

            alert(
                "Job information is missing."
            );

            return;

        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/jobs/${notification.job._id}/reject`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },
                    }
                );


            const data =
                await response.json();


            if (
                response.ok &&
                data.success
            ) {

                await markAsRead(
                    notification._id
                );

            } else {

                alert(
                    data.message ||
                    "Unable to reject job."
                );

            }

        } catch (error) {

            console.error(error);

            alert(
                "Unable to connect to server."
            );

        }

    };


    return (

        <div className="notification-container">

            <button
                type="button"
                className="notification-bell"
                onClick={() =>
                    setOpen(
                        previous =>
                            !previous
                    )
                }
            >

                🔔

                {unreadCount > 0 && (

                    <span className="notification-badge">

                        {
                            unreadCount > 99
                                ? "99+"
                                : unreadCount
                        }

                    </span>

                )}

            </button>


            {open && (

                <div className="notification-panel">

                    <div className="notification-header">

                        <div>

                            <h3>
                                Notifications
                            </h3>

                            <span>
                                {unreadCount} unread
                            </span>

                        </div>


                        {unreadCount > 0 && (

                            <button
                                type="button"
                                onClick={
                                    markAllRead
                                }
                            >
                                Mark all read
                            </button>

                        )}

                    </div>


                    <div className="notification-list">

                        {notifications.length === 0 ? (

                            <div className="notification-empty">

                                <span>
                                    🔔
                                </span>

                                <strong>
                                    No notifications
                                </strong>

                                <p>
                                    You're all caught up.
                                </p>

                            </div>

                        ) : (

                            notifications.map(
                                notification => (

                                    <div
                                        key={
                                            notification._id
                                        }

                                        className={
                                            `notification-item ${
                                                notification.isRead
                                                    ? "read"
                                                    : "unread"
                                            }`
                                        }

                                        onClick={() => {

                                            if (
                                                !notification.isRead
                                            ) {

                                                markAsRead(
                                                    notification._id
                                                );

                                            }

                                        }}
                                    >

                                        <div className="notification-icon">

                                            {
                                                getIcon(
                                                    notification.type
                                                )
                                            }

                                        </div>


                                        <div className="notification-content">

                                            <strong>
                                                {
                                                    notification.title
                                                }
                                            </strong>

                                            <p>
                                                {
                                                    notification.message
                                                }
                                            </p>

                                            <small>
                                                {
                                                    new Date(
                                                        notification.createdAt
                                                    ).toLocaleString()
                                                }
                                            </small>


                                            {
                                                notification.type ===
                                                    "JOB_ASSIGNED" &&
                                                !notification.isRead && (

                                                    <div className="notification-job-actions">

                                                        <button
                                                            type="button"
                                                            className="notification-accept"
                                                            onClick={
                                                                event =>
                                                                    acceptJob(
                                                                        event,
                                                                        notification
                                                                    )
                                                            }
                                                        >
                                                            ✓ Accept
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="notification-reject"
                                                            onClick={
                                                                event =>
                                                                    rejectJob(
                                                                        event,
                                                                        notification
                                                                    )
                                                            }
                                                        >
                                                            ✕ Decline
                                                        </button>

                                                    </div>

                                                )
                                            }

                                        </div>


                                        {!notification.isRead && (

                                            <span className="notification-dot" />

                                        )}

                                    </div>

                                )
                            )

                        )}

                    </div>

                </div>

            )}

        </div>

    );

};

export default NotificationBell;