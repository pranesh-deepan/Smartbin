import React, {
    useEffect,
    useRef,
    useState
} from "react";

import WorkerProfile from "./WorkerProfile";
import WorkerJobs from "./WorkerJobs";
import NotificationBell from "./NotificationBell";
import WorkerNavigation from "./WorkerNavigation";
import WorkerJobHistory from "./WorkerJobHistory";

const API_BASE_URL = "http://localhost:5000/api";

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

    // =====================================================
    // JOB STATE
    // =====================================================

    const [workerJobs, setWorkerJobs] =
        useState([]);

    const [jobsLoading, setJobsLoading] =
        useState(true);

    const [jobsError, setJobsError] =
        useState("");

    const locationIntervalRef =
        useRef(null);

    const jobsIntervalRef =
        useRef(null);


    // =====================================================
    // TOKEN
    // =====================================================

    const getToken = () => {
        return localStorage.getItem("smartbin_token");
    };


    // =====================================================
    // SEND GPS LOCATION TO BACKEND
    // =====================================================

    const sendLocationToBackend = async (position) => {

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
                            longitude
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
                maximumAge: 0
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
    // FETCH WORKER JOBS
    // =====================================================

    const fetchWorkerJobs = async () => {

        const token = getToken();

        if (!token) {

            setJobsError(
                "Authentication token not found."
            );

            setJobsLoading(false);

            return;
        }

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/jobs/my-jobs`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch worker jobs"
                );
            }

            const jobs =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.jobs)
                        ? data.jobs
                        : [];

            setWorkerJobs(jobs);

            setJobsError("");

        } catch (err) {

            console.error(
                "Worker jobs fetch error:",
                err
            );

            setJobsError(
                err.message ||
                "Unable to load jobs"
            );

        } finally {

            setJobsLoading(false);
        }
    };


    // =====================================================
    // JOB AUTO REFRESH
    // =====================================================

    useEffect(() => {

        // Initial fetch

        fetchWorkerJobs();

        // Refresh every 5 seconds

        jobsIntervalRef.current =
            setInterval(() => {

                fetchWorkerJobs();

            }, 5000);


        return () => {

            if (
                jobsIntervalRef.current
            ) {

                clearInterval(
                    jobsIntervalRef.current
                );
            }
        };

    }, []);


    // =====================================================
    // JOB STATISTICS
    // =====================================================

    const getJobStatus = (job) => {

        return String(
            job?.status || ""
        ).toLowerCase();
    };


    const assignedJobs =
        workerJobs.filter((job) => {

            const status =
                getJobStatus(job);

            return (
                status === "assigned" ||
                status === "accepted"
            );

        });


    const acceptedJobs =
        workerJobs.filter((job) => {

            return (
                getJobStatus(job) ===
                "accepted"
            );

        });


    const completedJobs =
        workerJobs.filter((job) => {

            return (
                getJobStatus(job) ===
                "completed"
            );

        });


    // =====================================================
    // CURRENT ASSIGNMENT
    // =====================================================

    const currentJob =
        acceptedJobs[0] ||
        workerJobs.find((job) =>
            getJobStatus(job) === "assigned"
        );


    const currentJobIsAccepted =
        currentJob &&
        getJobStatus(currentJob) === "accepted";


    // =====================================================
    // CURRENT BIN DETAILS
    // =====================================================

    const currentBin =
        currentJob?.bin || null;


    const currentBinId =
        currentBin?.binId ||
        currentJob?.binId ||
        currentJob?.binLocation?.binId ||
        "N/A";


    const currentBinName =
        currentBin?.name ||
        "SmartBin";


    const currentBinLocation =
        currentBin?.location ||
        currentJob?.binLocation?.location ||
        "Location unavailable";


    const currentFillLevel =
        currentJob?.fillLevel ??
        currentBin?.fillLevel ??
        currentJob?.binLocation?.fillLevel ??
        0;


    // =====================================================
    // WORKER AVAILABILITY
    // =====================================================

    const workerAvailability =
        user?.availability ||
        user?.status ||
        (
            acceptedJobs.length > 0
                ? "Busy"
                : "Available"
        );


    const normalizedAvailability =
        String(
            workerAvailability
        ).toLowerCase();


    const availabilityLabel =
        normalizedAvailability === "busy"
            ? "Busy"
            : "Available";


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

        if (
            jobsIntervalRef.current
        ) {

            clearInterval(
                jobsIntervalRef.current
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
            "navigation"
        ) {

            return "Navigation";
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
                            className={
                                `admin-nav-item ${
                                    workerSection === "jobs"
                                        ? "active"
                                        : ""
                                }`
                            }

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


                        {/* NAVIGATION */}

                        <button
                            className={
                                workerSection ===
                                "navigation"
                                    ? "admin-nav-item active"
                                    : "admin-nav-item"
                            }

                            onClick={() => {

                                setShowWorkerProfile(
                                    false
                                );

                                setWorkerSection(
                                    "navigation"
                                );

                            }}
                        >
                            🧭 Navigation
                        </button>


                        {/* JOB HISTORY */}

                        <button
                            className={
                                workerSection ===
                                "history"
                                    ? "admin-nav-item active"
                                    : "admin-nav-item"
                            }

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

                        <div>

                            <h1>
                                Profile
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
                                    setShowWorkerProfile(
                                        false
                                    )
                                }
                            >

                                <div className="admin-avatar">
                                    👷
                                </div>

                                <div>

                                    <strong>
                                        {
                                            user?.name ||
                                            "Worker"
                                        }
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


                    {/* NAVIGATION */}

                    <button
                        className={
                            workerSection ===
                            "navigation"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }

                        onClick={() =>
                            setWorkerSection(
                                "navigation"
                            )
                        }
                    >
                        🧭 Navigation
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

                        {/* NOTIFICATION BELL */}

                        <NotificationBell />


                        {/* PROFILE */}

                        <button
                            type="button"
                            className="admin-profile admin-profile-button"

                            onClick={() =>
                                setShowWorkerProfile(
                                    true
                                )
                            }
                        >

                            <div className="admin-avatar">
                                👷
                            </div>

                            <div>

                                <strong>
                                    {
                                        user?.name ||
                                        "Worker"
                                    }
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

                {
                    workerSection ===
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


                            {/* =================================================
                                STATISTICS
                            ================================================= */}

                            <div className="dashboard-stats">

                                {/* ASSIGNED JOBS */}

                                <div className="dashboard-stat-card">

                                    <div className="dashboard-stat-icon jobs">
                                        📋
                                    </div>

                                    <div>

                                        <span>
                                            Assigned Jobs
                                        </span>

                                        <strong>
                                            {
                                                jobsLoading
                                                    ? "..."
                                                    : assignedJobs.length
                                            }
                                        </strong>

                                    </div>

                                </div>


                                {/* COMPLETED JOBS */}

                                <div className="dashboard-stat-card">

                                    <div className="dashboard-stat-icon normal">
                                        ✅
                                    </div>

                                    <div>

                                        <span>
                                            Completed Jobs
                                        </span>

                                        <strong>
                                            {
                                                jobsLoading
                                                    ? "..."
                                                    : completedJobs.length
                                            }
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


                                {/* AVAILABILITY */}

                                <div className="dashboard-stat-card">

                                    <div className="dashboard-stat-icon total">
                                        👷
                                    </div>

                                    <div>

                                        <span>
                                            Availability
                                        </span>

                                        <strong>
                                            {
                                                availabilityLabel
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                JOB FETCH ERROR
                            ================================================= */}

                            {
                                jobsError && (

                                    <div
                                        style={{
                                            marginTop: "15px",
                                            padding: "12px 16px",
                                            borderRadius: "8px",
                                            background: "#fff3f3",
                                            color: "#c62828",
                                            border: "1px solid #ffcdd2"
                                        }}
                                    >
                                        ⚠ {jobsError}
                                    </div>

                                )
                            }


                            {/* =================================================
                                CURRENT ASSIGNMENT
                            ================================================= */}

                            <div
                                className="dashboard-summary-card"
                                style={{
                                    marginTop: "20px"
                                }}
                            >

                                <div className="dashboard-summary-header">

                                    <div>

                                        <h3>
                                            Current Assignment
                                        </h3>

                                        <p>
                                            Your current SmartBin
                                            collection assignment.
                                        </p>

                                    </div>

                                </div>


                                {
                                    jobsLoading ? (

                                        <div
                                            style={{
                                                padding: "25px",
                                                textAlign: "center"
                                            }}
                                        >
                                            Loading current assignment...
                                        </div>

                                    ) : currentJob ? (

                                        <div
                                            className="dashboard-info-grid"
                                        >

                                            {/* BIN */}

                                            <div className="dashboard-info-card">

                                                <div className="dashboard-info-icon">
                                                    🗑️
                                                </div>

                                                <div>

                                                    <h3>
                                                        {currentBinName}
                                                    </h3>

                                                    <p>
                                                        Bin ID:{" "}
                                                        <strong>
                                                            {currentBinId}
                                                        </strong>
                                                    </p>

                                                    <p>
                                                        📍{" "}
                                                        {currentBinLocation}
                                                    </p>

                                                </div>

                                            </div>


                                            {/* STATUS */}

                                            <div className="dashboard-info-card">

                                                <div className="dashboard-info-icon">
                                                    📊
                                                </div>

                                                <div>

                                                    <h3>
                                                        Collection Status
                                                    </h3>

                                                    <p>

                                                        Status:{" "}

                                                        <strong>
                                                            {
                                                                currentJobIsAccepted
                                                                    ? "Accepted"
                                                                    : "Assigned"
                                                            }
                                                        </strong>

                                                    </p>

                                                    <p>

                                                        Fill Level:{" "}

                                                        <strong>
                                                            {currentFillLevel}%
                                                        </strong>

                                                    </p>


                                                    <button
                                                        onClick={() => {

                                                            if (
                                                                currentJobIsAccepted
                                                            ) {

                                                                setWorkerSection(
                                                                    "navigation"
                                                                );

                                                            } else {

                                                                setWorkerSection(
                                                                    "jobs"
                                                                );

                                                            }

                                                        }}
                                                    >

                                                        {
                                                            currentJobIsAccepted
                                                                ? "Continue Navigation →"
                                                                : "View Job →"
                                                        }

                                                    </button>

                                                </div>

                                            </div>

                                        </div>

                                    ) : (

                                        <div
                                            style={{
                                                padding: "30px",
                                                textAlign: "center"
                                            }}
                                        >

                                            <div
                                                style={{
                                                    fontSize: "42px",
                                                    marginBottom: "10px"
                                                }}
                                            >
                                                📭
                                            </div>

                                            <h3>
                                                No Active Assignment
                                            </h3>

                                            <p>
                                                You currently have no
                                                assigned collection job.
                                            </p>

                                            <button
                                                onClick={() =>
                                                    setWorkerSection(
                                                        "jobs"
                                                    )
                                                }
                                            >
                                                View My Jobs →
                                            </button>

                                        </div>

                                    )
                                }

                            </div>


                            {/* =================================================
                                WELCOME / QUICK INFO
                            ================================================= */}

                            <div
                                className="dashboard-summary-card"
                                style={{
                                    marginTop: "20px"
                                }}
                            >

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
                                            monitor your GPS
                                            location.
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


                                    {/* NAVIGATION */}

                                    <div className="dashboard-info-card">

                                        <div className="dashboard-info-icon">
                                            🧭
                                        </div>

                                        <div>

                                            <h3>
                                                Navigation
                                            </h3>

                                            <p>
                                                Navigate to your accepted
                                                SmartBin collection location
                                                using live road guidance.
                                            </p>

                                            <button
                                                onClick={() =>
                                                    setWorkerSection(
                                                        "navigation"
                                                    )
                                                }
                                            >
                                                Start Navigation →
                                            </button>

                                        </div>

                                    </div>


                                    {/* JOB HISTORY */}

                                    <div className="dashboard-info-card">

                                        <div className="dashboard-info-icon">
                                            🕘
                                        </div>

                                        <div>

                                            <h3>
                                                Job History
                                            </h3>

                                            <p>
                                                View your previously
                                                completed SmartBin
                                                collection jobs.
                                            </p>

                                            <button
                                                onClick={() =>
                                                    setWorkerSection(
                                                        "history"
                                                    )
                                                }
                                            >
                                                View History →
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                GPS INFORMATION
                            ================================================= */}

                            <div
                                className="dashboard-summary-card"
                                style={{
                                    marginTop: "20px"
                                }}
                            >

                                <div className="dashboard-summary-header">

                                    <div>

                                        <h3>
                                            📍 GPS Tracking
                                        </h3>

                                        <p>
                                            Your location is automatically
                                            sent to SmartBin every 5 seconds.
                                        </p>

                                    </div>

                                </div>


                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fit, minmax(200px, 1fr))",
                                        gap: "15px"
                                    }}
                                >

                                    <div
                                        style={{
                                            padding: "15px",
                                            borderRadius: "10px",
                                            background: "#f7faf8"
                                        }}
                                    >

                                        <strong>
                                            Status
                                        </strong>

                                        <p
                                            style={{
                                                marginBottom: 0
                                            }}
                                        >
                                            {locationStatus}
                                        </p>

                                    </div>


                                    <div
                                        style={{
                                            padding: "15px",
                                            borderRadius: "10px",
                                            background: "#f7faf8"
                                        }}
                                    >

                                        <strong>
                                            Latitude
                                        </strong>

                                        <p
                                            style={{
                                                marginBottom: 0
                                            }}
                                        >
                                            {
                                                location
                                                    ? location.latitude.toFixed(6)
                                                    : "Waiting..."
                                            }
                                        </p>

                                    </div>


                                    <div
                                        style={{
                                            padding: "15px",
                                            borderRadius: "10px",
                                            background: "#f7faf8"
                                        }}
                                    >

                                        <strong>
                                            Longitude
                                        </strong>

                                        <p
                                            style={{
                                                marginBottom: 0
                                            }}
                                        >
                                            {
                                                location
                                                    ? location.longitude.toFixed(6)
                                                    : "Waiting..."
                                            }
                                        </p>

                                    </div>


                                    <div
                                        style={{
                                            padding: "15px",
                                            borderRadius: "10px",
                                            background: "#f7faf8"
                                        }}
                                    >

                                        <strong>
                                            Last Updated
                                        </strong>

                                        <p
                                            style={{
                                                marginBottom: 0
                                            }}
                                        >
                                            {
                                                lastUpdated
                                                    ? lastUpdated.toLocaleTimeString()
                                                    : "Waiting..."
                                            }
                                        </p>

                                    </div>

                                </div>


                                {
                                    error && (

                                        <div
                                            style={{
                                                marginTop: "15px",
                                                padding: "12px",
                                                borderRadius: "8px",
                                                background: "#fff3f3",
                                                color: "#c62828"
                                            }}
                                        >
                                            ⚠ {error}
                                        </div>

                                    )
                                }

                            </div>

                        </section>
                    )
                }


                {/* =================================================
                    MY JOBS
                ================================================= */}

                {
                    workerSection ===
                    "jobs" && (

                        <section className="admin-content">

                            <WorkerJobs />

                        </section>
                    )
                }


                {/* =================================================
                    WORKER NAVIGATION
                ================================================= */}

                {
                    workerSection ===
                    "navigation" && (

                        <section className="admin-content">

                            <WorkerNavigation />

                        </section>
                    )
                }


                {/* =================================================
                    JOB HISTORY
                ================================================= */}

                {
                    workerSection ===
                    "history" && (

                        <section className="admin-content">

                            <WorkerJobHistory />

                        </section>
                    )
                }

            </main>

        </div>
    );
};


export default WorkerDashboard;