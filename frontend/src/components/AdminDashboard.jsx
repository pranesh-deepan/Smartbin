import { useEffect, useState } from "react";
import AdminBins from "../AdminBins";
import WorkerTracking from "./WorkerTracking";
import AdminMap from "./AdminMap";
import AdminProfile from "./AdminProfile";

function AdminDashboard({ user, onLogout,  onUserUpdated }) {

    // =====================================================
    // ADMIN SECTION
    // =====================================================

    const [adminSection, setAdminSection] = useState("dashboard");

    // =====================================================
// ADMIN PROFILE
// =====================================================

    const [showAdminProfile, setShowAdminProfile] =
    useState(false);
    // =====================================================
    // BINS
    // =====================================================

    const [bins, setBins] = useState([]);
    const [binsLoading, setBinsLoading] = useState(false);

    // =====================================================
    // JOBS
    // =====================================================

    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    // =====================================================
    // WORKERS
    // =====================================================

    const [workers, setWorkers] = useState([]);
    const [workersLoading, setWorkersLoading] = useState(false);
    const [workersError, setWorkersError] = useState("");

    // =====================================================
    // WORKER TRACKING
    // =====================================================

    const [trackingJob, setTrackingJob] = useState(null);

    // =====================================================
    // WORKER REGISTRATION FORM
    // =====================================================

    const [showWorkerForm, setShowWorkerForm] = useState(false);

    const [workerName, setWorkerName] = useState("");
    const [workerEmail, setWorkerEmail] = useState("");
    const [workerPhone, setWorkerPhone] = useState("");
    const [workerPassword, setWorkerPassword] = useState("");

    const [workerLoading, setWorkerLoading] = useState(false);
    const [workerMessage, setWorkerMessage] = useState("");
    const [workerMessageType, setWorkerMessageType] = useState("");

    // =====================================================
    // TOKEN
    // =====================================================

    const getToken = () => {
        return localStorage.getItem("smartbin_token");
    };

    // =====================================================
    // FETCH BINS
    // =====================================================

    const fetchBins = async () => {

        try {

            setBinsLoading(true);

            const token =
    localStorage.getItem("smartbin_token");

            if (!token) {
                setBins([]);
                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/bins",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {

                setBins(data.bins || []);

            } else {

                console.error(
                    "Failed to fetch bins:",
                    data.message
                );

            }

        } catch (error) {

            console.error(
                "Error fetching bins:",
                error
            );

        } finally {

            setBinsLoading(false);

        }
    };

    // =====================================================
    // FETCH JOBS
    // =====================================================

    const fetchJobs = async () => {

        try {

            setJobsLoading(true);

            const token =
    localStorage.getItem("smartbin_token");

            if (!token) {
                setJobs([]);
                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/jobs",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {

                setJobs(data.jobs || []);

            } else {

                console.error(
                    "Failed to fetch jobs:",
                    data.message
                );

            }

        } catch (error) {

            console.error(
                "Error fetching jobs:",
                error
            );

        } finally {

            setJobsLoading(false);

        }
    };

    // =====================================================
    // FETCH WORKERS
    // =====================================================

    const fetchWorkers = async () => {

        try {

            setWorkersLoading(true);
            setWorkersError("");

            const token = getToken();

            if (!token) {

                setWorkers([]);

                setWorkersError(
                    "Authentication token not found. Please login again."
                );

                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/workers",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch workers"
                );

            }

            setWorkers(data.workers || []);

        } catch (error) {

            console.error(
                "Fetch Workers Error:",
                error
            );

            setWorkersError(
                error.message ||
                "Unable to load workers"
            );

        } finally {

            setWorkersLoading(false);

        }
    };

    // =====================================================
    // INITIAL ADMIN DATA LOAD
    // =====================================================

    useEffect(() => {

        fetchBins();
        fetchJobs();
        fetchWorkers();

    }, []);


    // =====================================================
// LIVE GPS REFRESH
// =====================================================

