
const deviceAuth = (req, res, next) => {
  const expectedToken = process.env.ESP32_DEVICE_TOKEN;
  const receivedToken = req.get("X-Device-Token");

  if (!expectedToken) {
    return res.status(500).json({
      success: false,
      message: "Device authentication is not configured",
    });
  }

  if (!receivedToken || receivedToken !== expectedToken) {
    return res.status(401).json({
      success: false,
      message: "Invalid device token",
    });
  }

  next();
};

module.exports = { deviceAuth };
