import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./WorkerNavigation.css";


/* ============================================================
   CONFIGURATION
============================================================ */

const API_BASE = "/api";

const OSRM_URL =
    "https://router.project-osrm.org/route/v1/driving";

const ROUTE_REFRESH_INTERVAL = 8000;

const OFF_ROUTE_DISTANCE = 60;


/* ============================================================
   DISTANCE
============================================================ */

function toRadians(value) {
    return (value * Math.PI) / 180;
}


function toDegrees(value) {
    return (value * 180) / Math.PI;
}


function calculateDistanceMeters(
    lat1,
    lon1,
    lat2,
    lon2
) {
    const R = 6371000;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) *
            Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}


/* ============================================================
   BEARING
============================================================ */

function calculateBearing(
    lat1,
    lon1,
    lat2,
    lon2
) {
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);

    const dLon = toRadians(lon2 - lon1);

    const y =
        Math.sin(dLon) *
        Math.cos(lat2Rad);

    const x =
        Math.cos(lat1Rad) *
            Math.sin(lat2Rad) -
        Math.sin(lat1Rad) *
            Math.cos(lat2Rad) *
            Math.cos(dLon);

    return (
        toDegrees(
            Math.atan2(y, x)
        ) + 360
    ) % 360;
}


function normalizeAngle(angle) {
    let value = angle;

    while (value > 180) {
        value -= 360;
    }

    while (value < -180) {
        value += 360;
    }

    return value;
}


/* ============================================================
   FORMATTING
============================================================ */

function formatDistance(meters) {
    if (
        meters === null ||
        meters === undefined ||
        !Number.isFinite(meters)
    ) {
        return "--";
    }

    if (meters < 1000) {
        return `${Math.max(
            0,
            Math.round(meters)
        )} m`;
    }

    return `${(
        meters / 1000
    ).toFixed(1)} km`;
}


function formatDuration(seconds) {
    if (
        seconds === null ||
        seconds === undefined ||
        !Number.isFinite(seconds)
    ) {
        return "--";
    }

    const minutes = Math.max(
        0,
        Math.round(seconds / 60)
    );

    if (minutes < 1) {
        return "<1 min";
    }

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(
        minutes / 60
    );

    const remaining =
        minutes % 60;

    if (remaining === 0) {
        return `${hours} hr`;
    }

    return `${hours} hr ${remaining} min`;
}


function getCompassDirection(
    bearing
) {
    if (!Number.isFinite(bearing)) {
        return "N";
    }

    const directions = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW",
    ];

    const index =
        Math.round(bearing / 45) %
        8;

    return directions[index];
}


/* ============================================================
   OSRM MANEUVER ICON
============================================================ */

function getTurnIcon(
    modifier,
    type
) {
    const maneuverType =
        String(
            type || ""
        ).toLowerCase();

    const direction =
        String(
            modifier || ""
        ).toLowerCase();

    if (
        maneuverType ===
        "arrive"
    ) {
        return "🏁";
    }

    if (
        maneuverType ===
        "depart"
    ) {
        return "↑";
    }

    if (
        maneuverType ===
        "uturn"
    ) {
        return "↶";
    }

    if (
        direction.includes(
            "sharp left"
        )
    ) {
        return "↙";
    }

    if (
        direction.includes(
            "sharp right"
        )
    ) {
        return "↘";
    }

    if (
        direction.includes(
            "slight left"
        )
    ) {
        return "↖";
    }

    if (
        direction.includes(
            "slight right"
        )
    ) {
        return "↗";
    }

    if (
        direction.includes(
            "left"
        )
    ) {
        return "←";
    }

    if (
        direction.includes(
            "right"
        )
    ) {
        return "→";
    }

    return "↑";
}


/* ============================================================
   OSRM INSTRUCTION
============================================================ */

function getInstructionText(
    step
) {
    if (!step) {
        return "Continue straight";
    }

    const maneuver =
        step.maneuver || {};

    const type =
        String(
            maneuver.type || ""
        ).toLowerCase();

    const modifier =
        String(
            maneuver.modifier || ""
        ).toLowerCase();

    const road =
        step.name &&
        step.name.trim()
            ? step.name.trim()
            : "the road";


    if (
        type === "arrive"
    ) {
        return "You have arrived";
    }


    if (
        type === "depart"
    ) {
        if (
            road !==
            "the road"
        ) {
            return `Head toward ${road}`;
        }

        return "Head toward the destination";
    }


    if (
        type === "roundabout"
    ) {
        const exit =
            maneuver.exit !==
                undefined
                ? `exit ${maneuver.exit}`
                : "the exit";

        return `Take ${exit} at the roundabout`;
    }


    if (
        type === "uturn"
    ) {
        return `Make a U-turn onto ${road}`;
    }


    if (
        modifier.includes(
            "sharp left"
        )
    ) {
        return `Turn sharp left onto ${road}`;
    }


    if (
        modifier.includes(
            "sharp right"
        )
    ) {
        return `Turn sharp right onto ${road}`;
    }


    if (
        modifier.includes(
            "slight left"
        )
    ) {
        return `Keep slight left onto ${road}`;
    }


    if (
        modifier.includes(
            "slight right"
        )
    ) {
        return `Keep slight right onto ${road}`;
    }


    if (
        modifier.includes(
            "left"
        )
    ) {
        return `Turn left onto ${road}`;
    }


    if (
        modifier.includes(
            "right"
        )
    ) {
        return `Turn right onto ${road}`;
    }


    if (
        modifier.includes(
            "straight"
        ) ||
        type === "continue"
    ) {
        return `Continue on ${road}`;
    }


    if (
        type === "fork"
    ) {
        if (
            modifier.includes(
                "left"
            )
        ) {
            return `Keep left onto ${road}`;
        }

        if (
            modifier.includes(
                "right"
            )
        ) {
            return `Keep right onto ${road}`;
        }

        return `Continue onto ${road}`;
    }


    return `Continue on ${road}`;
}


