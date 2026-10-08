import React, { useEffect, useState } from "react";
import "./AdminProfile.css";

const AdminProfile = ({
    onBack,
    onProfileUpdated,
}) => {

    // =====================================================
    // STATE
    // =====================================================

    const [admin, setAdmin] = useState(null);

    const [name, setName] = useState("");

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
    // GET LOGGED-IN ADMIN
    // =====================================================

    useEffect(() => {

        const fetchAdminProfile = async () => {

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
                        "Failed to load profile"
                    );

                }


                setAdmin(data.user);

                setName(
                    data.user?.name || ""
                );


            } catch (err) {

                console.error(
                    "Profile loading error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load profile"
                );

            } finally {

                setLoading(false);

            }

        };


        fetchAdminProfile();

    }, []);


    // =====================================================
    // START EDITING
    // =====================================================

    const handleEdit = () => {

        setIsEditing(true);

        setMessage("");
        setError("");

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

    };


    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const handleCancel = () => {

        setName(
            admin?.name || ""
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

    if (!name.trim()) {
        setError("Full name cannot be empty.");
        return;
    }

    const changingPassword =
        currentPassword ||
        newPassword ||
        confirmPassword;

    if (changingPassword) {

        if (!currentPassword) {
            setError("Please enter your current password.");
            return;
        }

        if (!newPassword) {
            setError("Please enter a new password.");
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

        if (newPassword !== confirmPassword) {
            setError(
                "New password and confirm password do not match."
            );
            return;
        }
    }

    try {

        setSaving(true);

        const token =
            localStorage.getItem("smartbin_token");

        if (!token) {
            setError(
                "Authentication token not found. Please login again."
            );
            return;
        }


        // =================================================
        // 1. UPDATE NAME
        // =================================================

        const profileResponse = await fetch(
            "/api/auth/profile",
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
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
        // 2. UPDATE PASSWORD
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
        // 3. UPDATE LOCAL ADMIN DATA
        // =================================================

        const updatedAdmin =
            profileData.user;

        setAdmin(updatedAdmin);

        setName(
            updatedAdmin?.name || ""
        );


        // Send updated user to AdminDashboard
        if (onProfileUpdated) {
            onProfileUpdated(updatedAdmin);
        }


        // =================================================
        // 4. CLEAR PASSWORD FIELDS
        // =================================================

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");


        // =================================================
        // 5. EXIT EDIT MODE
        // =================================================

        setIsEditing(false);

        setMessage(
            changingPassword
                ? "Profile and password updated successfully."
                : "Profile updated successfully."
        );


    } catch (err) {

        console.error(
            "Profile update error:",
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

            <div className="admin-profile-page">

                <div className="admin-profile-loading">

                    <div className="admin-profile-loading-spinner">
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

        <div className="admin-profile-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="admin-profile-header">

                <button
                    type="button"
                    className="admin-profile-back-button"
                    onClick={onBack}
                >
                    ← Back to Dashboard
                </button>


                <div className="admin-profile-header-content">

                    <h2>
                        {isEditing
                            ? "Edit Profile"
                            : "Admin Profile"}
                    </h2>

                    <p>
                        {isEditing
                            ? "Update your account information and security settings."
                            : "Manage your account information and security settings."}
                    </p>

                </div>

            </div>


            {/* =================================================
                MESSAGE
            ================================================= */}

            {error && (

                <div className="admin-profile-error">

                    <span>
                        ⚠️
                    </span>

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {message && (

                <div className="admin-profile-success">

                    <span>
                        ✓
                    </span>

                    <span>
                        {message}
                    </span>

                </div>

            )}


            {/* =================================================
                MAIN PROFILE CARD
            ================================================= */}

            <div className="admin-profile-card">


                {/* =================================================
                    PROFILE IDENTITY
                ================================================= */}

                <div className="admin-profile-identity">

                    <div className="admin-profile-avatar-large">

                        {(
                            admin?.name ||
                            "A"
                        )
                            .charAt(0)
                            .toUpperCase()}

                    </div>


                    <div className="admin-profile-identity-info">

                        <h3>
                            {admin?.name ||
                                "Administrator"}
                        </h3>

                        <p>
                            Administrator
                        </p>

                        <span className="admin-profile-status-badge">
                            ● Active Account
                        </span>

                    </div>

                </div>


                {/* =================================================
                    VIEW MODE
                ================================================= */}

                {!isEditing && (

                    <div className="admin-profile-view">


                        {/* -----------------------------------------
                            ACCOUNT INFORMATION
                        ----------------------------------------- */}

                        <div className="admin-profile-section">

                            <div className="admin-profile-section-title">

                                <div>

                                    <h3>
                                        Account Information
                                    </h3>

                                    <p>
                                        Your registered account details.
                                    </p>

                                </div>

                            </div>


                            <div className="admin-profile-details">


                                {/* FULL NAME */}

                                <div className="admin-profile-detail">

                                    <span className="admin-profile-detail-icon">
                                        👤
                                    </span>

                                    <div>

                                        <label>
                                            Full Name
                                        </label>

                                        <strong>
                                            {admin?.name ||
                                                "Not available"}
                                        </strong>

                                    </div>

                                </div>


                                {/* EMAIL */}

                                <div className="admin-profile-detail">

                                    <span className="admin-profile-detail-icon">
                                        ✉️
                                    </span>

                                    <div>

                                        <label>
                                            Email Address
                                        </label>

                                        <strong>
                                            {admin?.email ||
                                                "Not available"}
                                        </strong>

                                    </div>

                                    

                                </div>


                                {/* PHONE */}

                                <div className="admin-profile-detail">

                                    <span className="admin-profile-detail-icon">
                                        📱
                                    </span>

                                    <div>

                                        <label>
                                            Phone Number
                                        </label>

                                        <strong>
                                            {admin?.phone ||
                                                "Not provided"}
                                        </strong>

                                    </div>

                                    

                                </div>


                                {/* ROLE */}

                                <div className="admin-profile-detail">

                                    <span className="admin-profile-detail-icon">
                                        🛡️
                                    </span>

                                    <div>

                                        <label>
                                            Account Role
                                        </label>

                                        <strong>
                                            {admin?.role ||
                                                "Administrator"}
                                        </strong>

                                    </div>

                                </div>


                                {/* ACCOUNT STATUS */}

                                <div className="admin-profile-detail">

                                    <span className="admin-profile-detail-icon">
                                        ✓
                                    </span>

                                    <div>

                                        <label>
                                            Account Status
                                        </label>

                                        <strong>
                                            {admin?.isActive === false
                                                ? "Inactive"
                                                : "Active"}
                                        </strong>

                                    </div>

                                </div>


                            </div>


                            {/* -----------------------------------------
                                EDIT BUTTON
                            ----------------------------------------- */}

                            <div className="admin-profile-edit-container">

                                <button
                                    type="button"
                                    className="admin-profile-edit-main-button"
                                    onClick={handleEdit}
                                >
                                    Edit Profile
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
                        className="admin-profile-edit-form"
                        onSubmit={handleSave}
                    >


                        {/* =================================================
                            PERSONAL INFORMATION
                        ================================================= */}

                        <div className="admin-profile-section">

                            <div className="admin-profile-section-title">

                                <div>

                                    <h3>
                                        Personal Information
                                    </h3>

                                    <p>
                                        Update the information associated with your account.
                                    </p>

                                </div>

                            </div>


                            <div className="admin-profile-form-grid">


                                {/* NAME */}

                                <div className="admin-profile-form-field">

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
                                        This name will be displayed throughout the admin dashboard.
                                    </small>

                                </div>


                                {/* EMAIL */}

                                <div className="admin-profile-form-field">

                                    <label>
                                        Email Address
                                        
                                    </label>

                                    <input
                                        type="email"
                                        value={
                                            admin?.email ||
                                            ""
                                        }
                                        disabled
                                    />

                                    <small>
                                        Email address cannot be changed.
                                    </small>

                                </div>


                                {/* PHONE */}

                                <div className="admin-profile-form-field">

                                    <label>
                                        Phone Number
                                        
                                    </label>

                                    <input
                                        type="tel"
                                        value={
                                            admin?.phone ||
                                            "Not provided"
                                        }
                                        disabled
                                    />

                                    <small>
                                        Phone number cannot be changed.
                                    </small>

                                </div>


                                {/* ROLE */}

                                <div className="admin-profile-form-field">

                                    <label>
                                        Account Role
                                        
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            admin?.role ||
                                            "Administrator"
                                        }
                                        disabled
                                    />

                                    <small>
                                        Your administrator role cannot be changed here.
                                    </small>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            PASSWORD
                        ================================================= */}

                        <div className="admin-profile-password-section">

                            <div className="admin-profile-password-heading">

                                <div className="admin-profile-password-icon">
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


                            <div className="admin-profile-password-grid">


                                {/* CURRENT PASSWORD */}

                                <div className="admin-profile-form-field">

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
                                        autoComplete="current-password"
                                    />

                                </div>


                                {/* NEW PASSWORD */}

                                <div className="admin-profile-form-field">

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
                                        autoComplete="new-password"
                                    />

                                    <small>
                                        Minimum 6 characters.
                                    </small>

                                </div>


                                {/* CONFIRM PASSWORD */}

                                <div className="admin-profile-form-field">

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
                                        autoComplete="new-password"
                                    />

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            FORM ACTIONS
                        ================================================= */}

                        <div className="admin-profile-form-actions">

                            <button
                                type="button"
                                className="admin-profile-cancel-button"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                className="admin-profile-save-button"
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


export default AdminProfile;