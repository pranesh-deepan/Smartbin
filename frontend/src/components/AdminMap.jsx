import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";


// =====================================================
// LEAFLET DEFAULT MARKER FIX
// =====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


// =====================================================
// BIN COLOR
// =====================================================

const getBinColor = (fillLevel) => {

    const level =
        Number(fillLevel || 0);

    if (level >= 90) {
        return "#dc2626";
    }

    if (level >= 70) {
        return "#f59e0b";
    }

    return "#16a34a";
};


// =====================================================
// BIN ICON
// =====================================================

const createBinIcon = (fillLevel) => {

    const color =
        getBinColor(fillLevel);

    return L.divIcon({

        className:
            "admin-map-bin-marker",

        html: `
            <div
                class="admin-map-bin-icon"
                style="background:${color};"
            >
                🗑️
            </div>
        `,

        iconSize: [42, 42],

        iconAnchor: [21, 21],

        popupAnchor: [0, -21],
    });
};


// =====================================================
// WORKER ICON
// =====================================================

const workerIcon =
    L.divIcon({

        className:
            "admin-map-worker-marker",

        html: `
            <div class="admin-map-worker-icon">
                👷
            </div>
        `,

        iconSize: [46, 46],

        iconAnchor: [23, 23],

        popupAnchor: [0, -23],
    });


// =====================================================
// BIN COORDINATES
// =====================================================

const getBinCoordinates = (bin) => {

    const latitude =
        Number(
            bin?.latitude ??
            bin?.location?.latitude ??
            bin?.coordinates?.latitude
        );

    const longitude =
        Number(
            bin?.longitude ??
            bin?.location?.longitude ??
            bin?.coordinates?.longitude
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return null;
    }

    return [
        latitude,
        longitude,
    ];
};


// =====================================================
// WORKER COORDINATES
// =====================================================

const getWorkerCoordinates = (worker) => {

    const latitude =
        Number(
            worker?.currentLocation?.latitude
        );

    const longitude =
        Number(
            worker?.currentLocation?.longitude
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return null;
    }

    return [
        latitude,
        longitude,
    ];
};


// =====================================================
// MAP AUTO FIT
// =====================================================

const MapAutoFit = ({
    bins,
    workers,
}) => {

    const map = useMap();

    const hasFittedRef = useRef(false);


    useEffect(() => {

        // Only fit the map ONCE
        if (hasFittedRef.current) {
            return;
        }


        const locations = [];


        bins.forEach((bin) => {

            const coordinates =
                getBinCoordinates(bin);

            if (coordinates) {
                locations.push(
                    coordinates
                );
            }

        });


        workers.forEach((worker) => {

            const coordinates =
                getWorkerCoordinates(worker);

            if (coordinates) {
                locations.push(
                    coordinates
                );
            }

        });


        if (locations.length === 0) {
            return;
        }


        const bounds =
            L.latLngBounds(
                locations
            );


        map.fitBounds(
            bounds,
            {
                padding: [50, 50],
                maxZoom: 15,
            }
        );


        // Prevent future GPS updates
        // from moving the map
        hasFittedRef.current = true;


    }, [bins, workers, map]);


    return null;
};


// =====================================================
// ANIMATED WORKER MARKER
// =====================================================

