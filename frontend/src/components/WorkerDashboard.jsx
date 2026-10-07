import React, {
    useEffect,
    useRef,
    useState
} from "react";

import WorkerProfile from "./WorkerProfile";
import WorkerJobs from "./WorkerJobs";
import NotificationBell from "./NotificationBell";

const API_BASE_URL =
    "http://localhost:5000/api";

const WorkerDashboard = ({
    user,
    onLogout,
    onUserUpdated
}) => {

    // =====================================================
    // STATE
    // =====================================================

    const [workerSection, setWorkerSection] =
        useState("dashboard");

    const [location, setLocation] =
        useState(null);

    const [locationStatus, setLocationStatus] =
        useState("Requesting GPS permission...");

    const [lastUpdated, setLastUpdated] =
        useState(null);

    const [error, setError] =
        useState("");

    const [showWorkerProfile, setShowWorkerProfile] =
        useState(false);

    const locationIntervalRef =
        useRef(null);


    // =====================================================
    // TOKEN
    // =====================================================

    const getToken = () => {
        return localStorage.getItem(
            "smartbin_token"
        );
    };


    // =====================================================
    // SEND GPS LOCATION TO BACKEND
    // =====================================================

    const sendLocationToBackend = async (
        position
    ) => {

        const latitude =
            position.coords.latitude;

        const longitude =
            position.coords.longitude;

        const token = getToken();

        if (!token) {
            setError(
                "Authentication token not found."
            );
            return;
        }

        // Update frontend immediately
        setLocation({
            latitude,
            longitude
        });

        setLocationStatus(
            "GPS location active"
        );

        setError("");

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/auth/location`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body: JSON.stringify({
                            latitude,
                            longitude,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update location"
                );
            }

            setLastUpdated(
                new Date()
            );

        } catch (err) {

            console.error(
                "Location update error:",
                err
            );

            setLocationStatus(
                "GPS detected, backend update failed"
            );

            setError(
                err.message
            );
        }
    };


    // =====================================================
    // GPS ERROR
    // =====================================================

    const handleLocationError = (
        positionError
    ) => {

        console.error(
            "GPS Error:",
            positionError
        );

        switch (
            positionError.code
        ) {

            case positionError.PERMISSION_DENIED:

                setLocationStatus(
                    "GPS permission denied"
                );

                setError(
                    "Please allow location access in your browser settings."
                );

                break;


            case positionError.POSITION_UNAVAILABLE:

                setLocationStatus(
                    "GPS unavailable"
                );

                setError(
                    "Your current location could not be detected."
                );

                break;


            case positionError.TIMEOUT:

                setLocationStatus(
                    "GPS request timed out"
                );

                setError(
                    "Unable to get GPS location. Retrying..."
                );

                break;


            default:

                setLocationStatus(
                    "GPS error"
                );

                setError(
                    "Unable to retrieve your location."
                );
        }
    };


    // =====================================================
    // GET CURRENT LOCATION
    // =====================================================

    const updateWorkerLocation = () => {

        if (!navigator.geolocation) {

            setLocationStatus(
                "GPS not supported"
            );

            setError(
                "Geolocation is not supported by this browser."
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(
            sendLocationToBackend,
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };


    // =====================================================
    // GPS AUTO UPDATE
    // =====================================================

    useEffect(() => {

        // First update immediately
        updateWorkerLocation();

        // Update every 5 seconds
        locationIntervalRef.current =
            setInterval(() => {
                updateWorkerLocation();
            }, 5000);

        // Cleanup
        return () => {

            if (
                locationIntervalRef.current
            ) {

                clearInterval(
                    locationIntervalRef.current
                );
            }
        };

    }, []);


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {

        if (
            locationIntervalRef.current
        ) {

            clearInterval(
                locationIntervalRef.current
            );
        }

        if (onLogout) {

            onLogout();

        } else {

            localStorage.removeItem(
                "smartbin_token"
            );

            localStorage.removeItem(
                "smartbin_user"
            );

            window.location.reload();
        }
    };


    // =====================================================
    // PROFILE UPDATED
    // =====================================================

    const handleProfileUpdated = (
        updatedWorker
    ) => {

        if (
            onUserUpdated &&
            updatedWorker
        ) {

            onUserUpdated(
                updatedWorker
            );
        }
    };


    // =====================================================
    // PAGE TITLE
    // =====================================================

    const getPageTitle = () => {

        if (
            workerSection ===
            "dashboard"
        ) {
            return "Dashboard";
        }

        if (
            workerSection ===
            "jobs"
        ) {
            return "My Jobs";
        }

        if (
            workerSection ===
            "location"
        ) {
            return "Live Location";
        }

        if (
            workerSection ===
            "history"
        ) {
            return "Job History";
        }

        return "Dashboard";
    };


    // =====================================================
    // PROFILE PAGE
    // =====================================================

    if (showWorkerProfile) {

        return (
            <div className="admin-layout">

                {/* SIDEBAR */}

                <aside className="admin-sidebar">

                    <div className="admin-brand">

                        <div className="brand-icon">
                            ♻
                        </div>

                        <div>

                            <h2>
                                SmartBin
                            </h2>

                            <span>
                                Worker Panel
                            </span>

                        </div>

                    </div>


                    <nav className="admin-nav">

                        {/* DASHBOARD */}

                        <button
                            className="admin-nav-item"
                            onClick={() => {

                                setShowWorkerProfile(
                                    false
                                );

                                setWorkerSection(
                                    "dashboard"
                                );
                            }}
                        >
                            📊 Dashboard
                        </button>


                        {/* MY JOBS */}

                        <button
                            className={`admin-nav-item ${
                                workerSection === "jobs"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() => {

                                setShowWorkerProfile(
                                    false
                                );

                                setWorkerSection(
                                    "jobs"
                                );
                            }}
                        >
                            <span>📋</span>
                            <span>My Jobs</span>
                        </button>


                        {/* LIVE LOCATION */}

                        <button
                            className="admin-nav-item"
                            onClick={() => {

                                setShowWorkerProfile(
                                    false
                                );

                                setWorkerSection(
                                    "location"
                                );
                            }}
                        >
                            📍 Live Location
                        </button>


                        {/* JOB HISTORY */}

                        <button
                            className="admin-nav-item"
                            onClick={() => {

                                setShowWorkerProfile(
                                    false
                                );

                                setWorkerSection(
                                    "history"
                                );
                            }}
                        >
                            🕘 Job History
                        </button>

                    </nav>


                    <button
                        className="admin-logout"
                        onClick={
                            handleLogout
                        }
                    >
                        🚪 Logout
                    </button>

                </aside>


                {/* MAIN */}

                <main className="admin-main">

                    <header className="admin-topbar">

    {/* LEFT SIDE */}

    <div>

        <h1>
            {getPageTitle()}
        </h1>

        <p>
            SmartBin Waste Management System
        </p>

    </div>


    {/* RIGHT SIDE */}

    <div
        className="worker-topbar-right"
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "18px"
        }}
    >
        {/* NOTIFICATION BELL */}

        <NotificationBell />


        {/* PROFILE */}

        <button
            type="button"
            className="admin-profile admin-profile-button"
            onClick={() =>
                setShowWorkerProfile(true)
            }
        >

            <div className="admin-avatar">
                👷
            </div>

            <div>

                <strong>
                    {user?.name || "Worker"}
                </strong>

                <span>
                    Worker
                </span>

            </div>

        </button>

    </div>

