import React, { useEffect, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* =====================================================
   WORKER MARKER ICON
===================================================== */

const workerIcon = L.divIcon({
    className: "worker-map-marker",
    html: `
        <div class="worker-marker-wrapper">
            <div class="worker-marker">
                🚛
            </div>
            <div class="worker-marker-pulse"></div>
        </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
});

/* =====================================================
   ANIMATED WORKER MARKER
===================================================== */

const AnimatedWorkerMarker = ({
    position,
    workerName,
}) => {
    const markerRef = useRef(null);

    const previousPosition = useRef(position);

    useEffect(() => {
        if (!position || !markerRef.current) {
            return;
        }

        const marker = markerRef.current;

        const start = previousPosition.current || position;
        const end = position;

        const startLat = start[0];
        const startLng = start[1];

        const endLat = end[0];
        const endLng = end[1];

        const duration = 4500;

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;

            const progress = Math.min(
                elapsed / duration,
                1
            );

            /*
             * Ease-in-out animation.
             * This prevents the marker from looking
             * like it is jumping between GPS points.
             */
            const eased =
                progress < 0.5
                    ? 2 * progress * progress
                    : 1 -
                      Math.pow(
                          -2 * progress + 2,
                          2
                      ) / 2;

            const currentLat =
                startLat +
                (endLat - startLat) * eased;

            const currentLng =
                startLng +
                (endLng - startLng) * eased;

            marker.setLatLng([
                currentLat,
                currentLng,
            ]);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);

        previousPosition.current = position;

    }, [position]);

    return (
        <Marker
            position={position}
            icon={workerIcon}
            ref={markerRef}
        >
            <Popup>
                <strong>
                    {workerName || "Worker"}
                </strong>
                <br />
                Live GPS Location
            </Popup>
        </Marker>
    );
};

/* =====================================================
   MAP FOLLOW COMPONENT
===================================================== */

const MapFollower = ({ position }) => {
    const map = useMap();

    useEffect(() => {
        if (!position) {
            return;
        }

        map.setView(
            position,
            map.getZoom() < 15
                ? 15
                : map.getZoom(),
            {
                animate: true,
                duration: 1,
            }
        );

    }, [position, map]);

    return null;
};

/* =====================================================
   WORKER TRACKING
===================================================== */

const WorkerTracking = ({ job, onBack }) => {

    const [location, setLocation] = useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [lastUpdated, setLastUpdated] =
        useState(null);

    const [gpsActive, setGpsActive] =
        useState(false);

    const worker = job?.worker;

    /* =================================================
       FETCH WORKER LOCATION
    ================================================= */

    const fetchWorkerLocation = async () => {

        try {

            const token = localStorage.getItem("smartbin_token");

            if (!token) {
                setError(
                    "Authentication token not found"
                );

                setGpsActive(false);

                return;
            }

            if (!worker?._id) {

                setError(
                    "Worker information not available"
                );

                setGpsActive(false);

                return;
            }

            const response =
                await fetch(
                    `http://localhost:5000/api/auth/worker/${worker._id}/location`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },
                    }
                );

            const data =
                await response.json();
            console.log("WORKER LOCATION API RESPONSE:", data);

            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    "Unable to fetch worker location"
                );
            }

            /*
             * Expected backend structure:
             *
             * {
             *   success: true,
             *   location: {
             *      latitude,
             *      longitude,
             *      lastUpdated
             *   }
             * }
             */

            const newLocation = data?.worker?.currentLocation;

            if (
                !newLocation ||
                newLocation.latitude ===
                    undefined ||
                newLocation.longitude ===
                    undefined
            ) {

                setLocation(null);

                setGpsActive(false);

                setError(
                    "Worker GPS location is not available yet."
                );

                return;
            }

            const latitude =
                Number(
                    newLocation.latitude
                );

            const longitude =
                Number(
                    newLocation.longitude
                );

            if (
                Number.isNaN(latitude) ||
                Number.isNaN(longitude)
            ) {

                setLocation(null);

                setGpsActive(false);

                setError(
                    "Invalid GPS coordinates received."
                );

                return;
            }

            setLocation({
                latitude,
                longitude,
                lastUpdated:
                    newLocation.lastUpdated ||
                    new Date().toISOString(),
            });

            setLastUpdated(
                newLocation.lastUpdated ||
                new Date().toISOString()
            );

            setGpsActive(true);

            setError("");

        } catch (err) {

            console.error(
                "Worker tracking error:",
                err
            );

            setGpsActive(false);

            setError(
                err.message ||
                "Unable to fetch worker location"
            );

        } finally {

            setLoading(false);

        }
    };

    /* =================================================
       INITIAL FETCH + EVERY 5 SECONDS
    ================================================= */

    useEffect(() => {

        if (!worker?._id) {

            setLoading(false);

            setError(
                "Worker information not available"
            );

            return;
        }

        /*
         * Fetch immediately when tracking starts.
         */
        fetchWorkerLocation();

        /*
         * Then refresh every 5 seconds.
         */
        const interval =
            setInterval(() => {

                fetchWorkerLocation();

            }, 5000);

        /*
         * Stop polling when component unmounts
         * or another worker is selected.
         */
        return () => {

            clearInterval(interval);

        };

    }, [worker?._id]);

    /* =================================================
       MAP POSITION
    ================================================= */

    const mapPosition = location
        ? [
              location.latitude,
              location.longitude,
          ]
        : null;

    /* =================================================
       WORKER NAME
    ================================================= */

    const workerName =
        worker?.name ||
        job?.workerName ||
        "Unknown Worker";

    /* =================================================
       UI
    ================================================= */

    return (
        <div className="worker-tracking-page">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="worker-tracking-header">

                <div>

                    <button
                        className="tracking-back-button"
                        onClick={onBack}
                    >
                        ← Back to Jobs
                    </button>

                </div>

            </div>



            {/* =========================================
                MAP CARD
            ========================================= */}

            <div className="tracking-main-card">

                <div className="tracking-map-header">

                    <div>

                        <h3>
                            Worker Location
                        </h3>

                        <p>
                            Live GPS tracking
                        </p>

                    </div>


                    <div className="tracking-live-indicator">

                        <span
                            className={
                                gpsActive
                                    ? "live-dot"
                                    : "live-dot offline"
                            }
                        ></span>

                        {gpsActive
                            ? "LIVE"
                            : "OFFLINE"}

                    </div>

                </div>


                {/* =====================================
                    LOADING
                ===================================== */}

                {loading && (

                    <div className="tracking-map tracking-map-loading">

                        <div className="tracking-message">

                            <span>
                                📍
                            </span>

                            <p>
                                Loading worker location...
                            </p>

                        </div>

                    </div>

                )}


                {/* =====================================
                    ERROR WITH NO LOCATION
                ===================================== */}

                {!loading &&
                    !location && (
                        <div className="tracking-map">

                            <div className="tracking-message">

                                <span>
                                    📍
                                </span>

                                <h3>
                                    GPS Location
                                    Unavailable
                                </h3>

                                <p>
                                    {error ||
                                        "Waiting for worker GPS location..."}
                                </p>

                            </div>

                        </div>
                    )}


                {/* =====================================
                    MAP
                ===================================== */}

                {!loading &&
                    location &&
                    mapPosition && (

                        <div className="tracking-map">

                            <MapContainer
                                center={
                                    mapPosition
                                }
                                zoom={15}
                                scrollWheelZoom={
                                    true
                                }
                                className="worker-live-map"
                            >

                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />


                                <MapFollower
                                    position={
                                        mapPosition
                                    }
                                />


                                <AnimatedWorkerMarker
                                    position={
                                        mapPosition
                                    }
                                    workerName={
                                        workerName
                                    }
                                />

                            </MapContainer>


                            {/* LIVE MAP OVERLAY */}

                            <div className="tracking-map-overlay">

                                <span className="map-overlay-icon">
                                    🚛
                                </span>

                                <div>

                                    <strong>
                                        {workerName}
                                    </strong>

                                    <small>
                                        Live GPS tracking
                                    </small>

                                </div>

                            </div>

                        </div>

                    )}

            </div>


            {/* =========================================
                ERROR WHEN MAP IS STILL AVAILABLE
            ========================================= */}

            {error &&
                location && (

                    <div className="tracking-warning">

                        ⚠️ {error}

                    </div>

                )}

        </div>
    );
};

export default WorkerTracking;