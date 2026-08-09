const validateSensorData = (data) => {
    const errors = [];

    // Bin ID Validation
    if (!data.binId || data.binId.trim() === "") {
        errors.push("Bin ID is required");
    }

    // Fill Level Validation
    if (
        data.fillLevel === undefined ||
        data.fillLevel === null ||
        isNaN(data.fillLevel)
    ) {
        errors.push("Valid fill level is required");
    } else if (data.fillLevel < 0 || data.fillLevel > 100) {
        errors.push("Fill level must be between 0 and 100");
    }

    // Gas Level Validation
    if (
        data.gasLevel !== undefined &&
        data.gasLevel !== null &&
        isNaN(data.gasLevel)
    ) {
        errors.push("Gas level must be a valid number");
    } else if (data.gasLevel < 0) {
        errors.push("Gas level cannot be negative");
    }

    // Temperature Validation
    if (
        data.temperature !== undefined &&
        data.temperature !== null &&
        isNaN(data.temperature)
    ) {
        errors.push("Temperature must be a valid number");
    }

    // Battery Level Validation
    if (
        data.batteryLevel !== undefined &&
        data.batteryLevel !== null &&
        isNaN(data.batteryLevel)
    ) {
        errors.push("Battery level must be a valid number");
    } else if (
        data.batteryLevel !== undefined &&
        data.batteryLevel !== null &&
        (data.batteryLevel < 0 || data.batteryLevel > 100)
    ) {
        errors.push("Battery level must be between 0 and 100");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateSensorData,
};