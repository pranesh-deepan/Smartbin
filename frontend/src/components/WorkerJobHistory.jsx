import React, { useEffect, useMemo, useState } from "react";
import "./WorkerJobHistory.css";

const API_BASE = "/api";

const WorkerJobHistory = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");

    const fetchJobHistory = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("smartbin_token");

            if (!token) {
                setError("Authentication token not found.");
                return;
            }

            const response = await fetch(`${API_BASE}/jobs/my-jobs`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch job history");
            }

            const allJobs = Array.isArray(data)
                ? data
                : data.jobs || [];

            const completedJobs = allJobs.filter(
                (job) =>
                    String(job.status || "").toLowerCase() === "completed"
            );

            setJobs(completedJobs);
        } catch (err) {
            console.error("Worker Job History Error:", err);
            setError(err.message || "Unable to load job history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobHistory();

        const interval = setInterval(fetchJobHistory, 10000);

        return () => clearInterval(interval);
    }, []);

    const filteredJobs = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        return jobs.filter((job) => {
            const bin = job.bin || {};

            const jobId = String(job._id || job.jobId || "").toLowerCase();
            const binId = String(bin.binId || "").toLowerCase();
            const binName = String(bin.name || "").toLowerCase();
            const location = String(bin.location || "").toLowerCase();

            const matchesSearch =
                !searchText ||
                jobId.includes(searchText) ||
                binId.includes(searchText) ||
                binName.includes(searchText) ||
                location.includes(searchText);

            const matchesFilter =
                filter === "All" ||
                String(job.status || "").toLowerCase() ===
                    filter.toLowerCase();

            return matchesSearch && matchesFilter;
        });
    }, [jobs, search, filter]);

    const formatDate = (dateValue) => {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getJobId = (job) => {
        if (job.jobId) return job.jobId;

        if (job._id) {
            return String(job._id).slice(-8).toUpperCase();
        }

        return "—";
    };

    if (loading) {
        return (
            <div className="worker-history-page">
                <div className="worker-history-loading">
                    <div className="worker-history-spinner"></div>
                    <p>Loading job history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="worker-history-page">

            <div className="worker-history-header">
                <div>
                    <div className="worker-history-title-row">
                        <div className="worker-history-title-icon">
                            📋
                        </div>

                        <div>
                            <h1>Job History</h1>
                            <p>
                                View your completed garbage collection jobs
                            </p>
                        </div>
                    </div>
                </div>

                <div className="worker-history-total">
                    <span>Total Completed</span>
                    <strong>{jobs.length}</strong>
                </div>
            </div>

            {error && (
                <div className="worker-history-error">
                    <span>⚠️</span>
                    <div>
                        <strong>Unable to load job history</strong>
                        <p>{error}</p>
                    </div>

                    <button onClick={fetchJobHistory}>
                        Retry
                    </button>
                </div>
            )}

            <div className="worker-history-controls">

                <div className="worker-history-search">
                    <span>🔍</span>

                    <input
                        type="text"
                        placeholder="Search by Job ID, Bin ID, name or location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="worker-history-filter">
                    <label>Status</label>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="All">All</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

                <button
                    className="worker-history-refresh"
                    onClick={fetchJobHistory}
                    title="Refresh"
                >
                    ↻ Refresh
                </button>
            </div>

            <div className="worker-history-summary">
                <div className="worker-history-summary-card">
                    <div className="summary-icon">📋</div>

                    <div>
                        <span>Completed Jobs</span>
                        <strong>{jobs.length}</strong>
                    </div>
                </div>

                <div className="worker-history-summary-card">
                    <div className="summary-icon">🔎</div>

                    <div>
                        <span>Showing</span>
                        <strong>{filteredJobs.length}</strong>
                    </div>
                </div>
            </div>

            <div className="worker-history-table-container">

                <div className="worker-history-table-header">
                    <div>
                        <h2>Completed Collections</h2>
                        <p>
                            History of bins collected by you
                        </p>
                    </div>
                </div>

                {filteredJobs.length === 0 ? (
                    <div className="worker-history-empty">

                        <div className="worker-history-empty-icon">
                            📋
                        </div>

                        <h3>
                            {jobs.length === 0
                                ? "No completed jobs yet"
                                : "No matching jobs found"}
                        </h3>

                        <p>
                            {jobs.length === 0
                                ? "Your completed collection jobs will appear here."
                                : "Try changing your search or filter."}
                        </p>

                    </div>
                ) : (
                    <div className="worker-history-table-wrapper">

                        <table className="worker-history-table">

                            <thead>
                                <tr>
                                    <th>Job ID</th>
                                    <th>Bin</th>
                                    <th>Location</th>
                                    <th>Fill Level</th>
                                    <th>Completed At</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredJobs.map((job) => {

                                    const bin = job.bin || {};

                                    const fillLevel =
                                        job.fillLevel ??
                                        job.binLocation?.fillLevel ??
                                        "—";

                                    return (
                                        <tr key={job._id}>

                                            <td>
                                                <span className="history-job-id">
                                                    #{getJobId(job)}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="history-bin">

                                                    <div className="history-bin-icon">
                                                        🗑️
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {bin.binId ||
                                                                job.binLocation?.binId ||
                                                                "Unknown"}
                                                        </strong>

                                                        <span>
                                                            {bin.name ||
                                                                "Smart Bin"}
                                                        </span>
                                                    </div>

                                                </div>
                                            </td>

                                            <td>
                                                <div className="history-location">
                                                    📍{" "}
                                                    {bin.location ||
                                                        "Location unavailable"}
                                                </div>
                                            </td>

                                            <td>
                                                <span className="history-fill-level">
                                                    {fillLevel !== "—"
                                                        ? `${fillLevel}%`
                                                        : "—"}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="history-date">
                                                    {formatDate(
                                                        job.completedAt
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="history-status completed">
                                                    ✓ Completed
                                                </span>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>
                    </div>
                )}

            </div>

        </div>
    );
};

export default WorkerJobHistory;