useEffect(() => {

    const gpsInterval = setInterval(() => {

        fetchWorkers();

    }, 5000);

    return () => {

        clearInterval(gpsInterval);

    };

}, []);
    // =====================================================
    // REGISTER WORKER
    // =====================================================

    const handleRegisterWorker = async (event) => {

        event.preventDefault();

        setWorkerMessage("");
        setWorkerMessageType("");

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !workerName.trim() ||
            !workerEmail.trim() ||
            !workerPhone.trim() ||
            !workerPassword
        ) {

            setWorkerMessage(
                "Please fill in all worker details."
            );

            setWorkerMessageType("error");

            return;
        }

        if (workerPassword.length < 6) {

            setWorkerMessage(
                "Password must be at least 6 characters."
            );

            setWorkerMessageType("error");

            return;
        }

        try {

            setWorkerLoading(true);

            const token = getToken();

            if (!token) {

                setWorkerMessage(
                    "Authentication token not found. Please login again."
                );

                setWorkerMessageType("error");

                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({

                        name: workerName.trim(),

                        email: workerEmail.trim(),

                        phone: workerPhone.trim(),

                        password: workerPassword,

                        role: "Worker",

                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                setWorkerMessage(
                    data.message ||
                    data.errors?.join(", ") ||
                    "Worker registration failed."
                );

                setWorkerMessageType("error");

                return;
            }

            // ---------------------------------------------
            // SUCCESS
            // ---------------------------------------------

            setWorkerMessage(
                "Worker registered successfully."
            );

            setWorkerMessageType("success");

            setWorkerName("");
            setWorkerEmail("");
            setWorkerPhone("");
            setWorkerPassword("");

            await fetchWorkers();

            setTimeout(() => {

                setShowWorkerForm(false);

                setWorkerMessage("");
                setWorkerMessageType("");

            }, 1200);

        } catch (error) {

            console.error(
                "Worker registration error:",
                error
            );

            setWorkerMessage(
                "Unable to connect to the server."
            );

            setWorkerMessageType("error");

        } finally {

            setWorkerLoading(false);

        }
    };

    // =====================================================
    // BIN STATUS COUNTS
    // =====================================================

    const normalBins = bins.filter(
        (bin) =>
            (Number(bin.fillLevel) || 0) < 70
    );

    const warningBins = bins.filter((bin) => {

        const fill =
            Number(bin.fillLevel) || 0;

        return fill >= 70 && fill < 90;

    });

    const criticalBins = bins.filter(
        (bin) =>
            (Number(bin.fillLevel) || 0) >= 90
    );

    // =====================================================
    // JOB STATUS COUNTS
    // =====================================================

    const pendingJobs = jobs.filter(
        (job) =>
            String(job.status || "").toLowerCase() ===
            "pending"
    );

    const acceptedJobs = jobs.filter(
        (job) =>
            String(job.status || "").toLowerCase() ===
            "accepted"
    );

    const completedJobs = jobs.filter(
        (job) =>
            String(job.status || "").toLowerCase() ===
            "completed"
    );

    // =====================================================
    // PAGE TITLE
    // =====================================================

    const getPageTitle = () => {

        if (adminSection === "dashboard")
            return "Dashboard";

        if (adminSection === "bins")
            return "Bin Management";

        if (adminSection === "workers")
            return "Worker Management";

        if (adminSection === "jobs")
            return "Job Management";

        if (adminSection === "map")
            return "Live Map";

        return "Dashboard";
    };

    // =====================================================
    // WORKER STATUS
    // =====================================================

    const getWorkerStatusClass = (availability) => {

        if (availability === "Busy") {
            return "worker-status busy";
        }

        return "worker-status available";
    };

    // =====================================================
    // TRACK WORKER FROM JOB
    // =====================================================

    const handleTrackWorker = (job) => {

        if (!job) {
            return;
        }

        setTrackingJob(job);
    };

    // =====================================================
    // TRACK WORKER FROM WORKER MANAGEMENT
    // =====================================================

    const handleTrackWorkerFromWorkerList = (worker) => {

        if (!worker || !worker._id) {
            return;
        }

        // ---------------------------------------------
        // Find the active/accepted job assigned to
        // this worker.
        // ---------------------------------------------

        const workerId = String(worker._id);

        const assignedJob = jobs.find((job) => {

            const status = String(
                job.status || ""
            ).toLowerCase();

            if (
                status !== "accepted" &&
                status !== "assigned" &&
                status !== "in progress" &&
                status !== "in_progress"
            ) {
                return false;
            }

            const jobWorkerId =
                job.worker?._id ||
                job.worker?.id ||
                job.workerId;

            return (
                jobWorkerId &&
                String(jobWorkerId) === workerId
            );

        });

        // ---------------------------------------------
        // Create a tracking object.
        //
        // WorkerTracking.jsx expects:
        //
        // job.worker._id
        //
        // So we provide the selected worker directly.
        // ---------------------------------------------

        const trackingData = {

            ...(assignedJob || {}),

            _id:
                assignedJob?._id ||
                `worker-${worker._id}`,

            worker: {

                ...(assignedJob?.worker || {}),

                ...worker,

                _id: worker._id,

                name: worker.name,

                email: worker.email,

                phone: worker.phone,

                currentLocation:
                    worker.currentLocation ||
                    assignedJob?.worker?.currentLocation ||
                    null,

            },

        };

        setTrackingJob(trackingData);

    };

    // =====================================================
    // BACK FROM TRACKING
    // =====================================================

    const handleBackFromTracking = () => {

        setTrackingJob(null);

    };

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="admin-layout">

            {/* =================================================
                SIDEBAR
            ================================================= */}

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
                            Admin Panel
                        </span>

                    </div>

                </div>


                {/* NAVIGATION */}

                <nav className="admin-nav">

                    <button
                        className={
                            adminSection === "dashboard"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }
                        onClick={() => {
                            setTrackingJob(null);
                            setAdminSection("dashboard");
                        }}
                    >
                        📊 Dashboard
                    </button>


                    <button
                        className={
                            adminSection === "bins"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }
                        onClick={() => {
                            setTrackingJob(null);
                            setAdminSection("bins");
                        }}
                    >
                        🗑️ Bin Management
                    </button>


                    <button
                        className={
                            adminSection === "workers"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }
                        onClick={() => {
                            setTrackingJob(null);
                            setAdminSection("workers");
                        }}
                    >
                        👷 Worker Management
                    </button>


                    <button
                        className={
                            adminSection === "jobs"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }
                        onClick={() => {
                            setTrackingJob(null);
                            setAdminSection("jobs");
                        }}
                    >
                        📋 Job Management
                    </button>


                    <button
                        className={
                            adminSection === "map"
                                ? "admin-nav-item active"
                                : "admin-nav-item"
                        }
                        onClick={() => {
                            setTrackingJob(null);
                            setAdminSection("map");
                        }}
                    >
                        🗺️ Live Map
                    </button>

                </nav>


                {/* LOGOUT */}

                <button
                    className="admin-logout"
                    onClick={onLogout}
                >
                    🚪 Logout
                </button>

            </aside>


            {/* =================================================
                MAIN ADMIN AREA
            ================================================= */}

            <main className="admin-main">

                {/* TOP BAR */}

                <header className="admin-topbar">

                    <div>

                        <h1>
                            {trackingJob
                                ? "Track Worker"
                                : getPageTitle()}
                        </h1>

                        <p>
                            SmartBin Waste Management System
                        </p>

                    </div>


                    <button
    type="button"
    className="admin-profile admin-profile-button"
    onClick={() => {
        setShowAdminProfile(true);
        setTrackingJob(null);
    }}
>

    <div className="admin-avatar">
        👨‍💼
    </div>

    <div>

        <strong>
            {user?.name || "Admin"}
        </strong>

        <span>
            Administrator
        </span>

    </div>

</button>

                </header>


                {/* =================================================
                    WORKER TRACKING
                ================================================= */}
                {showAdminProfile ? (

    <section className="admin-content">

        <AdminProfile
    onBack={() => {
        setShowAdminProfile(false);
    }}
    onProfileUpdated={(updatedUser) => {

        if (onUserUpdated) {
            onUserUpdated(updatedUser);
        }

    }}
/>

    </section>
                ) : trackingJob ? (

                    <section className="admin-content">

                        <WorkerTracking
                            job={trackingJob}
                            onBack={handleBackFromTracking}
                        />

                    </section>

                ) : (

                    <>

                        {/* =================================================
                            DASHBOARD
                        ================================================= */}

                        {adminSection === "dashboard" && (

                            <section className="admin-content">

                                <div className="admin-page-header">

                                    <div>

                                        <h2>
                                            Admin Dashboard
                                        </h2>

                                        <p>
                                            Overview of SmartBin operations
                                        </p>

                                    </div>

                                    <button
                                        className="dashboard-refresh-button"
                                        onClick={() => {
                                            fetchBins();
                                            fetchJobs();
                                            fetchWorkers();
                                        }}
                                        disabled={
                                            binsLoading ||
                                            jobsLoading ||
                                            workersLoading
                                        }
                                    >
                                        {binsLoading ||
                                        jobsLoading ||
                                        workersLoading
                                            ? "Refreshing..."
                                            : "↻ Refresh"}
                                    </button>

                                </div>


                                {/* STATISTICS */}

                                <div className="dashboard-stats">

                                    <div className="dashboard-stat-card">

                                        <div className="dashboard-stat-icon total">
                                            🗑️
                                        </div>

                                        <div>

                                            <span>
                                                Total Bins
                                            </span>

                                            <strong>
                                                {binsLoading
                                                    ? "..."
                                                    : bins.length}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="dashboard-stat-card">

                                        <div className="dashboard-stat-icon normal">
                                            🟢
                                        </div>

                                        <div>

                                            <span>
                                                Normal Bins
                                            </span>

                                            <strong>
                                                {binsLoading
                                                    ? "..."
                                                    : normalBins.length}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="dashboard-stat-card">

                                        <div className="dashboard-stat-icon warning">
                                            🟠
                                        </div>

                                        <div>

                                            <span>
                                                Getting Full
                                            </span>

                                            <strong>
                                                {binsLoading
                                                    ? "..."
                                                    : warningBins.length}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="dashboard-stat-card">

                                        <div className="dashboard-stat-icon critical">
                                            🔴
                                        </div>

                                        <div>

                                            <span>
                                                Critical Bins
                                            </span>

                                            <strong>
                                                {binsLoading
                                                    ? "..."
                                                    : criticalBins.length}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="dashboard-stat-card">

                                        <div className="dashboard-stat-icon jobs">
                                            📋
                                        </div>

                                        <div>

                                            <span>
                                                Collection Jobs
                                            </span>

                                            <strong>
                                                {jobsLoading
                                                    ? "..."
                                                    : jobs.length}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="dashboard-stat-card">

                                        <div className="dashboard-stat-icon workers">
                                            👷
                                        </div>

                                        <div>

                                            <span>
                                                Workers
                                            </span>

                                            <strong>
                                                {workersLoading
                                                    ? "..."
                                                    : workers.length}
                                            </strong>

                                        </div>

                                    </div>

                                </div>


                                {/* BIN SUMMARY */}

                                <div className="dashboard-summary-card">

                                    <div className="dashboard-summary-header">

                                        <div>

                                            <h3>
                                                Bin Status Overview
                                            </h3>

                                            <p>
                                                Current status of registered bins.
                                            </p>

                                        </div>

                                        <button
                                            className="dashboard-view-button"
                                            onClick={() =>
                                                setAdminSection("bins")
                                            }
                                        >
                                            View Bins →
                                        </button>

                                    </div>


                                    <div className="dashboard-status-list">

                                        <div className="dashboard-status-row">

                                            <div className="dashboard-status-info">

                                                <span className="status-dot normal-dot"></span>

                                                Normal

                                            </div>

                                            <strong>
                                                {normalBins.length}
                                            </strong>

                                        </div>


                                        <div className="dashboard-status-row">

                                            <div className="dashboard-status-info">

                                                <span className="status-dot warning-dot"></span>

                                                Getting Full

                                            </div>

                                            <strong>
                                                {warningBins.length}
                                            </strong>

                                        </div>


                                        <div className="dashboard-status-row">

                                            <div className="dashboard-status-info">

                                                <span className="status-dot critical-dot"></span>

                                                Critical

                                            </div>

                                            <strong>
                                                {criticalBins.length}
                                            </strong>

                                        </div>

                                    </div>

                                </div>


                                {/* SYSTEM INFORMATION */}

                                <div className="dashboard-info-grid">

                                    <div className="dashboard-info-card">

                                        <div className="dashboard-info-icon">
                                            🗺️
                                        </div>

                                        <div>

                                            <h3>
                                                Bin Management
                                            </h3>

                                            <p>
                                                View registered bins and their
                                                current fill levels.
                                            </p>

                                            <button
                                                onClick={() =>
                                                    setAdminSection("bins")
                                                }
                                            >
                                                Open Bins →
                                            </button>

                                        </div>

                                    </div>


                                    <div className="dashboard-info-card">

                                        <div className="dashboard-info-icon">
                                            👷
                                        </div>

                                        <div>

                                            <h3>
                                                Worker Tracking
                                            </h3>

                                            <p>
                                                View registered workers and
                                                their availability.
                                            </p>

                                            <button
                                                onClick={() =>
                                                    setAdminSection("workers")
                                                }
                                            >
                                                Workers →
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </section>

                        )}


                        {/* =================================================
                            BINS
                        ================================================= */}

                        {adminSection === "bins" && (

                            <AdminBins />

                        )}


                        {/* =================================================
                            WORKERS
                        ================================================= */}

                        {adminSection === "workers" && (

                            <section className="admin-content">

                                {/* PAGE HEADER */}

                                <div className="admin-page-header">

                                    <div>

                                        <h2>
                                            Workers
                                        </h2>

                                        <p>
                                            Manage registered waste collection
                                            workers.
                                        </p>

                                    </div>

                                    <button
                                        className="worker-register-top-button"
                                        onClick={() => {

                                            setShowWorkerForm(
                                                !showWorkerForm
                                            );

                                            setWorkerMessage("");
                                            setWorkerMessageType("");

                                        }}
                                    >
                                        {showWorkerForm
                                            ? "✕ Close"
                                            : "+ Register Worker"}
                                    </button>

                                </div>


                                {/* =================================================
                                    REGISTRATION FORM
                                ================================================= */}

                                {showWorkerForm && (

                                    <div className="worker-registration-card">

                                        <div className="worker-form-header">

                                            <div className="worker-form-icon">
                                                👷
                                            </div>

                                            <div>

                                                <h3>
                                                    Register New Worker
                                                </h3>

                                                <p>
                                                    Create a Worker account for
                                                    the waste collection team.
                                                </p>

                                            </div>

                                        </div>


                                        <form
                                            className="worker-registration-form"
                                            onSubmit={
                                                handleRegisterWorker
                                            }
                                        >

                                            <div className="worker-form-grid">

                                                <div className="form-group">

                                                    <label>
                                                        Worker Name
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={workerName}
                                                        onChange={(event) =>
                                                            setWorkerName(
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Enter worker name"
                                                        disabled={workerLoading}
                                                    />

                                                </div>


                                                <div className="form-group">

                                                    <label>
                                                        Email
                                                    </label>

                                                    <input
                                                        type="email"
                                                        value={workerEmail}
                                                        onChange={(event) =>
                                                            setWorkerEmail(
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Enter worker email"
                                                        disabled={workerLoading}
                                                    />

                                                </div>


                                                <div className="form-group">

                                                    <label>
                                                        Phone
                                                    </label>

                                                    <input
                                                        type="tel"
                                                        value={workerPhone}
                                                        onChange={(event) =>
                                                            setWorkerPhone(
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Enter phone number"
                                                        disabled={workerLoading}
                                                    />

                                                </div>


                                                <div className="form-group">

                                                    <label>
                                                        Password
                                                    </label>

                                                    <input
                                                        type="password"
                                                        value={workerPassword}
                                                        onChange={(event) =>
                                                            setWorkerPassword(
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Minimum 6 characters"
                                                        disabled={workerLoading}
                                                    />

                                                </div>

                                            </div>


                                            {workerMessage && (

                                                <div
                                                    className={`login-message ${workerMessageType}`}
                                                >
                                                    {workerMessage}
                                                </div>

                                            )}


                                            <div className="worker-form-footer">

                                                <p>
                                                    The worker will use these
                                                    credentials to login.
                                                </p>

                                                <button
                                                    type="submit"
                                                    className="worker-register-button"
                                                    disabled={workerLoading}
                                                >
                                                    {workerLoading
                                                        ? "Registering..."
                                                        : "Register Worker"}
                                                </button>

                                            </div>

                                        </form>

                                    </div>

                                )}


                                {/* =================================================
                                    WORKER LIST
                                ================================================= */}

                                <div className="worker-list-section">

                                    <div className="worker-list-header">

                                        <div>

                                            <h3>
                                                Registered Workers
                                            </h3>

                                            <p>
                                                {workers.length} worker
                                                {workers.length !== 1
                                                    ? "s"
                                                    : ""}{" "}
                                                registered
                                            </p>

                                        </div>

                                        <button
                                            className="dashboard-refresh-button"
                                            onClick={fetchWorkers}
                                            disabled={workersLoading}
                                        >
                                            {workersLoading
                                                ? "Loading..."
                                                : "↻ Refresh"}
                                        </button>

                                    </div>


                                    {/* LOADING */}

                                    {workersLoading && (

                                        <div className="worker-loading">
                                            Loading workers...
                                        </div>

                                    )}


                                    {/* ERROR */}

                                    {!workersLoading &&
                                        workersError && (

                                            <div className="worker-error">
                                                {workersError}
                                            </div>

                                        )}


                                    {/* EMPTY */}

                                    {!workersLoading &&
                                        !workersError &&
                                        workers.length === 0 && (

                                            <div className="worker-empty">

                                                <div className="worker-empty-icon">
                                                    👷
                                                </div>

                                                <h3>
                                                    No Workers Registered
                                                </h3>

                                                <p>
                                                    Register a worker to start
                                                    managing the waste
                                                    collection team.
                                                </p>

                                            </div>

                                        )}


                                    {/* WORKER CARDS */}

                                    {!workersLoading &&
                                        !workersError &&
                                        workers.length > 0 && (

                                            <div className="workers-grid">

                                                {workers.map((worker) => {

                                                    /*
                                                     * Find whether this worker
                                                     * currently has an active
                                                     * tracking job.
                                                     */

                                                    const workerJob =
                                                        jobs.find((job) => {

                                                            const status =
                                                                String(
                                                                    job.status ||
                                                                    ""
                                                                ).toLowerCase();

                                                            if (
                                                                status !==
                                                                    "accepted" &&
                                                                status !==
                                                                    "assigned" &&
                                                                status !==
                                                                    "in progress" &&
                                                                status !==
                                                                    "in_progress"
                                                            ) {
                                                                return false;
                                                            }

                                                            const jobWorkerId =
                                                                job.worker?._id ||
                                                                job.worker?.id ||
                                                                job.workerId;

                                                            return (
                                                                jobWorkerId &&
                                                                String(
                                                                    jobWorkerId
                                                                ) ===
                                                                    String(
                                                                        worker._id
                                                                    )
                                                            );

                                                        });


                                                    const hasGPS =
                                                        worker.currentLocation &&
                                                        worker.currentLocation
                                                            .latitude !== null &&
                                                        worker.currentLocation
                                                            .latitude !==
                                                            undefined &&
                                                        worker.currentLocation
                                                            .longitude !== null &&
                                                        worker.currentLocation
                                                            .longitude !==
                                                            undefined;


                                                    return (

                                                        <div
                                                            className="worker-card-admin"
                                                            key={worker._id}
                                                        >

                                                            {/* TOP */}

                                                            <div className="worker-card-top">

                                                                <div className="worker-avatar">
                                                                    👷
                                                                </div>

                                                                <div className="worker-card-name">

                                                                    <h3>
                                                                        {
                                                                            worker.name
                                                                        }
                                                                    </h3>

                                                                    <span>
                                                                        {
                                                                            worker.email
                                                                        }
                                                                    </span>

                                                                </div>

                                                                <span
                                                                    className={
                                                                        worker.isActive
                                                                            ? "worker-status active"
                                                                            : "worker-status inactive"
                                                                    }
                                                                >
                                                                    {worker.isActive
                                                                        ? "Active"
                                                                        : "Inactive"}
                                                                </span>

                                                            </div>


                                                            {/* DETAILS */}

                                                            <div className="worker-card-details">

                                                                <div className="worker-detail">

                                                                    <span>
                                                                        Phone
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            worker.phone ||
                                                                            "Not provided"
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div className="worker-detail">

                                                                    <span>
                                                                        Availability
                                                                    </span>

                                                                    <strong
                                                                        className={
                                                                            worker.availability ===
                                                                            "Available"
                                                                                ? "available-text"
                                                                                : "busy-text"
                                                                        }
                                                                    >
                                                                        {
                                                                            worker.availability ||
                                                                            "Available"
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div className="worker-detail">

                                                                    <span>
                                                                        GPS
                                                                    </span>

                                                                    <strong
                                                                        className={
                                                                            hasGPS
                                                                                ? "available-text"
                                                                                : "busy-text"
                                                                        }
                                                                    >
                                                                        {hasGPS
                                                                            ? "Available"
                                                                            : "Unavailable"}
                                                                    </strong>

                                                                </div>

                                                            </div>


                                                            {/* FOOTER */}

                                                            <div className="worker-card-footer">

                                                                <span className="worker-location-time">

                                                                    {worker.currentLocation?.lastUpdated
                                                                        ? `Updated ${new Date(
                                                                              worker
                                                                                  .currentLocation
                                                                                  .lastUpdated
                                                                          ).toLocaleString()}`
                                                                        : "GPS not updated yet"}

                                                                </span>


                                                                {/* =================================
                                                                    TRACK WORKER
                                                                ================================= */}

                                                                <button
                                                                    type="button"
                                                                    className="worker-track-button"
                                                                    disabled={!hasGPS}
                                                                    onClick={() =>
                                                                        handleTrackWorkerFromWorkerList(
                                                                            worker
                                                                        )
                                                                    }
                                                                >
                                                                     Track Worker
                                                                </button>

                                                            </div>

                                                        </div>

                                                    );

                                                })}

                                            </div>

                                        )}

                                </div>

                            </section>

                        )}


                        {/* =================================================
                            JOBS
                        ================================================= */}

                        {adminSection === "jobs" && (

                            <section className="admin-content">

                                <div className="admin-page-header">

                                    <div>

                                        <h2>
                                            Jobs
                                        </h2>

                                        <p>
                                            Manage garbage collection jobs
                                            and assignments.
                                        </p>

                                    </div>

                                    <button
                                        className="dashboard-refresh-button"
                                        onClick={fetchJobs}
                                        disabled={jobsLoading}
                                    >
                                        {jobsLoading
                                            ? "Refreshing..."
                                            : "↻ Refresh"}
                                    </button>

                                </div>


                                {/* JOB SUMMARY */}

                                <div className="dashboard-stats">

                                    <div className="dashboard-stat-card">

                                        <div className="dashboard-stat-icon warning">
                                            📋
                                        </div>

                                        <div>

                                            <span>
                                                Pending
                                            </span>

                                            <strong>
                                                {jobsLoading
                                                    ? "..."
                                                    : pendingJobs.length}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="dashboard-stat-card">

                                        <div className="dashboard-stat-icon normal">
                                            ✅
                                        </div>

                                        <div>

                                            <span>
                                                Accepted
                                            </span>

                                            <strong>
                                                {jobsLoading
                                                    ? "..."
                                                    : acceptedJobs.length}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="dashboard-stat-card">

                                        <div className="dashboard-stat-icon critical">
                                            ✔️
                                        </div>

                                        <div>

                                            <span>
                                                Completed
                                            </span>

                                            <strong>
                                                {jobsLoading
                                                    ? "..."
                                                    : completedJobs.length}
                                            </strong>

                                        </div>

                                    </div>

                                </div>


                                {/* JOB LIST */}

                                {!jobsLoading &&
                                    jobs.length === 0 && (

                                        <div className="worker-empty">

                                            <div className="worker-empty-icon">
                                                📋
                                            </div>

                                            <h3>
                                                No Jobs Available
                                            </h3>

                                            <p>
                                                Garbage collection jobs will
                                                appear here when created.
                                            </p>

                                        </div>

                                    )}


                                {!jobsLoading &&
                                    jobs.length > 0 && (

                                        <div className="jobs-list">

                                            {jobs.map((job) => {

                                                const isAccepted =
                                                    String(
                                                        job.status || ""
                                                    ).toLowerCase() ===
                                                    "accepted";

                                                return (

                                                    <div
                                                        className="job-card-admin"
                                                        key={job._id}
                                                    >

                                                        <div className="job-card-header">

                                                            <div>

                                                                <h3>
                                                                    Garbage Collection
                                                                    Job
                                                                </h3>

                                                                <p>
                                                                    Job ID:{" "}
                                                                    {job._id}
                                                                </p>

                                                            </div>


                                                            <div className="job-header-right">

                                                                <span
                                                                    className={`job-status ${
                                                                        String(
                                                                            job.status ||
                                                                            "pending"
                                                                        ).toLowerCase()
                                                                    }`}
                                                                >
                                                                    {
                                                                        job.status ||
                                                                        "Pending"
                                                                    }
                                                                </span>


                                                                {isAccepted && (

                                                                    <button
                                                                        type="button"
                                                                        className="track-worker-button"
                                                                        onClick={() =>
                                                                            handleTrackWorker(
                                                                                job
                                                                            )
                                                                        }
                                                                    >
                                                                        Track
                                                                    </button>

                                                                )}

                                                            </div>

                                                        </div>


                                                        <div className="job-card-details">

                                                            <div className="job-detail">

                                                                <span>
                                                                    Bin
                                                                </span>

                                                                <strong>
                                                                    {job.bin?.name ||
                                                                        job.binId ||
                                                                        "N/A"}
                                                                </strong>

                                                            </div>


                                                            <div className="job-detail">

                                                                <span>
                                                                    Worker
                                                                </span>

                                                                <strong>
                                                                    {job.worker?.name ||
                                                                        job.workerName ||
                                                                        "Not Assigned"}
                                                                </strong>

                                                            </div>


                                                            <div className="job-detail">

                                                                <span>
                                                                    Status
                                                                </span>

                                                                <strong>
                                                                    {job.status ||
                                                                        "Pending"}
                                                                </strong>

                                                            </div>


                                                            <div className="job-detail">

                                                                <span>
                                                                    Created
                                                                </span>

                                                                <strong>
                                                                    {job.createdAt
                                                                        ? new Date(
                                                                              job.createdAt
                                                                          ).toLocaleString()
                                                                        : "N/A"}
                                                                </strong>

                                                            </div>

                                                        </div>

                                                    </div>

                                                );

                                            })}

                                        </div>

                                    )}

                            </section>

                        )}


                        {/* =================================================
                            LIVE MAP
                        ================================================= */}
                        {adminSection === "map" && (

    <section className="admin-content">

        


        <AdminMap
        bins={bins}
        workers={workers}
        jobs={jobs}
        />

    </section>

)}
                        

                    </>

                )}

            </main>

        </div>
    );
}

export default AdminDashboard;