import React, { useEffect, useState } from "react";
import "./WorkerJobs.css";
const API_BASE_URL = "http://localhost:5000/api";

function WorkerJobs() {

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    // =====================================================
    // TOKEN
    // =====================================================

    const getToken = () => {
        return localStorage.getItem("smartbin_token");
    };

    // =====================================================
    // FETCH MY JOBS
    // =====================================================

    const fetchJobs = async () => {

        try {

            const token = getToken();

            if (!token) {
                setJobs([]);
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/jobs/my-jobs`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                console.error(
                    "Failed to fetch worker jobs:",
                    data.message
                );

                setJobs([]);

                return;
            }

            setJobs(data.jobs || []);

        } catch (error) {

            console.error(
                "Worker jobs fetch error:",
                error
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // INITIAL LOAD + LIVE REFRESH
    // =====================================================

    useEffect(() => {

        fetchJobs();

        const interval = setInterval(() => {
            fetchJobs();
        }, 5000);

        return () => {
            clearInterval(interval);
        };

    }, []);

    // =====================================================
    // JOB ACTION
    // =====================================================

    const handleJobAction = async (
        jobId,
        action
    ) => {

        try {

            setActionLoading(jobId);
            setMessage("");
            setMessageType("");

            const token = getToken();

            const response = await fetch(
                `${API_BASE_URL}/jobs/${jobId}/${action}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                setMessage(
                    data.message ||
                    "Unable to update job."
                );

                setMessageType("error");

                return;
            }

            setMessage(
                data.message ||
                "Job updated successfully."
            );

            setMessageType("success");

            await fetchJobs();

        } catch (error) {

            console.error(
                "Job action error:",
                error
            );

            setMessage(
                "Unable to connect to the server."
            );

            setMessageType("error");

        } finally {

            setActionLoading("");

        }
    };

    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {

        const value =
            String(status || "")
                .toLowerCase();

        if (value === "accepted") {
            return "accepted";
        }

        if (value === "assigned") {
            return "assigned";
        }

        if (value === "completed") {
            return "completed";
        }

        if (value === "pending") {
            return "pending";
        }

        return "";
    };

    // =====================================================
    // FILL CLASS
    // =====================================================

    const getFillClass = (fillLevel) => {

        const level =
            Number(fillLevel) || 0;

        if (level >= 90) {
            return "critical";
        }

        if (level >= 70) {
            return "warning";
        }

        return "normal";
    };

    // =====================================================
    // COUNTS
    // =====================================================

    const assignedCount = jobs.filter(
        (job) =>
            String(job.status).toLowerCase() ===
            "assigned"
    ).length;

    const acceptedCount = jobs.filter(
        (job) =>
            String(job.status).toLowerCase() ===
            "accepted"
    ).length;

    const completedCount = jobs.filter(
        (job) =>
            String(job.status).toLowerCase() ===
            "completed"
    ).length;

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "N/A";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="worker-jobs-page">

                <div className="worker-jobs-header">

                    <div>
                        <h2>My Jobs</h2>

                        <p>
                            Collection jobs assigned
                            to your account.
                        </p>
                    </div>

                </div>

                <div className="worker-jobs-loading">

                    <div className="worker-loading-spinner">
                        ⟳
                    </div>

                    <h3>
                        Loading Jobs...
                    </h3>

                    <p>
                        Fetching your latest
                        collection assignments.
                    </p>

                </div>

            </div>
        );
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="worker-jobs-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="worker-jobs-header">

                <div>

                    <h2>
                        My Jobs
                    </h2>

                    <p>
                        Collection jobs assigned
                        to your account.
                    </p>

                </div>

                <button
                    className="worker-refresh-button"
                    onClick={fetchJobs}
                >
                    ↻ Refresh
                </button>

            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="worker-job-summary">

                <div className="worker-job-stat">

                    <div className="worker-job-stat-icon">
                        📋
                    </div>

                    <div>
                        <span>Assigned</span>
                        <strong>
                            {assignedCount}
                        </strong>
                    </div>

                </div>

                <div className="worker-job-stat">

                    <div className="worker-job-stat-icon accepted-icon">
                        🚚
                    </div>

                    <div>
                        <span>Accepted</span>
                        <strong>
                            {acceptedCount}
                        </strong>
                    </div>

                </div>

                <div className="worker-job-stat">

                    <div className="worker-job-stat-icon completed-icon">
                        ✓
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>
                            {completedCount}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                MESSAGE
            ================================================= */}

            {message && (

                <div
                    className={`worker-job-message ${messageType}`}
                >
                    {message}
                </div>

            )}

            {/* =================================================
                NO JOBS
            ================================================= */}

            {jobs.length === 0 ? (

                <div className="worker-no-jobs">

                    <div className="worker-no-jobs-icon">
                        ✓
                    </div>

                    <h3>
                        No Jobs Assigned
                    </h3>

                    <p>
                        There are currently no
                        collection jobs associated
                        with your account.
                    </p>

                </div>

            ) : (

                /* =================================================
                    JOB LIST
                ================================================= */

                <div className="worker-jobs-list">

                    {jobs.map((job) => {

                        const currentBinLevel =
                            Number(
                                job.bin?.fillLevel ??
                                job.fillLevel ??
                                0
                            );

                        const status =
                            String(
                                job.status || ""
                            ).toLowerCase();

                        const isEmpty =
                            currentBinLevel <= 0;

                        return (

                            <div
                                className="worker-job-card"
                                key={job._id}
                            >

                                {/* =================================
                                    CARD HEADER
                                ================================= */}

                                <div className="worker-job-card-header">

                                    <div>

                                        <span className="worker-job-label">
                                            JOB ID
                                        </span>

                                        <h3>
                                            {job._id}
                                        </h3>

                                    </div>

                                    <span
                                        className={`worker-job-status ${getStatusClass(
                                            job.status
                                        )}`}
                                    >
                                        {job.status}
                                    </span>

                                </div>

                                {/* =================================
                                    BIN INFORMATION
                                ================================= */}

                                <div className="worker-job-main">

                                    <div className="worker-bin-icon">
                                        🗑️
                                    </div>

                                    <div>

                                        <span className="worker-job-label">
                                            BIN
                                        </span>

                                        <h3>
                                            {job.bin?.binId ||
                                                "Unknown Bin"}
                                        </h3>

                                    </div>

                                </div>

                                {/* =================================
                                    DETAILS
                                ================================= */}

                                <div className="worker-job-details">

                                    {/* FILL LEVEL */}

                                    <div className="worker-job-detail">

                                        <span>
                                            📊 Fill Level
                                        </span>

                                        <div className="worker-fill-wrapper">

                                            <strong
                                                className={`worker-fill-value ${getFillClass(
                                                    currentBinLevel
                                                )}`}
                                            >
                                                {currentBinLevel}%
                                            </strong>

                                            <div className="worker-fill-bar">

                                                <div
                                                    className={`worker-fill-progress ${getFillClass(
                                                        currentBinLevel
                                                    )}`}
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            Math.max(
                                                                0,
                                                                currentBinLevel
                                                            )
                                                        )}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    </div>

                                    {/* LOCATION */}

                                    <div className="worker-job-detail">

                                        <span>
                                            📍 Location
                                        </span>

                                        <strong>
                                            {job.binLocation?.latitude ??
                                                "N/A"}
                                            {", "}
                                            {job.binLocation?.longitude ??
                                                "N/A"}
                                        </strong>

                                    </div>

                                    {/* CREATED */}

                                    <div className="worker-job-detail">

                                        <span>
                                            🕒 Created
                                        </span>

                                        <strong>
                                            {formatDate(
                                                job.createdAt
                                            )}
                                        </strong>

                                    </div>

                                </div>

                                {/* =================================
                                    ACTION AREA
                                ================================= */}

                                <div className="worker-job-actions">

                                    {/* ASSIGNED */}

                                    {status === "assigned" && (

                                        <>

                                            <button
                                                className="worker-job-button accept"
                                                disabled={
                                                    actionLoading ===
                                                    job._id
                                                }
                                                onClick={() =>
                                                    handleJobAction(
                                                        job._id,
                                                        "accept"
                                                    )
                                                }
                                            >
                                                {actionLoading ===
                                                job._id
                                                    ? "Processing..."
                                                    : "✓ Accept Job"}
                                            </button>

                                            <button
                                                className="worker-job-button reject"
                                                disabled={
                                                    actionLoading ===
                                                    job._id
                                                }
                                                onClick={() =>
                                                    handleJobAction(
                                                        job._id,
                                                        "reject"
                                                    )
                                                }
                                            >
                                                ✕ Reject
                                            </button>

                                        </>

                                    )}

                                    {/* ACCEPTED + BIN NOT EMPTY */}

                                    {status === "accepted" &&
                                        !isEmpty && (

                                            <button
                                                className="worker-job-button navigate"
                                                onClick={() => {
                                                    alert(
                                                        "Live Navigation will be opened here."
                                                    );
                                                }}
                                            >
                                                🗺️ Navigate
                                            </button>

                                        )}

                                    {/* ACCEPTED + BIN EMPTY */}

                                    {status === "accepted" &&
                                        isEmpty && (

                                            <div className="worker-auto-complete">

                                                <span>
                                                    ✓
                                                </span>

                                                <div>

                                                    <strong>
                                                        Collection Completed
                                                    </strong>

                                                    <p>
                                                        Bin is empty. Job will
                                                        be marked completed
                                                        automatically.
                                                    </p>

                                                </div>

                                            </div>

                                        )}

                                    {/* COMPLETED */}

                                    {status === "completed" && (

                                        <div className="worker-completed-state">

                                            <span>
                                                ✓
                                            </span>

                                            <strong>
                                                Collection Completed
                                            </strong>

                                            <small>
                                                Worker is Available
                                            </small>

                                        </div>

                                    )}

                                </div>

                            </div>

                        );

                    })}

                </div>

            )}

        </div>

    );
}

export default WorkerJobs;