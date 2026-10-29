import { useEffect, useState } from "react";
import { loginUser } from "./api/api";
import "./App.css";
import "./landing.css";

import AdminDashboard from "./components/AdminDashboard";
import WorkerDashboard from "./components/WorkerDashboard";
import Icon, { LogoMark } from "./components/ui/Icons";
import Reveal from "./components/ui/Reveal";

// ======================================================
// STATIC CONTENT (presentation only)
// ======================================================

const NAV_LINKS = [
    { href: "#home", label: "Home" },
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#roles", label: "Roles" },
    { href: "#contact", label: "Contact" },
];

const MARQUEE_ITEMS = [
    "Smart bins",
    "Live tracking",
    "Auto assignment",
    "Cleaner cities",
    "Faster pickups",
];

const FEATURES = [
    {
        icon: "bin",
        tone: "green",
        title: "Smart Bin Monitoring",
        text: "Track bin fill levels in real time and see which bins are normal, warning or critical.",
    },
    {
        icon: "pin",
        tone: "blue",
        title: "Worker Tracking",
        text: "View worker locations and availability on a live map.",
    },
    {
        icon: "bolt",
        tone: "yellow",
        title: "Automatic Assignment",
        text: "Assign jobs to the nearest available worker automatically.",
    },
    {
        icon: "map",
        tone: "teal",
        title: "Live Map",
        text: "Bins and workers together on one map, so every pickup is easy to follow.",
    },
    {
        icon: "bell",
        tone: "pink",
        title: "Job Notifications",
        text: "Workers get notified about new jobs and can accept or reject them.",
    },
    {
        icon: "route",
        tone: "purple",
        title: "Navigation & History",
        text: "Route guidance to the bin, plus a complete history of finished jobs.",
    },
];

const STEPS = [
    {
        no: "01",
        title: "Monitor",
        text: "Smart bins report how full they are, so nothing overflows unnoticed.",
    },
    {
        no: "02",
        title: "Assign",
        text: "When a bin needs emptying, the nearest available worker gets the job.",
    },
    {
        no: "03",
        title: "Collect",
        text: "Workers navigate to the bin, complete the job and the city stays clean.",
    },
];

const ROLES = [
    {
        icon: "shield",
        tone: "blue",
        title: "Administrator",
        points: [
            "Dashboard with bin, job and worker summaries",
            "Bin and worker management",
            "Job management and worker tracking",
            "Live map of bins and workers",
        ],
    },
    {
        icon: "user",
        tone: "green",
        title: "Worker",
        points: [
            "Personal dashboard with assigned jobs",
            "Accept or reject incoming jobs",
            "Turn-by-turn navigation to the bin",
            "Job history and profile",
        ],
    },
];

// ======================================================
// APP
// ======================================================

