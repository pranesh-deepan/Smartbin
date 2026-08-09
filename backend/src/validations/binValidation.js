const validateBin = (data) => {
    const errors = [];

    // Bin ID Validation
    if (!data.binId || data.binId.trim() === "") {
        errors.push("Bin ID is required");
    }

    // Bin Name Validation
    if (!data.name || data.name.trim() === "") {
        errors.push("Bin name is required");
    }

    // Location Validation
    if (!data.location || data.location.trim() === "") {
        errors.push("Location is required");
    }

    // Latitude Validation
    if (
        data.latitude === undefined ||
        data.latitude === null ||
        isNaN(data.latitude)
    ) {
        errors.push("Valid latitude is required");
    } else if (data.latitude < -90 || data.latitude > 90) {
        errors.push("Latitude must be between -90 and 90");
    }

    // Longitude Validation
    if (
        data.longitude === undefined ||
        data.longitude === null ||
        isNaN(data.longitude)
    ) {
        errors.push("Valid longitude is required");
    } else if (data.longitude < -180 || data.longitude > 180) {
        errors.push("Longitude must be between -180 and 180");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateBin,
};