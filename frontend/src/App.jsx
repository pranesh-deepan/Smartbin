import { useEffect, useState } from "react";
import { loginUser } from "./api/api";
import "./App.css";

import AdminDashboard from "./components/AdminDashboard";
import WorkerDashboard from "./components/WorkerDashboard";

function App() {
    const [page, setPage] = useState("landing");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [user, setUser] = useState(null);


    // ==================================================
    // CHECK EXISTING LOGIN
    // ==================================================

    useEffect(() => {
        const savedToken =
            localStorage.getItem("smartbin_token");

        const savedUser =
            localStorage.getItem("smartbin_user");

        if (savedToken && savedUser) {
            try {
                const parsedUser =
                    JSON.parse(savedUser);

                setUser(parsedUser);

                if (parsedUser.role === "Admin") {
                    setPage("admin-dashboard");
                } else if (
                    parsedUser.role === "Worker"
                ) {
                    setPage("worker-dashboard");
                }

            } catch (error) {
                console.error(
                    "Invalid saved user data",
                    error
                );

                localStorage.removeItem(
                    "smartbin_token"
                );

                localStorage.removeItem(
                    "smartbin_user"
                );
            }
        }
    }, []);


    // ==================================================
    // LOGIN
    // ==================================================

    const handleLogin = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        if (!email || !password) {
            setMessage(
                "Please enter email and password."
            );

            setMessageType("error");

            return;
        }

        setLoading(true);

        try {
            const result =
                await loginUser(email, password);

            setLoading(false);

            if (!result.success) {
                setMessage(
                    result.data?.message ||
                    "Login failed. Please try again."
                );

                setMessageType("error");

                return;
            }

            const { token, user } =
                result.data;

            // Save authentication data
            localStorage.setItem(
                "smartbin_token",
                token
            );

            localStorage.setItem(
                "smartbin_user",
                JSON.stringify(user)
            );

            setUser(user);

            console.log(
                "Login response:",
                result.data
            );


            // ==========================================
            // ROLE BASED REDIRECTION
            // ==========================================

            if (user.role === "Admin") {

                setPage("admin-dashboard");

            } else if (
                user.role === "Worker"
            ) {

                setPage("worker-dashboard");

            } else {

                setMessage(
                    "Invalid user role."
                );

                setMessageType("error");
            }

        } catch (error) {

            setLoading(false);

            console.error(
                "Login error:",
                error
            );

            setMessage(
                "Unable to connect to the server."
            );

            setMessageType("error");
        }
    };


    // ==================================================
    // LOGOUT
    // ==================================================

    const handleLogout = () => {

        localStorage.removeItem(
            "smartbin_token"
        );

        localStorage.removeItem(
            "smartbin_user"
        );

        setUser(null);

        setEmail("");

        setPassword("");

        setMessage("");

        setMessageType("");

        setPage("landing");
    };


    // ==================================================
    // LANDING PAGE
    // ==================================================

    if (page === "landing") {

        return (
            <div className="smartbin-app">

                {/* NAVBAR */}

                <header className="landing-navbar">

                    <div className="brand">

                        <div className="brand-icon">
                            ♻
                        </div>

                        <div>

                            <h1>
                                SmartBin
                            </h1>

                            <span>
                                Smart Waste Management
                            </span>

                        </div>

                    </div>


                    <div className="nav-buttons">

                        <button
                            className="nav-login"
                            onClick={() =>
                                setPage("login")
                            }
                        >
                            Login
                        </button>

                    </div>

                </header>


                {/* MAIN LANDING */}

                <main className="landing-main">

                    <section className="landing-content">

                        <div className="landing-badge">
                            ♻ Smart Waste Management System
                        </div>

                        <h2>

                            Smarter Waste.

                            <br />

                            <span>
                                Cleaner Cities.
                            </span>

                        </h2>

                        <p>
                            SmartBin helps manage waste
                            collection efficiently using
                            smart bins, real-time monitoring,
                            worker tracking, and intelligent
                            job assignment.
                        </p>


                        <div className="landing-actions">

                            <button
                                className="primary-button"
                                onClick={() =>
                                    setPage("login")
                                }
                            >
                                Get Started
                            </button>

                        </div>

                    </section>


                    {/* LANDING VISUAL */}

                    <section className="landing-visual">

                        <div className="bin-card">

                            <div className="bin-icon">
                                🗑️
                            </div>

                            <div className="bin-info">

                                <h3>
                                    Smart Bin
                                </h3>

                                <p>
                                    Real-time fill monitoring
                                </p>

                                <div className="fill-bar">

                                    <div className="fill-progress"></div>

                                </div>

                                <span>
                                    75% Full
                                </span>

                            </div>

                        </div>


                        <div className="feature-card worker-card">

                            <div className="feature-icon">
                                👷
                            </div>

                            <div>

                                <strong>
                                    Worker Tracking
                                </strong>

                                <p>
                                    Monitor worker locations
                                </p>

                            </div>

                            <span className="online-dot"></span>

                        </div>


                        <div className="feature-card job-card">

                            <div className="feature-icon">
                                📋
                            </div>

                            <div>

                                <strong>
                                    Smart Assignment
                                </strong>

                                <p>
                                    Nearest available worker
                                </p>

                            </div>

                        </div>

                    </section>

                </main>


                {/* FEATURES */}

                <section className="landing-features">

                    <div>

                        <span>
                            🗑️
                        </span>

                        <h3>
                            Smart Bin Monitoring
                        </h3>

                        <p>
                            Track bin fill levels in real time.
                        </p>

                    </div>


                    <div>

                        <span>
                            📍
                        </span>

                        <h3>
                            Worker Tracking
                        </h3>

                        <p>
                            View worker locations and availability.
                        </p>

                    </div>


                    <div>

                        <span>
                            🤖
                        </span>

                        <h3>
                            Automatic Assignment
                        </h3>

                        <p>
                            Assign jobs to the nearest available worker.
                        </p>

                    </div>

                </section>


                {/* FOOTER */}

                <footer>

                    <p>
                        SmartBin © 2026 — Smart Waste Management
                    </p>

                </footer>

            </div>
        );
    }


    // ==================================================
    // LOGIN PAGE
    // ==================================================

    if (page === "login") {

        return (
            <div className="smartbin-app">

                <header className="navbar">

                    <div
                        className="brand clickable"
                        onClick={() =>
                            setPage("landing")
                        }
                    >

                        <div className="brand-icon">
                            ♻
                        </div>

                        <div>

                            <h1>
                                SmartBin
                            </h1>

                            <span>
                                Smart Waste Management
                            </span>

                        </div>

                    </div>


                    <button
                        className="back-button"
                        onClick={() =>
                            setPage("landing")
                        }
                    >
                        ← Back
                    </button>

                </header>


                <main className="login-section">

                    <div className="login-card">

                        <div className="login-icon">
                            🔐
                        </div>

                        <h2>
                            Welcome Back
                        </h2>

                        <p className="login-description">
                            Login to access the SmartBin
                            management system.
                        </p>


                        <form
                            onSubmit={handleLogin}
                        >

                            {/* EMAIL */}

                            <div className="form-group">

                                <label htmlFor="email">
                                    Email
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(
                                            event.target.value
                                        )
                                    }
                                    disabled={loading}
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="form-group">

                                <label htmlFor="password">
                                    Password
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    disabled={loading}
                                />

                            </div>


                            {/* MESSAGE */}

                            {message && (

                                <div
                                    className={`login-message ${messageType}`}
                                >
                                    {message}
                                </div>

                            )}


                            {/* LOGIN BUTTON */}

                            <button
                                type="submit"
                                className="login-button"
                                disabled={loading}
                            >

                                {loading
                                    ? "Logging in..."
                                    : "Login"}

                            </button>

                        </form>


                        <p className="switch-page">

                            Admin and Worker accounts are
                            created through the authorized
                            system.

                        </p>

                    </div>

                </main>


                <footer>

                    <p>
                        SmartBin © 2026
                    </p>

                </footer>

            </div>
        );
    }


    // ==================================================
    // ADMIN DASHBOARD
    // ==================================================

    if (page === "admin-dashboard") {

        return (
            <AdminDashboard
    user={user}
    onLogout={handleLogout}
    onUserUpdated={(updatedUser) => {
        setUser(updatedUser);

        localStorage.setItem(
            "smartbin_user",
            JSON.stringify(updatedUser)
        );
    }}
/>
        );
    }


    // ==================================================
    // WORKER DASHBOARD
    // ==================================================

    if (page === "worker-dashboard") {

        return (
            <WorkerDashboard
    user={user}
    onLogout={handleLogout}
    onUserUpdated={(updatedUser) => {

        setUser(updatedUser);

        localStorage.setItem(
            "smartbin_user",
            JSON.stringify(updatedUser)
        );

    }}
/>
        );
    }


    // ==================================================
    // FALLBACK
    // ==================================================

    return null;
}

export default App;