</header>

                    <section className="admin-content">

                        <WorkerProfile
                            onBack={() =>
                                setShowWorkerProfile(
                                    false
                                )
                            }

                            onProfileUpdated={
                                handleProfileUpdated
                            }
                        />

                    </section>

                </main>

            </div>
        );
    }


    // =====================================================
    // MAIN WORKER DASHBOARD
    // =====================================================

    return (

        <div className="admin-layout">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="admin-sidebar">

                {/* BRAND */}

                <div className="admin-brand">

                    <div className="brand-icon">
                        ♻
                    </div>

                    <div>

                        <h2>
                            SmartBin
                        </h2>

                        <span>
                            Worker Panel
                        </span>

                    </div>

                </div>


                {/* NAVIGATION */}

                <nav className="admin-nav">

                    {/* DASHBOARD */}

                    <button
                        className={
                            workerSection ===
                            "dashboard"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }

                        onClick={() =>
                            setWorkerSection(
                                "dashboard"
                            )
                        }
                    >
                        📊 Dashboard
                    </button>


                    {/* MY JOBS */}

                    <button
                        className={
                            workerSection ===
                            "jobs"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }

                        onClick={() =>
                            setWorkerSection(
                                "jobs"
                            )
                        }
                    >
                        📋 My Jobs
                    </button>


                    {/* LIVE LOCATION */}

                    <button
                        className={
                            workerSection ===
                            "location"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }

                        onClick={() =>
                            setWorkerSection(
                                "location"
                            )
                        }
                    >
                        📍 Live Location
                    </button>


                    {/* JOB HISTORY */}

                    <button
                        className={
                            workerSection ===
                            "history"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }

                        onClick={() =>
                            setWorkerSection(
                                "history"
                            )
                        }
                    >
                        🕘 Job History
                    </button>

                </nav>


                {/* LOGOUT */}

                <button
                    className="admin-logout"
                    onClick={
                        handleLogout
                    }
                >
                    🚪 Logout
                </button>

            </aside>


            {/* =================================================
                MAIN WORKER AREA
            ================================================= */}

            <main className="admin-main">

                {/* TOPBAR */}

                <header className="admin-topbar">

    <div>
        <h1>
            {getPageTitle()}
        </h1>

        <p>
            SmartBin Waste Management System
        </p>
    </div>


    <div
        className="worker-topbar-right"
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "18px"
        }}
    >

        <NotificationBell />


        <button
            type="button"
            className="admin-profile admin-profile-button"
            onClick={() =>
                setShowWorkerProfile(true)
            }
        >

            <div className="admin-avatar">
                👷
            </div>

            <div>

                <strong>
                    {user?.name || "Worker"}
                </strong>

                <span>
                    Worker
                </span>

            </div>

        </button>

    </div>

