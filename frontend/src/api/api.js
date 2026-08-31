const API_BASE_URL = "http://localhost:5000";

export const apiRequest = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });

        const data = await response.json();

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

export const loginUser = async (email, password) => {
    return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password,
        }),
    });
};