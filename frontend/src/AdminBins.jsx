import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./AdminBins.css";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Map click component
function LocationPicker({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return null;
}

// Get marker/fill color based on fill level
function getBinColor(fillLevel) {
    if (fillLevel >= 90) {
        return "#dc2626";
    }

    if (fillLevel >= 70) {
        return "#f59e0b";
    }

    return "#16a34a";
}

// Get fill status
function getFillStatus(fillLevel) {
    if (fillLevel >= 90) {
        return {
            label: "Critical",
            color: "#dc2626",
        };
    }

    if (fillLevel >= 70) {
        return {
            label: "Getting Full",
            color: "#f59e0b",
        };
    }

    return {
        label: "Normal",
        color: "#16a34a",
    };
}

// Create colored bin marker
function createBinIcon(fillLevel) {
    const color = getBinColor(fillLevel);

    return L.divIcon({
        className: "custom-bin-marker",

        html: `
            <div
                style="
                    width: 30px;
                    height: 30px;
                    background: ${color};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 15px;
                "
            >
                🗑️
            </div>
        `,

        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });
}

function AdminBins() {
    const [bins, setBins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [selectedLocation, setSelectedLocation] = useState(null);

    const [formData, setFormData] = useState({
        binId: "",
        name: "",
        location: "",
        latitude: "",
        longitude: "",
    });

    // Get JWT token
    const token = localStorage.getItem("smartbin_token");

    // Load all bins
    const fetchBins = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/bins",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load bins"
                );
            }

            setBins(data.bins || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Load bins when component opens
    useEffect(() => {
        fetchBins();
    }, []);

    // Handle map click
    const handleLocationSelect = (
        latitude,
        longitude
    ) => {
        setSelectedLocation({
            latitude,
            longitude,
        });

        setFormData((previous) => ({
            ...previous,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
        }));
    };

    // Handle form input
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Add bin
    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (
            !formData.latitude ||
            !formData.longitude
        ) {
            setError(
                "Please select the bin location on the map."
            );
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/bins",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        binId: formData.binId,
                        name: formData.name,
                        location: formData.location,
                        latitude: Number(
                            formData.latitude
                        ),
                        longitude: Number(
                            formData.longitude
                        ),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to create bin"
                );
            }

            setMessage(
                "Bin added successfully."
            );

            // Clear form
            setFormData({
                binId: "",
                name: "",
                location: "",
                latitude: "",
                longitude: "",
            });

            setSelectedLocation(null);

            // Reload bins
            fetchBins();

        } catch (err) {
            setError(err.message);
        }
    };

    // Delete bin
    const handleDelete = async (binId) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete bin ${binId}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await fetch(
                `http://localhost:5000/api/bins/${binId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to delete bin"
                );
            }

            setMessage(
                "Bin deleted successfully."
            );

            fetchBins();

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="admin-bins-page">

            {/* Header */}
            <div className="admin-bins-header">

                <div>

                    <h4>
                        Add, monitor and manage SmartBin
                        locations.
                    </h4>
                </div>

                <div className="bin-count">
                    <strong>
                        {bins.length}
                    </strong>

                    <span>
                        Total Bins
                    </span>
                </div>

            </div>

            {/* Success Message */}
            {message && (
                <div className="bin-message success">
                    {message}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bin-message error">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="bin-management-grid">

                {/* ================= MAP ================= */}

                <div className="map-card">

                    <div className="card-header">

                        <div>
                            <h3>
                                Bin Locations
                            </h3>

                            <p>
                                Click anywhere on the map
                                to select a bin location.
                            </p>
                        </div>

                    </div>

                    <div className="map-wrapper">

                        <MapContainer
                            center={[
                                11.0168,
                                76.9558,
                            ]}
                            zoom={13}
                            scrollWheelZoom={true}
                            className="admin-map"
                        >

                            <TileLayer
                                attribution="&copy; OpenStreetMap contributors"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <LocationPicker
                                onLocationSelect={
                                    handleLocationSelect
                                }
                            />

                            {/* Existing bins */}
                            {bins.map((bin) => {

                                const fillLevel =
                                    bin.fillLevel || 0;

                                const fillStatus =
                                    getFillStatus(
                                        fillLevel
                                    );

                                return (
                                    <Marker
                                        key={bin._id}
                                        position={[
                                            bin.latitude,
                                            bin.longitude,
                                        ]}
                                        icon={createBinIcon(
                                            fillLevel
                                        )}
                                    >

                                        <Popup>

                                            <div className="bin-popup">

                                                <h4>
                                                    {bin.name}
                                                </h4>

                                                <p>
                                                    <strong>
                                                        Bin ID:
                                                    </strong>{" "}
                                                    {bin.binId}
                                                </p>

                                                <p>
                                                    <strong>
                                                        Location:
                                                    </strong>{" "}
                                                    {bin.location}
                                                </p>

                                                {/* Fill Level */}
                                                <div className="popup-fill-section">

                                                    <div className="popup-fill-header">

                                                        <strong>
                                                            Fill Level
                                                        </strong>

                                                        <span
                                                            style={{
                                                                color:
                                                                    fillStatus.color,
                                                            }}
                                                        >
                                                            {fillLevel}%
                                                        </span>

                                                    </div>

                                                    <div className="popup-fill-bar">

                                                        <div
                                                            className="popup-fill-progress"
                                                            style={{
                                                                width: `${Math.min(
                                                                    fillLevel,
                                                                    100
                                                                )}%`,

                                                                background:
                                                                    getBinColor(
                                                                        fillLevel
                                                                    ),
                                                            }}
                                                        ></div>

                                                    </div>

                                                    <span
                                                        className="popup-fill-status"
                                                        style={{
                                                            color:
                                                                fillStatus.color,
                                                        }}
                                                    >
                                                        {fillStatus.label}
                                                    </span>

                                                </div>

                                                {/* Bin Status */}
                                                <p className="popup-bin-status">

                                                    <strong>
                                                        Status:
                                                    </strong>{" "}

                                                    <span
                                                        className="status-value"
                                                    >
                                                        {bin.status}
                                                    </span>

                                                </p>

                                                {/* Delete */}
                                                <button
                                                    className="delete-bin-button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            bin.binId
                                                        )
                                                    }
                                                >
                                                    Delete Bin
                                                </button>

                                            </div>

                                        </Popup>

                                    </Marker>
                                );
                            })}

                            {/* Selected new location */}
                            {selectedLocation && (
                                <Marker
                                    position={[
                                        selectedLocation.latitude,
                                        selectedLocation.longitude,
                                    ]}
                                >

                                    <Popup>

                                        <strong>
                                            New Bin Location
                                        </strong>

                                        <br />

                                        Latitude:{" "}
                                        {selectedLocation.latitude.toFixed(
                                            6
                                        )}

                                        <br />

                                        Longitude:{" "}
                                        {selectedLocation.longitude.toFixed(
                                            6
                                        )}

                                    </Popup>

                                </Marker>
                            )}

                        </MapContainer>

                    </div>

                    {/* Legend */}
                    <div className="map-legend">

                        <span>
                            <i className="legend-dot green"></i>
                            Below 70%
                        </span>

                        <span>
                            <i className="legend-dot orange"></i>
                            70% - 89%
                        </span>

                        <span>
                            <i className="legend-dot red"></i>
                            90% and above
                        </span>

                    </div>

                </div>

                {/* ================= ADD BIN ================= */}

                <div className="add-bin-card">

                    <div className="card-header">

                        <div>
                            <h3>
                                Add New Bin
                            </h3>

                            <p>
                                Select a location and enter
                                bin details.
                            </p>
                        </div>

                    </div>

                    <form onSubmit={handleSubmit}>

                        {/* Bin ID */}
                        <div className="form-group">

                            <label>
                                Bin ID
                            </label>

                            <input
                                type="text"
                                name="binId"
                                value={formData.binId}
                                onChange={handleChange}
                                placeholder="Example: BIN-001"
                                required
                            />

                        </div>

                        {/* Bin Name */}
                        <div className="form-group">

                            <label>
                                Bin Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Example: Main Street Bin"
                                required
                            />

                        </div>

                        {/* Location */}
                        <div className="form-group">

                            <label>
                                Location
                            </label>

                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Example: Gandhipuram"
                                required
                            />

                        </div>

                        {/* Coordinates */}
                        <div className="coordinates">

                            <div className="form-group">

                                <label>
                                    Latitude
                                </label>

                                <input
                                    type="number"
                                    name="latitude"
                                    value={formData.latitude}
                                    readOnly
                                    placeholder="Click map"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Longitude
                                </label>

                                <input
                                    type="number"
                                    name="longitude"
                                    value={formData.longitude}
                                    readOnly
                                    placeholder="Click map"
                                    required
                                />

                            </div>

                        </div>

                        {/* Location Help */}
                        <div className="location-help">
                            📍 Click on the map to
                            automatically select
                            latitude and longitude.
                        </div>

                        {/* Add Button */}
                        <button
                            type="submit"
                            className="add-bin-button"
                        >
                            + Add Bin
                        </button>

                    </form>

                </div>

            </div>

            {/* ================= BIN LIST ================= */}

            <div className="bin-list-card">

                <div className="card-header">

                    <div>
                        <h3>
                            All Bins
                        </h3>

                        <p>
                            Current bins registered
                            in the system.
                        </p>
                    </div>

                </div>

                {loading ? (

                    <div className="empty-state">
                        Loading bins...
                    </div>

                ) : bins.length === 0 ? (

                    <div className="empty-state">
                        No bins have been added yet.
                    </div>

                ) : (

                    <div className="bin-table-wrapper">

                        <table className="bin-table">

                            <thead>

                                <tr>

                                    <th>
                                        Bin ID
                                    </th>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Location
                                    </th>

                                    <th>
                                        Fill Level
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Coordinates
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {bins.map((bin) => {

                                    const fillLevel =
                                        bin.fillLevel || 0;

                                    const fillStatus =
                                        getFillStatus(
                                            fillLevel
                                        );

                                    return (
                                        <tr key={bin._id}>

                                            <td>
                                                <strong>
                                                    {bin.binId}
                                                </strong>
                                            </td>

                                            <td>
                                                {bin.name}
                                            </td>

                                            <td>
                                                {bin.location}
                                            </td>

                                            {/* Fill Level */}
                                            <td>

                                                <div className="table-fill-container">

                                                    <div className="table-fill-bar">

                                                        <div
                                                            className="table-fill-progress"
                                                            style={{
                                                                width: `${Math.min(
                                                                    fillLevel,
                                                                    100
                                                                )}%`,

                                                                background:
                                                                    getBinColor(
                                                                        fillLevel
                                                                    ),
                                                            }}
                                                        ></div>

                                                    </div>

                                                    <span
                                                        className="fill-badge"
                                                        style={{
                                                            color:
                                                                fillStatus.color,
                                                            background:
                                                                `${fillStatus.color}15`,
                                                        }}
                                                    >
                                                        {fillLevel}%
                                                    </span>

                                                </div>

                                            </td>

                                            {/* Status */}
                                            <td>

                                                <span className="bin-status-badge">
                                                    {bin.status}
                                                </span>

                                            </td>

                                            {/* Coordinates */}
                                            <td>

                                                {Number(
                                                    bin.latitude
                                                ).toFixed(6)}

                                                <br />

                                                {Number(
                                                    bin.longitude
                                                ).toFixed(6)}

                                            </td>

                                            {/* Delete */}
                                            <td>

                                                <button
                                                    className="table-delete-button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            bin.binId
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}

export default AdminBins;