function App() {
    const [page, setPage] = useState("landing");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [user, setUser] = useState(null);

    const [menuOpen, setMenuOpen] = useState(false);

    // ==================================================
    // CHECK EXISTING LOGIN
    // ==================================================

    useEffect(() => {
        const savedToken = localStorage.getItem("smartbin_token");

        const savedUser = localStorage.getItem("smartbin_user");

        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);

                setUser(parsedUser);

                if (parsedUser.role === "Admin") {
                    setPage("admin-dashboard");
                } else if (parsedUser.role === "Worker") {
                    setPage("worker-dashboard");
                }
            } catch (error) {
                console.error("Invalid saved user data", error);

                localStorage.removeItem("smartbin_token");

                localStorage.removeItem("smartbin_user");
            }
        }
    }, []);

    // Close the mobile menu with Escape and when leaving the landing page
    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }

        const onKey = (event) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        };

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [menuOpen]);

    // Always start a new "page" at the top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

    // ==================================================
    // LOGIN
    // ==================================================

    const handleLogin = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        if (!email || !password) {
            setMessage("Please enter email and password.");

            setMessageType("error");

            return;
        }

        setLoading(true);

        try {
            const result = await loginUser(email, password);

            setLoading(false);

            if (!result.success) {
                setMessage(
                    result.data?.message ||
                    "Login failed. Please try again."
                );

                setMessageType("error");

                return;
            }

            const { token, user } = result.data;

            // Save authentication data
            localStorage.setItem("smartbin_token", token);

            localStorage.setItem("smartbin_user", JSON.stringify(user));

            setUser(user);

            console.log("Login response:", result.data);

            // ==========================================
            // ROLE BASED REDIRECTION
            // ==========================================

            if (user.role === "Admin") {
                setPage("admin-dashboard");
            } else if (user.role === "Worker") {
                setPage("worker-dashboard");
            } else {
                setMessage("Invalid user role.");

                setMessageType("error");
            }
        } catch (error) {
            setLoading(false);

            console.error("Login error:", error);

            setMessage("Unable to connect to the server.");

            setMessageType("error");
        }
    };

    // ==================================================
    // LOGOUT
    // ==================================================

    const handleLogout = () => {
        localStorage.removeItem("smartbin_token");

        localStorage.removeItem("smartbin_user");

        setUser(null);

        setEmail("");

        setPassword("");

        setMessage("");

        setMessageType("");

        setPage("landing");
    };

    // ==================================================
    // SHARED PIECES
    // ==================================================

    const goLogin = () => {
        setMenuOpen(false);
        setPage("login");
    };

    const Brand = ({ onClick }) => (
        <button
            type="button"
            className="sb-brand"
            onClick={onClick}
            aria-label="SmartBin-W home"
        >
            <LogoMark size={42} />

            <span className="sb-brand-text">
                <strong>SmartBin-W</strong>
                <small>Smart Waste Management</small>
            </span>
        </button>
    );

    // ==================================================
    // LANDING PAGE
    // ==================================================

    if (page === "landing") {
        const marquee = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

        return (
            <div className="smartbin-app sb-landing">
                <a className="sb-skip" href="#main">
                    Skip to content
                </a>

                {/* NAVBAR */}

                <header className="sb-nav">
                    <div className="sb-nav-inner">
                        <Brand
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                        />

                        <nav
                            id="sb-menu"
                            className={`sb-nav-links ${menuOpen ? "open" : ""}`}
                            aria-label="Primary"
                        >
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}

                            <button
                                type="button"
                                className="sb-btn sb-btn-yellow sb-nav-cta"
                                onClick={goLogin}
                            >
                                Login
                                <Icon name="arrow" size={18} />
                            </button>
                        </nav>

                        <button
                            type="button"
                            className="sb-menu-toggle"
                            aria-expanded={menuOpen}
                            aria-controls="sb-menu"
                            aria-label={menuOpen ? "Close menu" : "Open menu"}
                            onClick={() => setMenuOpen((open) => !open)}
                        >
                            <Icon name={menuOpen ? "close" : "menu"} size={24} />
                        </button>
                    </div>
                </header>

                <main id="main">
                    {/* HERO */}

                    <section id="home" className="sb-hero">
                        <div className="sb-hero-bg" aria-hidden="true">
                            <div className="sb-hero-photo" />
                            <div className="sb-blob sb-blob-blue" />
                            <div className="sb-blob sb-blob-green" />
                            <div className="sb-blob sb-blob-pink" />
                            <CityScene />
                        </div>

                        <div className="sb-hero-inner">
                            <p className="sb-eyebrow">
                                <span>01</span> — Smart waste management
                            </p>

                            <h1 className="sb-hero-title">
                                Smarter bins.
                                <br />
                                <span className="sb-hl">Cleaner cities.</span>
                            </h1>

                            <p className="sb-hero-text">
                                SmartBin helps manage waste collection
                                efficiently using smart bins, real-time
                                monitoring, worker tracking, and intelligent
                                job assignment.
                            </p>

                            <div className="sb-hero-actions">
                                <button
                                    type="button"
                                    className="sb-btn sb-btn-yellow sb-btn-lg"
                                    onClick={goLogin}
                                >
                                    Explore Dashboard
                                    <Icon name="arrow" size={20} />
                                </button>

                                <a
                                    className="sb-btn sb-btn-ghost sb-btn-lg"
                                    href="#features"
                                >
                                    Explore Smart Monitoring
                                </a>
                            </div>
                        </div>

                        {/* Floating preview cards (illustrative sample, not live data) */}

                        <div className="sb-hero-cards" aria-hidden="true">
                            <div className="sb-float sb-float-a sb-chip-card">
                                <div className="sb-chip-icon green">
                                    <Icon name="bin" size={22} />
                                </div>

                                <div className="sb-chip-body">
                                    <strong>Smart Bin</strong>
                                    <span>Real-time fill monitoring</span>

                                    <div className="sb-meter">
                                        <i />
                                    </div>

                                    <em>75% Full · sample preview</em>
                                </div>
                            </div>

                            <div className="sb-float sb-float-b sb-chip-card">
                                <div className="sb-chip-icon blue">
                                    <Icon name="pin" size={22} />
                                </div>

                                <div className="sb-chip-body">
                                    <strong>Worker Tracking</strong>
                                    <span>Monitor worker locations</span>
                                </div>

                                <span className="sb-live-dot" />
                            </div>

                            <div className="sb-float sb-float-c sb-chip-card">
                                <div className="sb-chip-icon yellow">
                                    <Icon name="bolt" size={22} />
                                </div>

                                <div className="sb-chip-body">
                                    <strong>Smart Assignment</strong>
                                    <span>Nearest available worker</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* MARQUEE */}

                    <div className="sb-marquee" aria-hidden="true">
                        <div className="sb-marquee-track">
                            {marquee.map((item, index) => (
                                <span key={`${item}-${index}`}>
                                    {item}
                                    <i>/</i>
                                </span>
                            ))}
                            {marquee.map((item, index) => (
                                <span key={`${item}-b-${index}`}>
                                    {item}
                                    <i>/</i>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* FEATURES */}

                    <section id="features" className="sb-section">
                        <div className="sb-container">
                            <Reveal>
                                <p className="sb-eyebrow">
                                    <span>02</span> — What it does
                                </p>

                                <h2 className="sb-title">
                                    Everything a clean city needs
                                </h2>
                            </Reveal>

                            <div className="sb-feature-grid">
                                {FEATURES.map((feature, index) => (
                                    <Reveal
                                        as="article"
                                        key={feature.title}
                                        delay={index * 70}
                                        className={`sb-feature tone-${feature.tone}`}
                                    >
                                        <div className="sb-feature-icon">
                                            <Icon name={feature.icon} size={26} />
                                        </div>

                                        <h3>{feature.title}</h3>

                                        <p>{feature.text}</p>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* HOW IT WORKS */}

                    <section id="how" className="sb-how">
                        <div className="sb-how-bg" aria-hidden="true">
                            <CityScene variant="band" />
                        </div>

                        <div className="sb-container sb-how-inner">
                            <Reveal>
                                <p className="sb-eyebrow">
                                    <span>03</span> — How it works
                                </p>

                                <h2 className="sb-title sb-title-xl">
                                    From full bin
                                    <br />
                                    to clean street
                                </h2>
                            </Reveal>

                            <ol className="sb-steps">
                                {STEPS.map((step, index) => (
                                    <Reveal
                                        as="li"
                                        key={step.no}
                                        delay={index * 90}
                                        className="sb-step"
                                    >
                                        <span className="sb-step-no">{step.no}</span>

                                        <h3>{step.title}</h3>

                                        <p>{step.text}</p>
                                    </Reveal>
                                ))}
                            </ol>
                        </div>
                    </section>

                    {/* ROLES */}

                    <section id="roles" className="sb-section sb-section-soft">
                        <div className="sb-container">
                            <Reveal>
                                <p className="sb-eyebrow">
                                    <span>04</span> — Built for two roles
                                </p>

                                <h2 className="sb-title">One system. Two workspaces.</h2>
                            </Reveal>

                            <div className="sb-role-grid">
                                {ROLES.map((role, index) => (
                                    <Reveal
                                        as="article"
                                        key={role.title}
                                        delay={index * 100}
                                        className={`sb-role tone-${role.tone}`}
                                    >
                                        <div className="sb-role-head">
                                            <div className="sb-feature-icon">
                                                <Icon name={role.icon} size={26} />
                                            </div>

                                            <h3>{role.title}</h3>
                                        </div>

                                        <ul>
                                            {role.points.map((point) => (
                                                <li key={point}>
                                                    <Icon name="check" size={18} stroke={3} />
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CONTACT / CTA */}

                    <section id="contact" className="sb-contact">
                        <div className="sb-container sb-contact-grid">
                            <Reveal>
                                <div className="sb-contact-top">
                                    <p className="sb-eyebrow">
                                        <span>05</span> — Contact
                                    </p>

                                    <span className="sb-contact-note">
                                        Accounts are issued by your administrator
                                    </span>
                                </div>

                                <h2 className="sb-title sb-title-xl">
                                    Get on
                                    <br />
                                    the route
                                </h2>

                                <p className="sb-contact-text">
                                    Admin and Worker accounts are created through
                                    the authorized system. Sign in to open your
                                    dashboard.
                                </p>
                            </Reveal>

                            <Reveal delay={120}>
                                <ul className="sb-info-list">
                                    <li>
                                        <Icon name="shield" size={22} />
                                        <span>Admins</span>
                                        <p>Monitor bins, workers and jobs</p>
                                    </li>

                                    <li>
                                        <Icon name="user" size={22} />
                                        <span>Workers</span>
                                        <p>Accept jobs and navigate to bins</p>
                                    </li>

                                    <li>
                                        <Icon name="lock" size={22} />
                                        <span>Access</span>
                                        <p>Secure email and password login</p>
                                    </li>
                                </ul>

                                <button
                                    type="button"
                                    className="sb-btn sb-btn-yellow sb-btn-block"
                                    onClick={goLogin}
                                >
                                    Sign in to SmartBin
                                    <Icon name="arrow" size={20} />
                                </button>
                            </Reveal>
                        </div>
                    </section>
                </main>

                {/* FOOTER */}

                <footer className="sb-footer">
                    <p>SmartBin © 2026 — Smart Waste Management</p>
                </footer>
            </div>
        );
    }

    // ==================================================
    // LOGIN PAGE
    // ==================================================

    if (page === "login") {
        return (
            <div className="smartbin-app sb-login-page">
                <header className="sb-nav">
                    <div className="sb-nav-inner">
                        <Brand onClick={() => setPage("landing")} />

                        <button
                            type="button"
                            className="sb-btn sb-btn-outline"
                            onClick={() => setPage("landing")}
                        >
                            ← Back
                        </button>
                    </div>
                </header>

                <main className="sb-login-main">
                    <section className="sb-login-side" aria-hidden="true">
                        <p className="sb-eyebrow dark">
                            <span>SmartBin-W</span> — Control room
                        </p>

                        <h2 className="sb-login-headline">
                            Back on
                            <br />
                            the route
                        </h2>

                        <div className="sb-login-scene">
                            <CityScene variant="band" />
                        </div>
                    </section>

                    <section className="sb-login-panel">
                        <div className="sb-login-card">
                            <div className="sb-login-icon">
                                <Icon name="lock" size={26} />
                            </div>

                            <h1 className="sb-login-title">Welcome Back</h1>

                            <p className="sb-login-description">
                                Login to access the SmartBin management system.
                            </p>

                            <form onSubmit={handleLogin} noValidate>
                                {/* EMAIL */}

                                <div className="sb-field">
                                    <label htmlFor="email">Email</label>

                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        disabled={loading}
                                    />
                                </div>

                                {/* PASSWORD */}

                                <div className="sb-field">
                                    <label htmlFor="password">Password</label>

                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        disabled={loading}
                                    />
                                </div>

                                {/* MESSAGE */}

                                <div aria-live="polite">
                                    {message && (
                                        <div
                                            className={`login-message ${messageType}`}
                                            role={
                                                messageType === "error"
                                                    ? "alert"
                                                    : undefined
                                            }
                                        >
                                            {message}
                                        </div>
                                    )}
                                </div>

                                {/* LOGIN BUTTON */}

                                <button
                                    type="submit"
                                    className="sb-btn sb-btn-yellow sb-btn-block sb-submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="sb-spinner" aria-hidden="true" />
                                            Logging in...
                                        </>
                                    ) : (
                                        <>
                                            Login
                                            <Icon name="arrow" size={20} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="switch-page">
                                Admin and Worker accounts are created through
                                the authorized system.
                            </p>
                        </div>
                    </section>
                </main>

                <footer className="sb-footer">
                    <p>SmartBin © 2026</p>
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

// ======================================================
// DECORATIVE ILLUSTRATION (pure SVG, no network assets)
// ======================================================

function CityScene({ variant = "hero" }) {
    return (
        <svg
            className={`sb-scene sb-scene-${variant}`}
            viewBox="0 0 1440 360"
            preserveAspectRatio="xMidYMax slice"
            focusable="false"
        >
            <g fill="#DBEAFE">
                <rect x="40" y="170" width="90" height="190" rx="6" />
                <rect x="150" y="120" width="70" height="240" rx="6" />
                <rect x="360" y="150" width="110" height="210" rx="6" />
                <rect x="640" y="110" width="80" height="250" rx="6" />
                <rect x="900" y="160" width="100" height="200" rx="6" />
                <rect x="1180" y="130" width="90" height="230" rx="6" />
            </g>
            <g fill="#FFF3B0">
                <rect x="240" y="190" width="100" height="170" rx="6" />
                <rect x="740" y="170" width="120" height="190" rx="6" />
                <rect x="1030" y="200" width="120" height="160" rx="6" />
                <rect x="1290" y="180" width="110" height="180" rx="6" />
            </g>
            <g fill="#BFDBFE" opacity=".9">
                <rect x="60" y="195" width="14" height="14" rx="2" />
                <rect x="90" y="195" width="14" height="14" rx="2" />
                <rect x="60" y="225" width="14" height="14" rx="2" />
                <rect x="170" y="150" width="14" height="14" rx="2" />
                <rect x="170" y="180" width="14" height="14" rx="2" />
                <rect x="380" y="180" width="14" height="14" rx="2" />
                <rect x="410" y="180" width="14" height="14" rx="2" />
                <rect x="660" y="140" width="14" height="14" rx="2" />
                <rect x="660" y="170" width="14" height="14" rx="2" />
                <rect x="920" y="190" width="14" height="14" rx="2" />
                <rect x="1200" y="160" width="14" height="14" rx="2" />
            </g>
            <g fill="#86EFAC">
                <circle cx="20" cy="310" r="34" />
                <circle cx="500" cy="318" r="30" />
                <circle cx="590" cy="322" r="24" />
                <circle cx="870" cy="316" r="30" />
                <circle cx="1170" cy="318" r="32" />
                <circle cx="1420" cy="312" r="34" />
            </g>
            <g fill="#4ADE80" opacity=".8">
                <circle cx="520" cy="300" r="20" />
                <circle cx="880" cy="302" r="18" />
            </g>
            <rect x="0" y="336" width="1440" height="24" fill="#F1F5F9" />
            <g>
                <g transform="translate(1020 276)">
                    <rect width="34" height="50" rx="5" fill="#2563EB" />
                    <rect x="-3" y="-6" width="40" height="9" rx="4" fill="#172033" />
                    <path d="M17 14l5 9h-10l5-9z" fill="#fff" />
                </g>
                <g transform="translate(1066 280)">
                    <rect width="30" height="46" rx="5" fill="#16A34A" />
                    <rect x="-3" y="-6" width="36" height="9" rx="4" fill="#172033" />
                </g>
                <g transform="translate(1108 284)">
                    <rect width="28" height="42" rx="5" fill="#FFD426" />
                    <rect x="-3" y="-6" width="34" height="9" rx="4" fill="#172033" />
                </g>
                <g
                    className="sb-signal"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                >
                    <path d="M1030 256a14 14 0 0 1 14 0" />
                    <path d="M1022 248a26 26 0 0 1 30 0" />
                </g>
            </g>
        </svg>
    );
}

export default App;