/* ============================================================
   CLOSEST ROUTE POINT
============================================================ */

function findClosestRoutePoint(
    position,
    coordinates
) {
    if (
        !position ||
        !Array.isArray(
            coordinates
        ) ||
        coordinates.length === 0
    ) {
        return {
            index: 0,
            distance: Infinity,
        };
    }

    let closestIndex = 0;

    let closestDistance =
        Infinity;


    coordinates.forEach(
        (point, index) => {
            if (
                !Array.isArray(point) ||
                point.length < 2
            ) {
                return;
            }

            const [
                longitude,
                latitude,
            ] = point;

            if (
                !Number.isFinite(
                    latitude
                ) ||
                !Number.isFinite(
                    longitude
                )
            ) {
                return;
            }

            const distance =
                calculateDistanceMeters(
                    position.lat,
                    position.lng,
                    latitude,
                    longitude
                );

            if (
                distance <
                closestDistance
            ) {
                closestDistance =
                    distance;

                closestIndex =
                    index;
            }
        }
    );


    return {
        index: closestIndex,
        distance:
            closestDistance,
    };
}


/* ============================================================
   REMAINING ROUTE DISTANCE
============================================================ */

function calculateRemainingRouteDistance(
    position,
    coordinates
) {
    if (
        !position ||
        !Array.isArray(
            coordinates
        ) ||
        coordinates.length < 2
    ) {
        return 0;
    }

    const closest =
        findClosestRoutePoint(
            position,
            coordinates
        );

    let distance =
        closest.distance;


    for (
        let i =
            closest.index;
        i <
            coordinates.length - 1;
        i++
    ) {
        const current =
            coordinates[i];

        const next =
            coordinates[i + 1];

        if (
            !Array.isArray(
                current
            ) ||
            !Array.isArray(
                next
            )
        ) {
            continue;
        }

        distance +=
            calculateDistanceMeters(
                current[1],
                current[0],
                next[1],
                next[0]
            );
    }


    return distance;
}


/* ============================================================
   FIND CURRENT STEP
============================================================ */

function findCurrentNavigationStep(
    position,
    steps
) {
    if (
        !position ||
        !Array.isArray(steps) ||
        !steps.length
    ) {
        return 0;
    }

    let bestIndex = 0;

    let bestDistance =
        Infinity;


    steps.forEach(
        (step, index) => {
            if (
                !step?.location ||
                step.location.length <
                    2
            ) {
                return;
            }

            const distance =
                calculateDistanceMeters(
                    position.lat,
                    position.lng,
                    step.location[1],
                    step.location[0]
                );

            if (
                distance <
                bestDistance
            ) {
                bestDistance =
                    distance;

                bestIndex =
                    index;
            }
        }
    );


    if (
        bestDistance < 25 &&
        bestIndex <
            steps.length - 1
    ) {
        return (
            bestIndex + 1
        );
    }


    return bestIndex;
}


/* ============================================================
   CURRENT ROAD NAME
============================================================ */

function getCurrentRoadName(
    position,
    steps,
    preferredIndex = 0
) {
    if (
        !position ||
        !Array.isArray(steps) ||
        !steps.length
    ) {
        return null;
    }

    let closestIndex =
        Math.min(
            preferredIndex,
            steps.length - 1
        );

    let closestDistance =
        Infinity;


    const start =
        Math.max(
            0,
            preferredIndex - 2
        );

    const end =
        Math.min(
            steps.length - 1,
            preferredIndex + 3
        );


    for (
        let i = start;
        i <= end;
        i++
    ) {
        const step =
            steps[i];

        if (
            !step?.location ||
            step.location.length <
                2
        ) {
            continue;
        }

        const distance =
            calculateDistanceMeters(
                position.lat,
                position.lng,
                step.location[1],
                step.location[0]
            );

        if (
            distance <
            closestDistance
        ) {
            closestDistance =
                distance;

            closestIndex =
                i;
        }
    }


    const selectedStep =
        steps[closestIndex];


    if (
        selectedStep?.roadName &&
        selectedStep.roadName !==
            "Unnamed road"
    ) {
        return selectedStep.roadName;
    }


    for (
        let i =
            closestIndex;
        i >= 0;
        i--
    ) {
        if (
            steps[i]?.roadName &&
            steps[i].roadName !==
                "Unnamed road"
        ) {
            return steps[i].roadName;
        }
    }


    return "Unnamed road";
}


