const validator = require("validator");

const validateRegister = (data) => {
    const errors = [];

    // Name Validation
    if (!data.name || data.name.trim() === "") {
        errors.push("Name is required");
    }

    // Email Validation
    if (!data.email || !validator.isEmail(data.email)) {
        errors.push("Valid email is required");
    }

    // Password Validation
    if (!data.password || data.password.length < 6) {
        errors.push("Password must be at least 6 characters");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};


const validateLogin = (data) => {
    const errors = [];

    // Email Validation
    if (!data.email || !validator.isEmail(data.email)) {
        errors.push("Valid email is required");
    }

    // Password Validation
    if (!data.password || data.password.length < 6) {
        errors.push("Password must be at least 6 characters");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateRegister,
    validateLogin,
};