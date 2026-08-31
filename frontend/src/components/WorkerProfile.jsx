import React, { useEffect, useState } from "react";

const WorkerProfile = ({
    onBack,
    onProfileUpdated,
}) => {

    // =====================================================
    // STATE
    // =====================================================

    const [worker, setWorker] = useState(null);

    const [name, setName] = useState("");

    const [availability, setAvailability] =
        useState("Available");

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [isEditing, setIsEditing] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    // =====================================================
    // GET LOGGED-IN WORKER
    // =====================================================

    useEffect(() => {

        const fetchWorkerProfile = async () => {

            try {

                setLoading(true);
                setError("");

                const token =
                    localStorage.getItem(
                        "smartbin_token"
                    );

                if (!token) {

                    setError(
                        "Authentication token not found. Please login again."
                    );

                    return;
                }


                const response =
                    await fetch(
                        "/api/auth/me",
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

                    throw new Error(
                        data.message ||
                        "Failed to load worker profile."
                    );

                }


                setWorker(data.user);

                setName(
                    data.user?.name || ""
                );

                setAvailability(
                    data.user?.availability ||
                    "Available"
                );


            } catch (err) {

                console.error(
                    "Worker profile loading error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load worker profile."
                );

            } finally {

                setLoading(false);

            }

        };


        fetchWorkerProfile();

    }, []);


    // =====================================================
    // START EDITING
    // =====================================================

    const handleEdit = () => {

        setName(
            worker?.name || ""
        );

        setAvailability(
            worker?.availability ||
            "Available"
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setIsEditing(true);

        setMessage("");
        setError("");

    };


    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const handleCancel = () => {

        setName(
            worker?.name || ""
        );

        setAvailability(
            worker?.availability ||
            "Available"
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setIsEditing(false);

        setMessage("");
        setError("");

    };


    // =====================================================
    // SAVE PROFILE
    // =====================================================

    const handleSave = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");


        // -------------------------------------------------
        // NAME VALIDATION
        // -------------------------------------------------

        if (!name.trim()) {

            setError(
                "Full name cannot be empty."
            );

            return;
        }


        // -------------------------------------------------
        // PASSWORD CHECK
        // -------------------------------------------------

        const changingPassword =
            Boolean(
                currentPassword ||
                newPassword ||
                confirmPassword
            );


        if (changingPassword) {

            if (!currentPassword) {

                setError(
                    "Please enter your current password."
                );

                return;
            }


            if (!newPassword) {

                setError(
                    "Please enter a new password."
                );

                return;
            }


            if (newPassword.length < 6) {

                setError(
                    "New password must be at least 6 characters."
                );

                return;
            }


            if (!confirmPassword) {

                setError(
                    "Please confirm your new password."
                );

                return;
            }


            if (
                newPassword !==
                confirmPassword
            ) {

                setError(
                    "New password and confirm password do not match."
                );

                return;
            }

        }


        try {

            setSaving(true);


            const token =
                localStorage.getItem(
                    "smartbin_token"
                );


            if (!token) {

                setError(
                    "Authentication token not found. Please login again."
                );

                return;
            }


            // =================================================
            // 1. UPDATE NAME
            // =================================================

            const profileResponse =
                await fetch(
                    "/api/auth/profile",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body: JSON.stringify({
                            name: name.trim(),
                        }),
                    }
                );


            const profileData =
                await profileResponse.json();


            if (!profileResponse.ok) {

                throw new Error(
                    profileData.message ||
                    "Failed to update profile."
                );

            }


            // =================================================
            // 2. UPDATE AVAILABILITY
            // =================================================

            let updatedWorker =
                profileData.user;


            if (
                availability !==
                worker?.availability
            ) {

                const availabilityResponse =
                    await fetch(
                        "/api/auth/availability",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body: JSON.stringify({
                                availability,
                            }),
                        }
                    );


                const availabilityData =
                    await availabilityResponse.json();


                if (!availabilityResponse.ok) {

                    throw new Error(
                        availabilityData.message ||
                        "Failed to update availability."
                    );

                }


                updatedWorker = {
                    ...updatedWorker,

                    availability:
                        availabilityData.availability,
                };

            }


            // =================================================
            // 3. CHANGE PASSWORD
            // =================================================

            if (changingPassword) {

                const passwordResponse =
                    await fetch(
                        "/api/auth/change-password",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body: JSON.stringify({
                                currentPassword,
                                newPassword,
                            }),
                        }
                    );


                const passwordData =
                    await passwordResponse.json();


                if (!passwordResponse.ok) {

                    throw new Error(
                        passwordData.message ||
                        "Failed to change password."
                    );

                }

            }


            // =================================================
            // 4. UPDATE LOCAL STATE
            // =================================================

            setWorker(updatedWorker);

            setName(
                updatedWorker?.name || ""
            );

            setAvailability(
                updatedWorker?.availability ||
                "Available"
            );


            // =================================================
            // 5. SEND UPDATED USER TO DASHBOARD
            // =================================================

            if (onProfileUpdated) {

                onProfileUpdated(
                    updatedWorker
                );

            }


            // =================================================
            // 6. CLEAR PASSWORD FIELDS
            // =================================================

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");


            // =================================================
            // 7. EXIT EDIT MODE
            // =================================================

            setIsEditing(false);


            // =================================================
            // 8. SUCCESS MESSAGE
            // =================================================

            setMessage(
                changingPassword
                    ? "Profile and password updated successfully."
                    : "Profile updated successfully."
            );


        } catch (err) {

            console.error(
                "Worker profile update error:",
                err
            );

            setError(
                err.message ||
                "Unable to update profile."
            );

        } finally {

            setSaving(false);

        }

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="worker-profile-page">

                <div className="worker-profile-loading">

                    <div className="worker-profile-loading-spinner">
                        ⟳
                    </div>

                    <p>
                        Loading your profile...
                    </p>

                </div>

            </div>

        );

    }


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="worker-profile-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="worker-profile-header">

                <button
                    type="button"
                    className="worker-profile-back-button"
                    onClick={onBack}
                >
                    ← Back to Dashboard
                </button>


                <h2>
                    {isEditing
                        ? "Edit Profile"
                        : "Worker Profile"}
                </h2>


                <p>
                    {isEditing
                        ? "Update your account information and security settings."
                        : "Manage your account information and security settings."}
                </p>

            </div>


            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {message && (

                <div className="worker-profile-success">

                    <span>✓</span>

                    <span>
                        {message}
                    </span>

                </div>

            )}


            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (

                <div className="worker-profile-error">

                    <span>⚠️</span>

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {/* =================================================
                MAIN CARD
            ================================================= */}

            <div className="worker-profile-card">


                {/* =================================================
                    VIEW MODE
                ================================================= */}

                {!isEditing && (

                    <div className="worker-profile-view">


                        {/* =================================================
                            ACCOUNT INFORMATION
                        ================================================= */}

                        <div className="worker-profile-section">

                            <div className="worker-profile-section-title">

                                <h3>
                                    Account Information
                                </h3>

                                <p>
                                    Your registered worker account details.
                                </p>

                            </div>


                            <div className="worker-profile-details">


                                {/* FULL NAME */}

                                <div className="worker-profile-detail">

                                    <span className="worker-profile-detail-icon">
                                        👤
                                    </span>

                                    <div>

                                        <label>
                                            Full Name
                                        </label>

                                        <strong>
                                            {worker?.name ||
                                                "Not available"}
                                        </strong>

                                    </div>

                                </div>


                                {/* EMAIL */}

                                <div className="worker-profile-detail">

                                    <span className="worker-profile-detail-icon">
                                        ✉️
                                    </span>

                                    <div>

                                        <label>
                                            Email Address
                                        </label>

                                        <strong>
                                            {worker?.email ||
                                                "Not available"}
                                        </strong>

                                        <small>
                                            🔒 Email address cannot be changed.
                                        </small>

                                    </div>

                                </div>


                                {/* PHONE */}

                                <div className="worker-profile-detail">

                                    <span className="worker-profile-detail-icon">
                                        📱
                                    </span>

                                    <div>

                                        <label>
                                            Phone Number
                                        </label>

                                        <strong>
                                            {worker?.phone ||
                                                "Not provided"}
                                        </strong>

                                        <small>
                                            🔒 Phone number cannot be changed.
                                        </small>

                                    </div>

                                </div>


                                {/* ROLE */}

                                <div className="worker-profile-detail">

                                    <span className="worker-profile-detail-icon">
                                        👷
                                    </span>

                                    <div>

                                        <label>
                                            Account Role
                                        </label>

                                        <strong>
                                            {worker?.role ||
                                                "Worker"}
                                        </strong>

                                        <small>
                                            🔒 Your administrator assigned role cannot be changed.
                                        </small>

                                    </div>

                                </div>


                                {/* AVAILABILITY */}

                                <div className="worker-profile-detail">

                                    <span className="worker-profile-detail-icon">
                                        {worker?.availability === "Busy"
                                            ? "🔴"
                                            : "🟢"}
                                    </span>

                                    <div>

                                        <label>
                                            Availability
                                        </label>

                                        <strong>
                                            {worker?.availability ||
                                                "Available"}
                                        </strong>

                                    </div>

                                </div>


                                {/* ACCOUNT STATUS */}

                                <div className="worker-profile-detail">

                                    <span className="worker-profile-detail-icon">
                                        ✓
                                    </span>

                                    <div>

                                        <label>
                                            Account Status
                                        </label>

                                        <strong>
                                            {worker?.isActive === false
                                                ? "Inactive"
                                                : "Active"}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                EDIT PROFILE BUTTON
                            ================================================= */}

                            <div className="worker-profile-edit-action">

                                <button
                                    type="button"
                                    className="worker-profile-edit-button"
                                    onClick={handleEdit}
                                >
                                    ✏️ Edit Profile
                                </button>

                            </div>

                        </div>

                    </div>

                )}


                {/* =================================================
                    EDIT MODE
                ================================================= */}

                {isEditing && (

                    <form
                        className="worker-profile-edit-form"
                        onSubmit={handleSave}
                    >


                        {/* =================================================
                            PERSONAL INFORMATION
                        ================================================= */}

                        <div className="worker-profile-section">

                            <div className="worker-profile-section-title">

                                <h3>
                                    Personal Information
                                </h3>

                                <p>
                                    Update the information associated with your account.
                                </p>

                            </div>


                            <div className="worker-profile-form-grid">


                                {/* NAME */}

                                <div className="worker-profile-form-field">

                                    <label>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(event) =>
                                            setName(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter your full name"
                                        disabled={saving}
                                    />

                                    <small>
                                        This name will be displayed throughout the worker dashboard.
                                    </small>

                                </div>


                                {/* EMAIL */}

                                <div className="worker-profile-form-field">

                                    <label>
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        value={
                                            worker?.email ||
                                            ""
                                        }
                                        disabled
                                    />

                                    <small>
                                        Email address cannot be changed.
                                    </small>

                                </div>


                                {/* PHONE */}

                                <div className="worker-profile-form-field">

                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        type="tel"
                                        value={
                                            worker?.phone ||
                                            "Not provided"
                                        }
                                        disabled
                                    />

                                    <small>
                                        Phone number cannot be changed.
                                    </small>

                                </div>


                                {/* ROLE */}

                                <div className="worker-profile-form-field">

                                    <label>
                                        Account Role
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            worker?.role ||
                                            "Worker"
                                        }
                                        disabled
                                    />

                                    <small>
                                        Your administrator role cannot be changed here.
                                    </small>

                                </div>


                                {/* AVAILABILITY */}

                                <div className="worker-profile-form-field">

                                    <label>
                                        Availability
                                    </label>

                                    <select
                                        value={availability}
                                        onChange={(event) =>
                                            setAvailability(
                                                event.target.value
                                            )
                                        }
                                        disabled={saving}
                                    >

                                        <option value="Available">
                                            Available
                                        </option>

                                        <option value="Busy">
                                            Busy
                                        </option>

                                    </select>

                                    <small>
                                        Set your current work availability.
                                    </small>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            CHANGE PASSWORD
                        ================================================= */}

                        <div className="worker-profile-password-section">

                            <div className="worker-profile-password-heading">

                                <div className="worker-profile-password-icon">
                                    🔐
                                </div>

                                <div>

                                    <h3>
                                        Change Password
                                    </h3>

                                    <p>
                                        Keep your account secure by using a strong password.
                                    </p>

                                </div>

                            </div>


                            <div className="worker-profile-password-grid">


                                {/* CURRENT PASSWORD */}

                                <div className="worker-profile-form-field">

                                    <label>
                                        Current Password
                                    </label>

                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(event) =>
                                            setCurrentPassword(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter current password"
                                        disabled={saving}
                                    />

                                </div>


                                {/* NEW PASSWORD */}

                                <div className="worker-profile-form-field">

                                    <label>
                                        New Password
                                    </label>

                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(event) =>
                                            setNewPassword(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter new password"
                                        disabled={saving}
                                    />

                                    <small>
                                        Minimum 6 characters.
                                    </small>

                                </div>


                                {/* CONFIRM PASSWORD */}

                                <div className="worker-profile-form-field">

                                    <label>
                                        Confirm New Password
                                    </label>

                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Confirm new password"
                                        disabled={saving}
                                    />

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            FORM BUTTONS
                        ================================================= */}

                        <div className="worker-profile-form-actions">

                            <button
                                type="button"
                                className="worker-profile-cancel-button"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                className="worker-profile-save-button"
                                disabled={saving}
                            >

                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>

                        </div>

                    </form>

                )}

            </div>

        </div>

    );

};

export default WorkerProfile;