/* ============================================================
   WORKER ICON
============================================================ */

function createWorkerIcon(
    heading = 0
) {
    return L.divIcon({
        className:
            "smartbin-navigation-worker",

        html: `
            <div
                class="navigation-worker-wrapper"
                style="transform: rotate(${heading}deg);"
            >
                <div class="navigation-worker-pulse"></div>

                <div class="navigation-worker-arrow">
                    <span class="worker-arrow-tip">
                        ▲
                    </span>
                </div>
            </div>
        `,

        iconSize: [
            70,
            70,
        ],

        iconAnchor: [
            35,
            35,
        ],
    });
}


/* ============================================================
   BIN ICON
============================================================ */

function createBinIcon() {
    return L.divIcon({
        className:
            "smartbin-navigation-bin",

        html: `
            <div class="navigation-bin-marker">
                🚮
            </div>
        `,

        iconSize: [
            46,
            46,
        ],

        iconAnchor: [
            23,
            23,
        ],
    });
}


/* ============================================================
   CAMERA
============================================================ */

function NavigationCamera({
    workerPosition,
    navigationMode,
}) {
    const map =
        useMap();

    const firstRender =
        useRef(true);


    useEffect(() => {
        if (
            !workerPosition
        ) {
            return;
        }


        if (
            navigationMode
        ) {
            const zoom =
                window.innerWidth <=
                700
                    ? 18
                    : 17;


            map.setView(
                [
                    workerPosition.lat,
                    workerPosition.lng,
                ],
                zoom,
                {
                    animate:
                        true,

                    duration:
                        0.5,
                }
            );


            if (
                window.innerWidth <=
                700
            ) {
                setTimeout(
                    () => {
                        map.panBy(
                            [
                                0,
                                -125,
                            ],
                            {
                                animate:
                                    true,

                                duration:
                                    0.35,
                            }
                        );
                    },
                    100
                );
            }

            return;
        }


        if (
            firstRender.current
        ) {
            map.setView(
                [
                    workerPosition.lat,
                    workerPosition.lng,
                ],
                16
            );

            firstRender.current =
                false;
        }
    }, [
        workerPosition,
        navigationMode,
        map,
    ]);


    return null;
}


/* ============================================================
   MAP ROTATION
============================================================ */

function RotatingMapLayers({
    heading,
    enabled,
}) {
    const map =
        useMap();


    useEffect(() => {
        const panes =
            map.getPanes();

        if (!panes) {
            return undefined;
        }


        const panesToRotate = [
            panes.tilePane,
            panes.shadowPane,
            panes.overlayPane,
            panes.markerPane,
        ].filter(Boolean);


        if (!enabled) {
            panesToRotate.forEach(
                (pane) => {
                    pane.style.transform =
                        "";

                    pane.style.transformOrigin =
                        "";
                }
            );

            return undefined;
        }


        const bearing =
            Number.isFinite(
                heading
            )
                ? heading
                : 0;


        panesToRotate.forEach(
            (pane) => {
                pane.style.transformOrigin =
                    "50% 50%";

                pane.style.transform =
                    `rotate(${-bearing}deg)`;
            }
        );


        return () => {
            panesToRotate.forEach(
                (pane) => {
                    pane.style.transform =
                        "";

                    pane.style.transformOrigin =
                        "";
                }
            );
        };
    }, [
        map,
        heading,
        enabled,
    ]);


    return null;
}


