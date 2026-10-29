
const Bin = require("../models/bin");
const DeviceMapping = require("../models/DeviceMapping");

const assignDevice = async (req, res) => {
  try {
    const { deviceId, binId } = req.body;

    if (!deviceId?.trim() || !binId?.trim()) {
      return res.status(400).json({
        success: false,
        message: "deviceId and binId are required",
      });
    }

    const bin = await Bin.findOne({ binId: binId.trim() });

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: "Bin not found. Create the bin first.",
      });
    }

    const mapping = await DeviceMapping.findOneAndUpdate(
      { deviceId: deviceId.trim() },
      { binId: bin.binId },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Device assigned to bin successfully",
      mapping,
    });
  } catch (error) {
    console.error("Device assignment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign device",
    });
  }
};

const getDeviceMappings = async (req, res) => {
  try {
    const mappings = await DeviceMapping.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      mappings,
    });
  } catch (error) {
    console.error("Get device mappings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch device mappings",
    });
  }
};

module.exports = { assignDevice, getDeviceMappings };
