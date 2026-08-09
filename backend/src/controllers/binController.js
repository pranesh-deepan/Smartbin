const Bin = require("../models/Bin");
const { validateBin } = require("../validations/binValidation");

const createBin = async (req, res) => {
    try {
        // Validate Request
        const { isValid, errors } = validateBin(req.body);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                errors,
            });
        }

        const {
            binId,
            name,
            location,
            latitude,
            longitude,
        } = req.body;

        // Check if Bin ID already exists
        const existingBin = await Bin.findOne({ binId });

        if (existingBin) {
            return res.status(400).json({
                success: false,
                message: "Bin ID already exists",
            });
        }

        // Create Bin
        const bin = new Bin({
            binId,
            name,
            location,
            latitude,
            longitude,
        });

        await bin.save();

        return res.status(201).json({
            success: true,
            message: "Bin created successfully",
            bin,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const getAllBins = async (req, res) => {
    try {
        const bins = await Bin.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: bins.length,
            bins,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const getBinById = async (req, res) => {
    try {
        const { binId } = req.params;

        const bin = await Bin.findOne({ binId });

        if (!bin) {
            return res.status(404).json({
                success: false,
                message: "Bin not found",
            });
        }

        return res.status(200).json({
            success: true,
            bin,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const updateBin = async (req, res) => {
    try {
        const { binId } = req.params;

        const {
            name,
            location,
            latitude,
            longitude,
            status
        } = req.body;

        const bin = await Bin.findOne({ binId });

        if (!bin) {
            return res.status(404).json({
                success: false,
                message: "Bin not found",
            });
        }

        if (name !== undefined) {
            bin.name = name;
        }

        if (location !== undefined) {
            bin.location = location;
        }

        if (latitude !== undefined) {
            bin.latitude = latitude;
        }

        if (longitude !== undefined) {
            bin.longitude = longitude;
        }

        if (status !== undefined) {
            bin.status = status;
        }

        await bin.save();

        return res.status(200).json({
            success: true,
            message: "Bin updated successfully",
            bin,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const deleteBin = async (req, res) => {
    try {
        const { binId } = req.params;

        const bin = await Bin.findOne({ binId });

        if (!bin) {
            return res.status(404).json({
                success: false,
                message: "Bin not found",
            });
        }

        await Bin.deleteOne({ binId });

        return res.status(200).json({
            success: true,
            message: "Bin deleted successfully",
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
    createBin,
    getAllBins,
    getBinById,
    updateBin,
    deleteBin,
};