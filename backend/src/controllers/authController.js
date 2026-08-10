const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { validateRegister ,validateLogin} = require("../validations/authValidation");

const register = async (req, res) => {
    try {

        // Validate Request
        const { isValid, errors } = validateRegister(req.body);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                errors,
            });
        }

        const { name, email, password, role } = req.body;

        // Check Existing User
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        // Encrypt Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
        });

        await user.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const login = async (req, res) => {
    try {
        // Validate Request
        const { isValid, errors } = validateLogin(req.body);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                errors,
            });
        }

        const { email, password } = req.body;

        // Find User
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check Password
        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check Active Status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive",
            });
        }

        const token = jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (
            latitude === undefined ||
            longitude === undefined ||
            isNaN(latitude) ||
            isNaN(longitude)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid latitude and longitude are required",
            });
        }

        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({
                success: false,
                message: "Latitude must be between -90 and 90",
            });
        }

        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: "Longitude must be between -180 and 180",
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.currentLocation = {
            latitude,
            longitude,
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Location updated successfully",
            currentLocation: user.currentLocation,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const updateAvailability = async (req, res) => {
    try {
        const { availability } = req.body;

        // Validate availability
        if (!availability || !["Available", "Busy"].includes(availability)) {
            return res.status(400).json({
                success: false,
                message: "Availability must be either Available or Busy",
            });
        }

        // Find logged-in user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update availability
        user.availability = availability;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Availability updated successfully",
            availability: user.availability,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    register,login,getMe,updateLocation,updateAvailability,
};