/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function WorkerNavigation({
    onExit,
}) {

    /* ========================================================
       STATE
    ======================================================== */

    const [
        activeJob,
        setActiveJob,
    ] = useState(null);


    const [
        workerPosition,
        setWorkerPosition,
    ] = useState(null);


    const [
        workerHeading,
        setWorkerHeading,
    ] = useState(0);


    const [
        routeData,
        setRouteData,
    ] = useState(null);


    const [
        navigationStepIndex,
        setNavigationStepIndex,
    ] = useState(0);


    const [
        nextTurnDistance,
        setNextTurnDistance,
    ] = useState(null);


    const [
        remainingDistance,
        setRemainingDistance,
    ] = useState(null);


    const [
        remainingDuration,
        setRemainingDuration,
    ] = useState(null);


    const [
        currentRoad,
        setCurrentRoad,
    ] = useState(
        "Locating..."
    );


    const [
        gpsReady,
        setGpsReady,
    ] = useState(false);


    const [
        gpsError,
        setGpsError,
    ] = useState("");


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        routeLoading,
        setRouteLoading,
    ] = useState(false);


    const [
        isRerouting,
        setIsRerouting,
    ] = useState(false);


    const [
        routeError,
        setRouteError,
    ] = useState("");


    const [
        navigationMode,
        setNavigationMode,
    ] = useState(true);


    /* ========================================================
       REFS
    ======================================================== */

    const watchIdRef =
        useRef(null);


    const lastPositionRef =
        useRef(null);


    const lastRouteTimeRef =
        useRef(0);


    const routingRef =
        useRef(false);


    const routeDataRef =
        useRef(null);


    const workerPositionRef =
        useRef(null);


    const headingRef =
        useRef(0);


    /* ========================================================
       LOAD ACCEPTED JOB
    ======================================================== */

    const loadAcceptedJob =
        useCallback(
            async () => {
                try {

                    /*
                     * IMPORTANT:
                     * SmartBin stores the JWT as
                     * smartbin_token.
                     */

                    const token =
                        localStorage.getItem(
                            "smartbin_token"
                        );


                    if (!token) {
                        console.error(
                            "SmartBin token not found."
                        );

                        setActiveJob(
                            null
                        );

                        setLoading(
                            false
                        );

                        return;
                    }


                    const response =
                        await fetch(
                            `${API_BASE}/jobs/my-jobs`,
                            {
                                method:
                                    "GET",

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


                    console.log(
                        "Worker My Jobs response:",
                        data
                    );


                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            data.message ||
                                "Unable to load jobs"
                        );
                    }


                    const jobs =
                        Array.isArray(
                            data
                        )
                            ? data
                            : data.jobs ||
                              [];


                    const acceptedJob =
                        jobs.find(
                            (job) =>
                                String(
                                    job.status ||
                                        ""
                                ).toLowerCase() ===
                                "accepted"
                        );


                    console.log(
                        "Accepted job found:",
                        acceptedJob
                    );


                    setActiveJob(
                        acceptedJob ||
                            null
                    );

                } catch (
                    error
                ) {

                    console.error(
                        "Worker navigation job error:",
                        error
                    );

                    setActiveJob(
                        null
                    );

                } finally {

                    setLoading(
                        false
                    );
                }
            },
            []
        );


    useEffect(() => {

        loadAcceptedJob();


        const interval =
            setInterval(
                loadAcceptedJob,
                5000
            );


        return () =>
            clearInterval(
                interval
            );

    }, [
        loadAcceptedJob,
    ]);


    /* ========================================================
       DESTINATION
    ======================================================== */

    const destination =
        useMemo(() => {

            if (!activeJob) {
                return null;
            }


            const bin =
                activeJob.bin ||
                {};


            const location =
                activeJob.binLocation ||
                {};


            const latitude =
                Number(
                    bin.latitude ??
                        location.latitude
                );


            const longitude =
                Number(
                    bin.longitude ??
                        location.longitude
                );


            if (
                !Number.isFinite(
                    latitude
                ) ||
                !Number.isFinite(
                    longitude
                )
            ) {
                return null;
            }


            return {
                lat: latitude,

                lng: longitude,

                name:
                    bin.name ||
                    bin.binId ||
                    "SmartBin",

                binId:
                    bin.binId ||
                    "Bin",
            };

        }, [
            activeJob,
        ]);


    /* ========================================================
       GPS
    ======================================================== */

    useEffect(() => {

        if (!activeJob) {
            return undefined;
        }


        if (
            !navigator.geolocation
        ) {
            setGpsError(
                "GPS is not supported by this browser."
            );

            return undefined;
        }


        const handlePosition =
            (position) => {

                const {
                    latitude,
                    longitude,
                    heading,
                } =
                    position.coords;


                if (
                    !Number.isFinite(
                        latitude
                    ) ||
                    !Number.isFinite(
                        longitude
                    )
                ) {
                    return;
                }


                const newPosition = {
                    lat:
                        latitude,

                    lng:
                        longitude,

                    accuracy:
                        Number.isFinite(
                            position
                                .coords
                                .accuracy
                        )
                            ? position
                                  .coords
                                  .accuracy
                            : null,
                };


                const previous =
                    lastPositionRef.current;


                let calculatedHeading =
                    Number.isFinite(
                        heading
                    ) &&
                    heading >= 0
                        ? heading
                        : null;


                if (
                    calculatedHeading ===
                        null &&
                    previous
                ) {

                    const movementDistance =
                        calculateDistanceMeters(
                            previous.lat,
                            previous.lng,
                            latitude,
                            longitude
                        );


                    if (
                        movementDistance >
                        3
                    ) {
                        calculatedHeading =
                            calculateBearing(
                                previous.lat,
                                previous.lng,
                                latitude,
                                longitude
                            );
                    }
                }


                if (
                    calculatedHeading !==
                    null
                ) {

                    const oldHeading =
                        headingRef.current;


                    const difference =
                        normalizeAngle(
                            calculatedHeading -
                                oldHeading
                        );


                    const smoothedHeading =
                        oldHeading +
                        difference *
                            0.35;


                    headingRef.current =
                        (smoothedHeading +
                            360) %
                        360;


                    setWorkerHeading(
                        headingRef.current
                    );
                }


                lastPositionRef.current =
                    newPosition;


                workerPositionRef.current =
                    newPosition;


                setWorkerPosition(
                    newPosition
                );


                setGpsReady(
                    true
                );

                setGpsError("");
            };


        const handleError =
            (error) => {

                console.error(
                    "GPS error:",
                    error
                );


                setGpsReady(
                    false
                );


                if (
                    error.code ===
                    error.PERMISSION_DENIED
                ) {
                    setGpsError(
                        "Location permission denied."
                    );

                } else if (
                    error.code ===
                    error.POSITION_UNAVAILABLE
                ) {
                    setGpsError(
                        "GPS location unavailable."
                    );

                } else {
                    setGpsError(
                        "Unable to get your current location."
                    );
                }
            };


        watchIdRef.current =
            navigator.geolocation.watchPosition(
                handlePosition,
                handleError,
                {
                    enableHighAccuracy:
                        true,

                    maximumAge:
                        2000,

                    timeout:
                        10000,
                }
            );


        return () => {

            if (
                watchIdRef.current !==
                null
            ) {
                navigator.geolocation.clearWatch(
                    watchIdRef.current
                );

                watchIdRef.current =
                    null;
            }

        };

    }, [
        activeJob,
    ]);


    /* ========================================================
       OSRM ROUTE
    ======================================================== */

    const calculateRoute =
        useCallback(
            async ({
                force = false,
                rerouting = false,
            } = {}) => {

                if (
                    !workerPositionRef.current ||
                    !destination ||
                    routingRef.current
                ) {
                    return;
                }


                const now =
                    Date.now();


                if (
                    !force &&
                    now -
                        lastRouteTimeRef.current <
                        ROUTE_REFRESH_INTERVAL
                ) {
                    return;
                }


                routingRef.current =
                    true;


                if (
                    rerouting
                ) {
                    setIsRerouting(
                        true
                    );

                } else {
                    setRouteLoading(
                        true
                    );
                }


                setRouteError("");


                try {

                    const start =
                        workerPositionRef.current;


                    const url =
                        `${OSRM_URL}/` +
                        `${start.lng},${start.lat};` +
                        `${destination.lng},${destination.lat}` +
                        `?overview=full` +
                        `&geometries=geojson` +
                        `&steps=true` +
                        `&annotations=true`;


                    console.log(
                        "OSRM route:",
                        url
                    );


                    const response =
                        await fetch(
                            url
                        );


                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            `OSRM request failed: ${response.status}`
                        );
                    }


                    const data =
                        await response.json();


                    if (
                        data.code !==
                            "Ok" ||
                        !data.routes ||
                        !data.routes
                            .length
                    ) {
                        throw new Error(
                            "No driving route found."
                        );
                    }


                    const route =
                        data.routes[0];


                    const coordinates =
                        route.geometry
                            ?.coordinates ||
                        [];


                    const steps =
                        route.legs?.flatMap(
                            (leg) =>
                                leg.steps ||
                                []
                        ) || [];


                    const normalizedSteps =
                        steps.map(
                            (
                                step,
                                index
                            ) => {

                                const maneuver =
                                    step.maneuver ||
                                    {};


                                const location =
                                    maneuver.location ||
                                    step.geometry
                                        ?.coordinates?.[0] ||
                                    null;


                                return {
                                    ...step,

                                    index,

                                    maneuver,

                                    location,

                                    instruction:
                                        getInstructionText(
                                            step
                                        ),

                                    icon:
                                        getTurnIcon(
                                            maneuver.modifier,
                                            maneuver.type
                                        ),

                                    roadName:
                                        step.name &&
                                        step.name.trim()
                                            ? step.name.trim()
                                            : "Unnamed road",
                                };
                            }
                        );


                    const newRoute = {
                        ...route,

                        coordinates,

                        steps:
                            normalizedSteps,
                    };


                    routeDataRef.current =
                        newRoute;


                    setRouteData(
                        newRoute
                    );


                    lastRouteTimeRef.current =
                        Date.now();


                    /* INITIAL STEP */

                    if (
                        workerPositionRef.current &&
                        normalizedSteps.length
                    ) {

                        const firstIndex =
                            findCurrentNavigationStep(
                                workerPositionRef.current,
                                normalizedSteps
                            );


                        setNavigationStepIndex(
                            firstIndex
                        );
                    }


                    /* REMAINING DISTANCE */

                    const remaining =
                        calculateRemainingRouteDistance(
                            workerPositionRef.current,
                            coordinates
                        );


                    setRemainingDistance(
                        remaining
                    );


                    /* REMAINING TIME */

                    setRemainingDuration(
                        route.duration
                    );


                    /* CURRENT ROAD */

                    const road =
                        getCurrentRoadName(
                            workerPositionRef.current,
                            normalizedSteps
                        );


                    if (road) {
                        setCurrentRoad(
                            road
                        );
                    }

                } catch (
                    error
                ) {

                    console.error(
                        "OSRM route error:",
                        error
                    );


                    setRouteError(
                        error.message ||
                            "Unable to calculate route."
                    );

                } finally {

                    routingRef.current =
                        false;

                    setRouteLoading(
                        false
                    );

                    setIsRerouting(
                        false
                    );
                }
            },
            [
                destination,
            ]
        );


    /* ========================================================
       INITIAL ROUTE
    ======================================================== */

    useEffect(() => {

        if (
            !destination ||
            !workerPosition
        ) {
            return;
        }


        calculateRoute({
            force: true,
        });

    }, [
        destination,
        workerPosition,
        calculateRoute,
    ]);


    /* ========================================================
       UPDATE CURRENT STEP
    ======================================================== */

    const updateNavigationStep =
        useCallback(
            () => {

                const current =
                    workerPositionRef.current;


                const route =
                    routeDataRef.current;


                if (
                    !current ||
                    !route ||
                    !route.steps?.length
                ) {
                    return;
                }


                const steps =
                    route.steps;


                let currentIndex =
                    navigationStepIndex;


                if (
                    currentIndex >=
                    steps.length
                ) {
                    currentIndex =
                        steps.length - 1;
                }


                let bestIndex =
                    currentIndex;


                let bestDistance =
                    Infinity;


                const startIndex =
                    Math.max(
                        0,
                        currentIndex - 1
                    );


                const endIndex =
                    Math.min(
                        steps.length - 1,
                        currentIndex + 4
                    );


                for (
                    let i =
                        startIndex;
                    i <= endIndex;
                    i++
                ) {

                    const step =
                        steps[i];


                    if (
                        !step?.location ||
                        step.location.length <
                            2
                    ) {
                        continue;
                    }


                    const distance =
                        calculateDistanceMeters(
                            current.lat,
                            current.lng,
                            step.location[1],
                            step.location[0]
                        );


                    if (
                        distance <
                        bestDistance
                    ) {
                        bestDistance =
                            distance;

                        bestIndex =
                            i;
                    }
                }


                const currentStep =
                    steps[
                        bestIndex
                    ];


                const currentDistance =
                    currentStep?.location
                        ? calculateDistanceMeters(
                              current.lat,
                              current.lng,
                              currentStep.location[1],
                              currentStep.location[0]
                          )
                        : Infinity;


                let finalIndex =
                    bestIndex;


                if (
                    currentDistance <
                        25 &&
                    bestIndex <
                        steps.length - 1
                ) {
                    finalIndex =
                        bestIndex + 1;
                }


                if (
                    finalIndex !==
                    navigationStepIndex
                ) {
                    setNavigationStepIndex(
                        finalIndex
                    );
                }


                const nextStep =
                    steps[
                        finalIndex
                    ];


                if (
                    nextStep?.location
                ) {

                    const distance =
                        calculateDistanceMeters(
                            current.lat,
                            current.lng,
                            nextStep.location[1],
                            nextStep.location[0]
                        );


                    setNextTurnDistance(
                        distance
                    );
                }


                const road =
                    getCurrentRoadName(
                        current,
                        steps,
                        finalIndex
                    );


                if (road) {
                    setCurrentRoad(
                        road
                    );
                }


                const remaining =
                    calculateRemainingRouteDistance(
                        current,
                        route.coordinates
                    );


                setRemainingDistance(
                    remaining
                );


                if (
                    Number.isFinite(
                        route.duration
                    ) &&
                    Number.isFinite(
                        route.distance
                    ) &&
                    route.distance >
                        0
                ) {

                    const ratio =
                        Math.min(
                            1,
                            Math.max(
                                0,
                                remaining /
                                    route.distance
                            )
                        );


                    setRemainingDuration(
                        route.duration *
                            ratio
                    );
                }


                const closest =
                    findClosestRoutePoint(
                        current,
                        route.coordinates
                    );


                if (
                    closest.distance >
                    OFF_ROUTE_DISTANCE
                ) {

                    calculateRoute({
                        force:
                            true,

                        rerouting:
                            true,
                    });
                }

            },
            [
                navigationStepIndex,
                calculateRoute,
            ]
        );


    useEffect(() => {

        if (!workerPosition) {
            return;
        }


        updateNavigationStep();

    }, [
        workerPosition,
        updateNavigationStep,
    ]);


    /* ========================================================
       CURRENT STEP
    ======================================================== */

    const currentStep =
        useMemo(() => {

            if (
                !routeData?.steps?.length
            ) {
                return null;
            }


            return (
                routeData.steps[
                    Math.min(
                        navigationStepIndex,
                        routeData.steps
                            .length - 1
                    )
                ] ||
                null
            );

        }, [
            routeData,
            navigationStepIndex,
        ]);


    /* ========================================================
       FOLLOWING STEP
    ======================================================== */

    const followingStep =
        useMemo(() => {

            if (
                !routeData?.steps?.length
            ) {
                return null;
            }


            return (
                routeData.steps[
                    navigationStepIndex +
                        1
                ] ||
                null
            );

        }, [
            routeData,
            navigationStepIndex,
        ]);


    /* ========================================================
       RECENTER
    ======================================================== */

    const recenterMap =
        () => {

            setNavigationMode(
                true
            );


            window.dispatchEvent(
                new CustomEvent(
                    "smartbin-recenter-navigation"
                )
            );
        };


    /* ========================================================
       NO ACCEPTED JOB
    ======================================================== */

    if (
        !loading &&
        !activeJob
    ) {
        return (
            <div className="worker-navigation-screen">

                <div className="navigation-no-job">

                    <div className="navigation-no-job-icon">
                        🧭
                    </div>

                    <h2>
                        No Accepted Job
                    </h2>

                    <p>
                        Accept a collection
                        job to start
                        navigation.
                    </p>

                </div>

            </div>
        );
    }


    /* ========================================================
       LOADING
    ======================================================== */

    if (
        loading ||
        !activeJob
    ) {
        return (
            <div className="worker-navigation-screen">

                <div className="navigation-loading">

                    <div className="navigation-loader"></div>

                    <h3>
                        Loading Navigation
                    </h3>

                    <p>
                        Finding your
                        accepted
                        collection job...
                    </p>

                </div>

            </div>
        );
    }


    /* ========================================================
       INVALID DESTINATION
    ======================================================== */

    if (!destination) {
        return (
            <div className="worker-navigation-screen">

                <div className="navigation-no-job">

                    <div className="navigation-no-job-icon">
                        ⚠️
                    </div>

                    <h2>
                        Destination unavailable
                    </h2>

                    <p>
                        The accepted job
                        does not contain
                        valid bin coordinates.
                    </p>

                </div>

            </div>
        );
    }


    /* ========================================================
       MAP
    ======================================================== */

    const mapCenter =
        workerPosition
            ? [
                  workerPosition.lat,
                  workerPosition.lng,
              ]
            : [
                  destination.lat,
                  destination.lng,
              ];


    const routePositions =
        routeData?.coordinates?.map(
            ([
                longitude,
                latitude,
            ]) => [
                latitude,
                longitude,
            ]
        ) || [];


    const instruction =
        currentStep?.instruction ||
        "Calculating route...";


    const instructionIcon =
        currentStep?.icon ||
        "↑";


    const instructionRoad =
        currentStep?.roadName ||
        currentRoad ||
        "Road";


    const displayTurnDistance =
        nextTurnDistance !== null
            ? nextTurnDistance
            : currentStep?.distance;


    const displayRemaining =
        remainingDistance !== null
            ? remainingDistance
            : routeData?.distance;


    const displayDuration =
        remainingDuration !== null
            ? remainingDuration
            : routeData?.duration;


    return (
        <div className="worker-navigation-screen">

            <div className="navigation-map-container">

                <MapContainer
                    center={
                        mapCenter
                    }

                    zoom={16}

                    className="navigation-map"

                    zoomControl={
                        true
                    }

                    attributionControl={
                        true
                    }
                >

                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

                        attribution="&copy; OpenStreetMap contributors"
                    />


                    <NavigationCamera
                        workerPosition={
                            workerPosition
                        }

                        navigationMode={
                            navigationMode
                        }
                    />


                    <RotatingMapLayers
                        heading={
                            workerHeading
                        }

                        enabled={
                            navigationMode &&
                            window.innerWidth <=
                                700
                        }
                    />


                    {/* ROUTE */}

                    {routePositions.length >
                        1 && (
                        <>
                            <Polyline
                                positions={
                                    routePositions
                                }

                                pathOptions={{
                                    color:
                                        "#0b0f14",

                                    weight:
                                        11,

                                    opacity:
                                        0.40,

                                    lineCap:
                                        "round",

                                    lineJoin:
                                        "round",
                                }}
                            />


                            <Polyline
                                positions={
                                    routePositions
                                }

                                pathOptions={{
                                    color:
                                        "#1683ff",

                                    weight:
                                        7,

                                    opacity:
                                        0.95,

                                    lineCap:
                                        "round",

                                    lineJoin:
                                        "round",
                                }}
                            />
                        </>
                    )}


                    {/* WORKER */}

                    {workerPosition && (
                        <Marker
                            position={[
                                workerPosition.lat,
                                workerPosition.lng,
                            ]}

                            icon={
                                createWorkerIcon(
                                    workerHeading
                                )
                            }

                            zIndexOffset={
                                1000
                            }
                        >

                            <Popup>

                                <strong>
                                    Your Location
                                </strong>

                                <br />

                                GPS accuracy:{" "}

                                {workerPosition.accuracy
                                    ? `${Math.round(
                                          workerPosition.accuracy
                                      )} m`
                                    : "--"}

                            </Popup>

                        </Marker>
                    )}


                    {/* BIN */}

                    <Marker
                        position={[
                            destination.lat,
                            destination.lng,
                        ]}

                        icon={
                            createBinIcon()
                        }

                        zIndexOffset={
                            900
                        }
                    >

                        <Popup>

                            <strong>
                                {
                                    destination.name
                                }
                            </strong>

                            <br />

                            {
                                destination.binId
                            }

                            <br />

                            Destination

                        </Popup>

                    </Marker>

                </MapContainer>


                {/* ==================================================
                    TOP NAVIGATION
                ================================================== */}

                <div className="navigation-top-panel">

                    <div className="navigation-direction-icon">

                        {
                            instructionIcon
                        }

                    </div>


                    <div className="navigation-instruction-content">

                        <span>

                            {currentStep?.maneuver
                                ?.type ===
                            "arrive"
                                ? "DESTINATION"
                                : "NEXT TURN"}

                        </span>


                        <strong>

                            {
                                instruction
                            }

                        </strong>


                        {displayTurnDistance !==
                            null &&
                            currentStep?.maneuver
                                ?.type !==
                                "arrive" && (

                                <small
                                    style={{
                                        display:
                                            "block",

                                        marginTop:
                                            "4px",

                                        color:
                                            "rgba(255,255,255,0.78)",

                                        fontSize:
                                            "12px",

                                        fontWeight:
                                            600,
                                    }}
                                >

                                    {
                                        formatDistance(
                                            displayTurnDistance
                                        )
                                    }

                                    {" • "}

                                    {
                                        instructionRoad
                                    }

                                </small>
                            )}

                    </div>


                    <div className="navigation-compass">

                        <span>
                            {
                                getCompassDirection(
                                    workerHeading
                                )
                            }
                        </span>


                        <div
                            className="compass-arrow"
                            style={{
                                transform:
                                    `rotate(${-workerHeading}deg)`,
                            }}
                        >
                            ↑
                        </div>

                    </div>

                </div>


                {/* ==================================================
                    DESTINATION
                ================================================== */}

                <div className="navigation-destination-label">

                    <div className="destination-label-icon">
                        🚮
                    </div>


                    <div>

                        <span>
                            DESTINATION
                        </span>

                        <strong>
                            {
                                destination.name
                            }
                        </strong>

                    </div>

                </div>


                {/* ==================================================
                    GPS
                ================================================== */}

                <div className="navigation-gps-status">

                    <span
                        style={{
                            background:
                                gpsReady
                                    ? "#22c55e"
                                    : "#ef4444",
                        }}
                    />

                    {
                        gpsReady
                            ? "GPS LIVE"
                            : "GPS WAITING"
                    }

                </div>


                {/* ==================================================
                    ROUTE STATUS
                ================================================== */}

                {(routeLoading ||
                    isRerouting) && (

                    <div className="navigation-route-status">

                        <div className="route-status-spinner"></div>

                        {
                            isRerouting
                                ? "Recalculating route..."
                                : "Calculating route..."
                        }

                    </div>
                )}


                {/* ==================================================
                    GPS ERROR
                ================================================== */}

                {gpsError && (

                    <div
                        className="navigation-route-status"

                        style={{
                            background:
                                "rgba(127,29,29,0.95)",
                        }}
                    >
                        ⚠ {gpsError}
                    </div>

                )}


                {/* ==================================================
                    ROUTE ERROR
                ================================================== */}

                {routeError && (

                    <div
                        className="navigation-route-status"

                        style={{
                            background:
                                "rgba(127,29,29,0.95)",
                        }}
                    >
                        ⚠ {routeError}
                    </div>

                )}


                {/* ==================================================
                    RECENTER
                ================================================== */}

                <button
                    type="button"

                    className="navigation-recenter-button"

                    onClick={
                        recenterMap
                    }
                >

                    <span className="recenter-target">
                        ◎
                    </span>

                    Recenter

                </button>


                {/* ==================================================
                    BOTTOM PANEL
                ================================================== */}

                <div className="navigation-bottom-panel">

                    <div className="navigation-arrival-info">

                        <strong>

                            {
                                formatDuration(
                                    displayDuration
                                )
                            }

                        </strong>


                        <div className="navigation-route-meta">

                            <span>

                                {
                                    formatDistance(
                                        displayRemaining
                                    )
                                }

                            </span>


                            <span className="meta-separator">
                                •
                            </span>


                            <span>

                                {
                                    activeJob
                                        .bin
                                        ?.binId ||
                                    destination.binId
                                }

                            </span>

                        </div>

                    </div>


                    <div className="navigation-bottom-actions">

                        <div className="navigation-current-road">

                            <span>
                                CURRENT ROAD
                            </span>


                            <strong>

                                {
                                    currentRoad ||
                                    "Locating road..."
                                }

                            </strong>


                            {followingStep &&
                                followingStep.roadName && (

                                <small
                                    style={{
                                        display:
                                            "block",

                                        marginTop:
                                            "4px",

                                        color:
                                            "rgba(255,255,255,0.48)",

                                        fontSize:
                                            "10px",
                                    }}
                                >

                                    Next:{" "}

                                    {
                                        followingStep.roadName
                                    }

                                </small>

                            )}

                        </div>


                        <button
                            type="button"

                            className="navigation-exit-button"

                            onClick={() => {

                                if (
                                    typeof onExit ===
                                    "function"
                                ) {
                                    onExit();
                                }

                            }}
                        >
                            EXIT
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}