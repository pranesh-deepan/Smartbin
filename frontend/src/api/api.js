
const API_BASE_URL = "https://smartbin-w-backend.onrender.com";

// =====================================================
// COMMON API REQUEST FUNCTION
// =====================================================

export const apiRequest = async (endpoint, options = {}) => {
    try {
        // Use the same token key that your login function stores.
        const token = localStorage.getItem("smartbin_token");

        const response = await fetch(
            `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
            {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(token
                        ? { Authorization: `Bearer ${token}` }
                        : {}),
                    ...(options.headers || {}),
                },
            }
        );

        const contentType = response.headers.get("content-type");

        const data = contentType?.includes("application/json")
            ? await response.json()
            : await response.text();

        return {
            success: response.ok,
            status: response.status,
            data,
        };
    } catch (error) {
        console.error("API Request Error:", error);

        return {
            success: false,
            status: 0,
            data: {
                message: "Unable to connect to backend server",
            },
        };
    }
};

// =====================================================
// AUTHENTICATION
// =====================================================

export const loginUser = async (email, password) => {
    return apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
};

export const registerUser = async (userData) => {
    return apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
    });
};

export const getCurrentUser = async () => {
    return apiRequest("/api/auth/me");
};

export const updateProfile = async (profileData) => {
    return apiRequest("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
    });
};

export const changePassword = async (passwordData) => {
    return apiRequest("/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify(passwordData),
    });
};

export const updateWorkerLocation = async (locationData) => {
    return apiRequest("/api/auth/location", {
        method: "PUT",
        body: JSON.stringify(locationData),
    });
};

export const updateWorkerAvailability = async (availabilityData) => {
    return apiRequest("/api/auth/availability", {
        method: "PUT",
        body: JSON.stringify(availabilityData),
    });
};

export const getWorkerLocation = async (workerId) => {
    return apiRequest(
        `/api/auth/worker/${encodeURIComponent(workerId)}/location`
    );
};

// =====================================================
// BINS
// =====================================================

export const getAllBins = async () => {
    return apiRequest("/api/bins");
};

export const getBinById = async (binId) => {
    return apiRequest(`/api/bins/${encodeURIComponent(binId)}`);
};

export const createBin = async (binData) => {
    return apiRequest("/api/bins", {
        method: "POST",
        body: JSON.stringify(binData),
    });
};

export const updateBin = async (binId, binData) => {
    return apiRequest(`/api/bins/${encodeURIComponent(binId)}`, {
        method: "PUT",
        body: JSON.stringify(binData),
    });
};

export const deleteBin = async (binId) => {
    return apiRequest(`/api/bins/${encodeURIComponent(binId)}`, {
        method: "DELETE",
    });
};

// =====================================================
// JOBS
// =====================================================

// Admin: get all jobs
export const getAllJobs = async () => {
    return apiRequest("/api/jobs");
};

// Worker: get jobs assigned to the logged-in worker
export const getMyJobs = async () => {
    return apiRequest("/api/jobs/my-jobs");
};

// Admin: get one job
export const getJobById = async (jobId) => {
    return apiRequest(`/api/jobs/${encodeURIComponent(jobId)}`);
};

// Admin: create a job
export const createJob = async (jobData) => {
    return apiRequest("/api/jobs", {
        method: "POST",
        body: JSON.stringify(jobData),
    });
};

// Admin: find nearby available workers
export const findNearbyWorkers = async (jobId) => {
    return apiRequest(
        `/api/jobs/${encodeURIComponent(jobId)}/nearby-workers`
    );
};

// Admin: automatically assign the nearest available worker
export const autoAssignWorker = async (jobId) => {
    return apiRequest(
        `/api/jobs/${encodeURIComponent(jobId)}/auto-assign`,
        { method: "PUT" }
    );
};

// Admin: manually assign a worker
export const assignWorker = async (jobId, workerData) => {
    return apiRequest(
        `/api/jobs/${encodeURIComponent(jobId)}/assign`,
        {
            method: "PUT",
            body: JSON.stringify(workerData),
        }
    );
};

// Worker: accept a job
export const acceptJob = async (jobId) => {
    return apiRequest(
        `/api/jobs/${encodeURIComponent(jobId)}/accept`,
        { method: "PUT" }
    );
};

// Worker: reject a job
export const rejectJob = async (jobId) => {
    return apiRequest(
        `/api/jobs/${encodeURIComponent(jobId)}/reject`,
        { method: "PUT" }
    );
};

// Worker: complete a job
export const completeJob = async (jobId) => {
    return apiRequest(
        `/api/jobs/${encodeURIComponent(jobId)}/complete`,
        { method: "PUT" }
    );
};

// =====================================================
// WORKERS (ADMIN)
// =====================================================

export const getAllWorkers = async () => {
    return apiRequest("/api/workers");
};

export const getWorkerById = async (workerId) => {
    return apiRequest(`/api/workers/${encodeURIComponent(workerId)}`);
};

export const updateWorkerStatus = async (workerId, statusData) => {
    return apiRequest(
        `/api/workers/${encodeURIComponent(workerId)}/status`,
        {
            method: "PUT",
            body: JSON.stringify(statusData),
        }
    );
};

export const deleteWorker = async (workerId) => {
    return apiRequest(
        `/api/workers/${encodeURIComponent(workerId)}`,
        { method: "DELETE" }
    );
};

// =====================================================
// NOTIFICATIONS
// =====================================================

export const getMyNotifications = async () => {
    return apiRequest("/api/notifications");
};

export const markNotificationRead = async (notificationId) => {
    return apiRequest(
        `/api/notifications/${encodeURIComponent(notificationId)}/read`,
        { method: "PUT" }
    );
};

export const markAllNotificationsRead = async () => {
    return apiRequest("/api/notifications/read-all", {
        method: "PUT",
    });
};

// =====================================================
// SENSOR DATA
// =====================================================

// Requires authentication according to your sensor route.
export const sendSensorData = async (sensorData) => {
    return apiRequest("/api/sensor-data", {
        method: "POST",
        body: JSON.stringify(sensorData),
    });
};
