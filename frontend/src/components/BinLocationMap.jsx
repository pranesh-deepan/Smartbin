import { useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// Component that detects map clicks
function LocationMarker({ onLocationSelect }) {

    const [position, setPosition] = useState(null);

    useMapEvents({
        click(event) {

            const latitude = event.latlng.lat;
            const longitude = event.latlng.lng;

            const newPosition = {
                lat: latitude,
                lng: longitude,
            };

            setPosition(newPosition);

            onLocationSelect({
                latitude,
                longitude,
            });
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
}


// Main Map Component
function BinLocationMap({ onLocationSelect }) {

    // Default location: Tamil Nadu / India
    const defaultPosition = [11.1271, 78.6569];

    return (
        <div className="bin-location-map">

            <MapContainer
                center={defaultPosition}
                zoom={7}
                scrollWheelZoom={true}
                style={{
                    height: "400px",
                    width: "100%",
                }}
            >

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <LocationMarker
                    onLocationSelect={onLocationSelect}
                />

            </MapContainer>

        </div>
    );
}

export default BinLocationMap;