const AnimatedWorkerMarker = ({
    worker,
    position,
}) => {

    const markerRef =
        useRef(null);

    const previousPositionRef =
        useRef(position);


    useEffect(() => {

        if (!markerRef.current) {

            previousPositionRef.current =
                position;

            return;
        }


        const marker =
            markerRef.current;


        const startPosition =
            previousPositionRef.current;

        const endPosition =
            position;


        if (
            !startPosition ||
            !endPosition
        ) {
            return;
        }


        if (
            startPosition[0] ===
                endPosition[0] &&
            startPosition[1] ===
                endPosition[1]
        ) {
            return;
        }


        const startTime =
            performance.now();

        const duration =
            4500;


        let animationFrame;


        const easeInOut = (value) => {

            return value < 0.5
                ? 2 * value * value
                : 1 -
                      Math.pow(
                          -2 * value + 2,
                          2
                      ) /
                          2;
        };


        const animate = (
            currentTime
        ) => {

            const elapsed =
                currentTime -
                startTime;


            let progress =
                elapsed /
                duration;


            progress =
                Math.min(
                    progress,
                    1
                );


            const eased =
                easeInOut(
                    progress
                );


            const latitude =
                startPosition[0] +
                (
                    endPosition[0] -
                    startPosition[0]
                ) *
                    eased;


            const longitude =
                startPosition[1] +
                (
                    endPosition[1] -
                    startPosition[1]
                ) *
                    eased;


            marker.setLatLng([
                latitude,
                longitude,
            ]);


            if (progress < 1) {

                animationFrame =
                    requestAnimationFrame(
                        animate
                    );

            } else {

                marker.setLatLng(
                    endPosition
                );

                previousPositionRef.current =
                    endPosition;
            }
        };


        animationFrame =
            requestAnimationFrame(
                animate
            );


        return () => {

            if (animationFrame) {

                cancelAnimationFrame(
                    animationFrame
                );
            }

        };

    }, [position]);


    return (

        <Marker
            position={position}
            icon={workerIcon}
            ref={markerRef}
        >

            <Popup>

                <div className="admin-map-popup">

                    <h4>
                        👷{" "}
                        {worker?.name ||
                            "Worker"}
                    </h4>


                    <div>

                        <span>
                            Status
                        </span>

                        <strong>
                            {worker?.availability ||
                                "Available"}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Latitude
                        </span>

                        <strong>
                            {position[0].toFixed(
                                6
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Longitude
                        </span>

                        <strong>
                            {position[1].toFixed(
                                6
                            )}
                        </strong>

                    </div>


                    {worker?.currentLocation
                        ?.lastUpdated && (

                        <div>

                            <span>
                                Updated
                            </span>

                            <strong>
                                {new Date(
                                    worker
                                        .currentLocation
                                        .lastUpdated
                                ).toLocaleTimeString()}
                            </strong>

                        </div>

                    )}

                </div>

            </Popup>

        </Marker>
    );
};


// =====================================================
// ACCEPTED JOB ROUTE - LIVE UPDATE
// =====================================================

const AcceptedJobRoute = ({
    jobs = [],
    workers = [],
    bins = [],
}) => {

    const [route, setRoute] =
        useState(null);

    const [routeInfo, setRouteInfo] =
        useState(null);

    const [routeLoading, setRouteLoading] =
        useState(false);


    // =================================================
    // FIND ACTIVE JOB
    // =================================================

    const activeJob =
        jobs.find((job) => {

            const status =
                String(
                    job?.status || ""
                ).toLowerCase();

            return (
                status === "accepted" ||
                status === "assigned" ||
                status === "in_progress" ||
                status === "in progress"
            );

        });


    // =================================================
    // FETCH ROUTE
    // =================================================

    const loadRoute = async () => {

        if (!activeJob) {

            setRoute(null);
            setRouteInfo(null);

            return;
        }


        // =============================================
        // FIND WORKER
        // =============================================

        const workerId =
            activeJob?.worker?._id ||
            activeJob?.workerId;


        const worker =
            workers.find(
                (item) =>
                    String(item?._id) ===
                    String(workerId)
            ) ||
            activeJob?.worker;


        const workerPosition =
            getWorkerCoordinates(
                worker
            );


        if (!workerPosition) {

            setRoute(null);
            setRouteInfo(null);

            return;
        }


        // =============================================
        // FIND BIN
        // =============================================

        const binId =
            activeJob?.bin?._id ||
            activeJob?.binId;


        const bin =
            bins.find(
                (item) =>
                    String(item?._id) ===
                        String(binId) ||
                    String(item?.binId) ===
                        String(binId)
            ) ||
            activeJob?.bin;


        const binPosition =
            getBinCoordinates(
                bin
            );


        if (!binPosition) {

            setRoute(null);
            setRouteInfo(null);

            return;
        }


        // =============================================
        // REQUEST ROAD ROUTE
        // =============================================

        try {

            setRouteLoading(true);


            const url =
                `https://router.project-osrm.org/route/v1/driving/` +
                `${workerPosition[1]},${workerPosition[0]};` +
                `${binPosition[1]},${binPosition[0]}` +
                `?overview=full&geometries=geojson`;


            const response =
                await fetch(url);


            if (!response.ok) {

                throw new Error(
                    "Unable to calculate route"
                );
            }


            const data =
                await response.json();


            if (
                !data.routes ||
                data.routes.length === 0
            ) {

                throw new Error(
                    "No route found"
                );
            }


            const selectedRoute =
                data.routes[0];


            // =========================================
            // CONVERT OSRM COORDINATES
            // [LONGITUDE, LATITUDE]
            // →
            // [LATITUDE, LONGITUDE]
            // =========================================

            const coordinates =
                selectedRoute
                    .geometry
                    .coordinates
                    .map(
                        (coordinate) => [

                            coordinate[1],

                            coordinate[0],

                        ]
                    );


            setRoute(
                coordinates
            );


            setRouteInfo({

                distance:
                    selectedRoute.distance,

                duration:
                    selectedRoute.duration,

            });

        } catch (error) {

            console.error(
                "Live route error:",
                error
            );

        } finally {

            setRouteLoading(false);

        }

    };


    // =================================================
    // INITIAL + GPS REFRESH
    // =================================================

    useEffect(() => {

        // Calculate immediately
        loadRoute();


        // Recalculate every 5 seconds
        const interval =
            setInterval(() => {

                loadRoute();

            }, 5000);


        return () => {

            clearInterval(interval);

        };

    }, [
        activeJob,
        workers,
        bins,
    ]);


    // =================================================
    // NO ROUTE
    // =================================================

    if (!route) {
        return null;
    }


    // =================================================
    // ROUTE
    // =================================================

    return (

        <Polyline
            positions={route}
            pathOptions={{
                color: "#2563eb",
                weight: 6,
                opacity: 0.85,
            }}
        />

    );
};


// =====================================================
// ADMIN MAP
// =====================================================

const AdminMap = ({
    bins = [],
    workers = [],
    jobs = [],
}) => {

    const [mapReady, setMapReady] =
        useState(false);


    // =================================================
    // DEFAULT CENTER
    // =================================================

    const defaultCenter = [
        11.0168,
        76.9558,
    ];


    // =================================================
    // LOCATION COUNTS
    // =================================================

    const binsWithLocation =
        bins.filter(
            (bin) =>
                getBinCoordinates(bin)
        );


    const workersWithLocation =
        workers.filter(
            (worker) =>
                getWorkerCoordinates(
                    worker
                )
        );


    // =================================================
    // BIN COUNTS
    // =================================================

    const criticalBins =
        bins.filter(
            (bin) =>
                Number(
                    bin.fillLevel || 0
                ) >= 90
        );


    const warningBins =
        bins.filter(
            (bin) => {

                const level =
                    Number(
                        bin.fillLevel || 0
                    );

                return (
                    level >= 70 &&
                    level < 90
                );
            }
        );


    // =================================================
    // MAP READY
    // =================================================

    useEffect(() => {

        setMapReady(true);

    }, []);


    return (

        <div className="admin-map-wrapper">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="admin-map-header">

                <div>

                    <p>
                        Real-time locations of
                        bins and collection
                        workers
                    </p>

                </div>


                <div className="admin-map-live-indicator">

                    <span></span>

                    Live

                </div>

            </div>


            {/* =================================================
                MAP
            ================================================= */}

            <div className="admin-map-container">

                {mapReady && (

                    <MapContainer
                        center={defaultCenter}
                        zoom={12}
                        scrollWheelZoom={true}
                        zoomControl={true}
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                    >

                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={19}
                        />


                        {/* =====================================
                            ALL BIN MARKERS
                        ===================================== */}

                        {bins.map((bin) => {

                            const position =
                                getBinCoordinates(
                                    bin
                                );


                            if (!position) {
                                return null;
                            }


                            const fillLevel =
                                Number(
                                    bin.fillLevel ||
                                        0
                                );


                            return (

                                <Marker
                                    key={
                                        bin._id ||
                                        bin.binId
                                    }
                                    position={
                                        position
                                    }
                                    icon={
                                        createBinIcon(
                                            fillLevel
                                        )
                                    }
                                >

                                    <Popup>

                                        <div className="admin-map-popup">

                                            <h4>
                                                🗑️{" "}
                                                {bin.name ||
                                                    bin.binId ||
                                                    "SmartBin"}
                                            </h4>


                                            <div>

                                                <span>
                                                    Bin ID
                                                </span>

                                                <strong>
                                                    {bin.binId ||
                                                        bin._id ||
                                                        "N/A"}
                                                </strong>

                                            </div>


                                            <div>

                                                <span>
                                                    Fill Level
                                                </span>

                                                <strong>
                                                    {fillLevel}%
                                                </strong>

                                            </div>


                                            <div>

                                                <span>
                                                    Status
                                                </span>

                                                <strong
                                                    style={{
                                                        color:
                                                            getBinColor(
                                                                fillLevel
                                                            ),
                                                    }}
                                                >
                                                    {fillLevel >=
                                                    90
                                                        ? "Critical"
                                                        : fillLevel >=
                                                          70
                                                        ? "Warning"
                                                        : "Normal"}
                                                </strong>

                                            </div>

                                        </div>

                                    </Popup>

                                </Marker>

                            );

                        })}


                        {/* =====================================
                            ALL WORKER MARKERS
                        ===================================== */}

                        {workers.map(
                            (worker) => {

                                const position =
                                    getWorkerCoordinates(
                                        worker
                                    );


                                if (!position) {
                                    return null;
                                }


                                return (

                                    <AnimatedWorkerMarker
                                        key={
                                            worker._id
                                        }
                                        worker={
                                            worker
                                        }
                                        position={
                                            position
                                        }
                                    />

                                );

                            }
                        )}


                        {/* =====================================
                            AUTO FIT
                        ===================================== */}

                        <MapAutoFit
                            bins={bins}
                            workers={workers}
                        />


                        {/* =====================================
                            ACCEPTED JOB ROUTE
                        ===================================== */}

                        <AcceptedJobRoute
                            jobs={jobs}
                            workers={workers}
                            bins={bins}
                        />

                    </MapContainer>

                )}


                {/* =========================================
                    NO LOCATION MESSAGE
                ========================================= */}

                {binsWithLocation.length === 0 &&
                    workersWithLocation.length === 0 && (

                    <div className="admin-map-no-location">

                        <div>
                            🗺️
                        </div>

                        <h3>
                            No GPS Locations Available
                        </h3>

                        <p>
                            Bin and worker locations
                            will appear here when GPS
                            coordinates are available.
                        </p>

                    </div>

                )}

            </div>


            {/* =================================================
                LEGEND
            ================================================= */}

            <div className="admin-map-legend">

                <div className="map-legend-title">
                    Map Legend
                </div>


                <div className="map-legend-items">

                    <div>

                        <span className="legend-marker bin-normal">
                            🗑️
                        </span>

                        Normal Bin

                    </div>


                    <div>

                        <span className="legend-marker bin-warning">
                            🗑️
                        </span>

                        Warning Bin

                    </div>


                    <div>

                        <span className="legend-marker bin-critical">
                            🗑️
                        </span>

                        Critical Bin

                    </div>


                    <div>

                        <span className="legend-marker worker-marker">
                            👷
                        </span>

                        Worker

                    </div>


                    <div>

                        <span
                            className="route-legend-line"
                        ></span>

                        Active Job Route

                    </div>

                </div>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="admin-map-stats">

                <div className="admin-map-stat">

                    <span>
                        🗑️
                    </span>

                    <div>

                        <strong>
                            {bins.length}
                        </strong>

                        <small>
                            Total Bins
                        </small>

                    </div>

                </div>


                <div className="admin-map-stat">

                    <span>
                        👷
                    </span>

                    <div>

                        <strong>
                            {workers.length}
                        </strong>

                        <small>
                            Total Workers
                        </small>

                    </div>

                </div>


                <div className="admin-map-stat">

                    <span>
                        🔴
                    </span>

                    <div>

                        <strong>
                            {criticalBins.length}
                        </strong>

                        <small>
                            Critical Bins
                        </small>

                    </div>

                </div>


                <div className="admin-map-stat">

                    <span>
                        🟠
                    </span>

                    <div>

                        <strong>
                            {warningBins.length}
                        </strong>

                        <small>
                            Warning Bins
                        </small>

                    </div>

                </div>


                <div className="admin-map-stat">

                    <span>
                        📍
                    </span>

                    <div>

                        <strong>
                            {
                                workersWithLocation.length
                            }
                        </strong>

                        <small>
                            Workers Online
                        </small>

                    </div>

                </div>

            </div>

        </div>
    );
};


export default AdminMap;