</header>


                {/* =================================================
                    DASHBOARD
                ================================================= */}

                {workerSection ===
                    "dashboard" && (

                    <section className="admin-content">

                        {/* PAGE HEADER */}

                        <div className="admin-page-header">

                            <div>

                                <h2>
                                    Worker Dashboard
                                </h2>

                                <p>
                                    Overview of your SmartBin
                                    collection activities.
                                </p>

                            </div>

                        </div>


                        {/* STATISTICS */}

                        <div className="dashboard-stats">

                            {/* Assigned Jobs */}

                            <div className="dashboard-stat-card">

                                <div className="dashboard-stat-icon jobs">
                                    📋
                                </div>

                                <div>

                                    <span>
                                        Assigned Jobs
                                    </span>

                                    <strong>
                                        0
                                    </strong>

                                </div>

                            </div>


                            {/* Completed Jobs */}

                            <div className="dashboard-stat-card">

                                <div className="dashboard-stat-icon normal">
                                    ✅
                                </div>

                                <div>

                                    <span>
                                        Completed Jobs
                                    </span>

                                    <strong>
                                        0
                                    </strong>

                                </div>

                            </div>


                            {/* GPS */}

                            <div className="dashboard-stat-card">

                                <div className="dashboard-stat-icon workers">
                                    📍
                                </div>

                                <div>

                                    <span>
                                        GPS Status
                                    </span>

                                    <strong>
                                        {
                                            location
                                                ? "Active"
                                                : "Waiting"
                                        }
                                    </strong>

                                </div>

                            </div>


                            {/* Availability */}

                            <div className="dashboard-stat-card">

                                <div className="dashboard-stat-icon total">
                                    👷
                                </div>

                                <div>

                                    <span>
                                        Availability
                                    </span>

                                    <strong>
                                        Available
                                    </strong>

                                </div>

                            </div>

                        </div>


                        {/* WELCOME / QUICK INFO */}

                        <div className="dashboard-summary-card">

                            <div className="dashboard-summary-header">

                                <div>

                                    <h3>
                                        Welcome,{" "}
                                        {
                                            user?.name ||
                                            "Worker"
                                        } 👋
                                    </h3>

                                    <p>
                                        Manage your assigned
                                        collection jobs and
                                        monitor your live location.
                                    </p>

                                </div>

                            </div>


                            <div className="dashboard-info-grid">

                                {/* JOBS */}

                                <div className="dashboard-info-card">

                                    <div className="dashboard-info-icon">
                                        📋
                                    </div>

                                    <div>

                                        <h3>
                                            My Jobs
                                        </h3>

                                        <p>
                                            View collection jobs
                                            assigned to you and
                                            update their status.
                                        </p>

                                        <button
                                            onClick={() =>
                                                setWorkerSection(
                                                    "jobs"
                                                )
                                            }
                                        >
                                            View Jobs →
                                        </button>

                                    </div>

                                </div>


                                {/* LOCATION */}

                                <div className="dashboard-info-card">

                                    <div className="dashboard-info-icon">
                                        📍
                                    </div>

                                    <div>

                                        <h3>
                                            Live Location
                                        </h3>

                                        <p>
                                            Your GPS location is
                                            automatically updated
                                            every 5 seconds.
                                        </p>

                                        <button
                                            onClick={() =>
                                                setWorkerSection(
                                                    "location"
                                                )
                                            }
                                        >
                                            View Location →
                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>
                )}


                {/* =================================================
                    MY JOBS
                ================================================= */}

                {workerSection ===
                    "jobs" && (

                    <section className="admin-content">

                        <WorkerJobs />

                    </section>
                )}


                {/* =================================================
                    LIVE LOCATION
                ================================================= */}

                {workerSection ===
                    "location" && (

                    <section className="admin-content">

                        <div className="admin-page-header">

                            <div>

                                <h2>
                                    Live Location
                                </h2>

                                <p>
                                    Your current GPS location
                                    is automatically synchronized
                                    with SmartBin.
                                </p>

                            </div>

                        </div>


                        {/* GPS CARD */}

                        <div className="dashboard-summary-card">

                            <div className="dashboard-summary-header">

                                <div>

                                    <h3>
                                        📍 GPS Location
                                    </h3>

                                    <p>
                                        Location updates every
                                        5 seconds.
                                    </p>

                                </div>


                                <div
                                    className={
                                        `gps-status ${
                                            location
                                                ? "gps-active"
                                                : "gps-inactive"
                                        }`
                                    }
                                >

                                    <span className="gps-status-dot"></span>

                                    {
                                        location
                                            ? "GPS Active"
                                            : "GPS Waiting"
                                    }

                                </div>

                            </div>


                            {location ? (

                                <div className="gps-details">

                                    <div className="gps-detail-item">

                                        <span>
                                            Latitude
                                        </span>

                                        <strong>
                                            {
                                                location.latitude.toFixed(
                                                    6
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div className="gps-detail-item">

                                        <span>
                                            Longitude
                                        </span>

                                        <strong>
                                            {
                                                location.longitude.toFixed(
                                                    6
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div className="gps-detail-item">

                                        <span>
                                            Last Backend Update
                                        </span>

                                        <strong>
                                            {
                                                lastUpdated
                                                    ? lastUpdated.toLocaleTimeString()
                                                    : "Updating..."
                                            }
                                        </strong>

                                    </div>

                                </div>

                            ) : (

                                <div className="empty-state large">

                                    <span>
                                        📡
                                    </span>

                                    <h3>
                                        Waiting for GPS location
                                    </h3>

                                    <p>
                                        Please allow location
                                        access when your browser
                                        asks for permission.
                                    </p>

                                </div>

                            )}


                            {/* STATUS */}

                            <div className="gps-message">

                                <strong>
                                    Status:
                                </strong>{" "}

                                {
                                    locationStatus
                                }

                            </div>


                            {/* ERROR */}

                            {error && (

                                <div className="gps-error">
                                    {error}
                                </div>

                            )}

                        </div>

                    </section>
                )}


                {/* =================================================
                    JOB HISTORY
                ================================================= */}

                {workerSection ===
                    "history" && (

                    <section className="admin-content">

                        <div className="admin-page-header">

                            <div>

                                <h2>
                                    Job History
                                </h2>

                                <p>
                                    View your completed
                                    collection jobs.
                                </p>

                            </div>

                        </div>


                        <div className="dashboard-summary-card">

                            <div className="dashboard-summary-header">

                                <div>

                                    <h3>
                                        🕘 Completed Jobs
                                    </h3>

                                    <p>
                                        Your completed collection
                                        history will appear here.
                                    </p>

                                </div>

                            </div>


                            <div className="empty-state large">

                                <span>
                                    🕘
                                </span>

                                <h3>
                                    No completed jobs
                                </h3>

                                <p>
                                    Completed collection jobs
                                    will appear here.
                                </p>

                            </div>

                        </div>

                    </section>
                )}

            </main>

        </div>
    );
};

export default WorkerDashboard;