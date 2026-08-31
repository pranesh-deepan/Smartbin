import React from "react";
import "./WorkerJobs.css";

const WorkerJobs = () => {

    return (
        <div className="worker-jobs-page">

            {/* Header */}
            <div className="worker-jobs-header">

                <div>
                    <h2>My Jobs</h2>

                    <p>
                        View and manage your assigned waste collection jobs.
                    </p>
                </div>

                <div className="worker-jobs-live-status">
                    <span></span>
                    Live
                </div>

            </div>


            {/* Summary Cards */}
            <div className="worker-jobs-summary">

                <div className="worker-job-summary-card">

                    <div className="worker-job-summary-icon pending">
                        📋
                    </div>

                    <div>
                        <span>Pending Jobs</span>
                        <strong>0</strong>
                    </div>

                </div>


                <div className="worker-job-summary-card">

                    <div className="worker-job-summary-icon accepted">
                        ✓
                    </div>

                    <div>
                        <span>Accepted Jobs</span>
                        <strong>0</strong>
                    </div>

                </div>


                <div className="worker-job-summary-card">

                    <div className="worker-job-summary-icon progress">
                        🚛
                    </div>

                    <div>
                        <span>In Progress</span>
                        <strong>0</strong>
                    </div>

                </div>


                <div className="worker-job-summary-card">

                    <div className="worker-job-summary-icon completed">
                        ✓
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>0</strong>
                    </div>

                </div>

            </div>


            {/* Job Section */}
            <div className="worker-jobs-card">

                <div className="worker-jobs-card-header">

                    <div>
                        <h3>Assigned Jobs</h3>

                        <p>
                            Jobs assigned to you will appear here.
                        </p>
                    </div>


                    <button
                        type="button"
                        className="worker-jobs-refresh-button"
                        onClick={() => window.location.reload()}
                    >
                        ↻ Refresh
                    </button>

                </div>


                {/* Empty State */}
                <div className="worker-jobs-empty">

                    <div className="worker-jobs-empty-icon">
                        📋
                    </div>

                    <h3>
                        No Jobs Assigned
                    </h3>

                    <p>
                        You currently don't have any assigned
                        collection jobs.
                    </p>

                </div>

            </div>

        </div>
    );
};

export default WorkerJobs;