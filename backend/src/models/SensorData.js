
const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: true,
      trim: true,
    },
    fillLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

module.exports = mongoose.model("SensorData", sensorDataSchema);
