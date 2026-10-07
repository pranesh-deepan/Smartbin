const Bin = require("../models/Bin");
const {
    createAutomaticJobForBin,
} = require("../controllers/jobController");


// ============================================================
// PROCESS BIN
// ============================================================

const processBin = async (bin) => {
    try {
        if (!bin) {
            return;
        }

        const fillLevel = Number(bin.fillLevel) || 0;

        console.log(
            `📦 Bin update detected: ${bin.binId} | Fill Level: ${fillLevel}%`
        );

        // Only create a job when fill level reaches 90%
        if (fillLevel < 90) {
            return;
        }

        await createAutomaticJobForBin(bin);

    } catch (error) {
        console.error(
            `❌ Error processing bin ${bin?.binId}:`,
            error
        );
    }
};


// ============================================================
// INITIAL HIGH-FILL CHECK
// ============================================================

const checkExistingHighFillBins = async () => {
    try {
        console.log(
            "🔎 Checking existing bins with fill level >= 90%..."
        );

        const bins = await Bin.find({
            status: "Active",
            fillLevel: {
                $gte: 90,
            },
        });

        console.log(
            `🔎 Found ${bins.length} high-fill bin(s).`
        );

        for (const bin of bins) {
            await processBin(bin);
        }

    } catch (error) {
        console.error(
            "❌ Initial high-fill bin check failed:",
            error
        );
    }
};


// ============================================================
// START BIN FILL MONITOR
// ============================================================

const startBinFillMonitor = async () => {
    try {
        console.log(
            "🚀 Starting SmartBin automatic fill-level monitor..."
        );

        // ----------------------------------------------------
        // CHECK EXISTING HIGH-FILL BINS
        // ----------------------------------------------------

        await checkExistingHighFillBins();

        // ----------------------------------------------------
        // START MONGODB CHANGE STREAM
        // ----------------------------------------------------

        const changeStream = Bin.watch(
            [
                {
                    $match: {
                        operationType: {
                            $in: [
                                "insert",
                                "update",
                                "replace",
                            ],
                        },
                    },
                },
            ],
            {
                fullDocument: "updateLookup",
            }
        );

        console.log(
            "👀 SmartBin is now watching MongoDB Bin changes..."
        );

        // ----------------------------------------------------
        // HANDLE CHANGES
        // ----------------------------------------------------

        changeStream.on("change", async (change) => {
            try {
                const bin = change.fullDocument;

                if (!bin) {
                    return;
                }

                await processBin(bin);

            } catch (error) {
                console.error(
                    "❌ Bin Change Stream processing error:",
                    error
                );
            }
        });

        // ----------------------------------------------------
        // HANDLE CHANGE STREAM ERRORS
        // ----------------------------------------------------

        changeStream.on("error", (error) => {
            console.error(
                "❌ SmartBin Change Stream error:",
                error
            );
        });

        changeStream.on("close", () => {
            console.log(
                "⚠️ SmartBin Bin Change Stream closed."
            );
        });

    } catch (error) {
        console.error(
            "❌ Failed to start SmartBin fill monitor:",
            error
        );
    }
};


module.exports = {
    startBinFillMonitor,
};