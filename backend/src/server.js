require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const {
    startBinFillMonitor,
} = require("./services/binFillMonitor");

const PORT = process.env.PORT || 5000;


// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
    try {
        // ----------------------------------------------------
        // CONNECT DATABASE
        // ----------------------------------------------------

        await connectDB();

        // ----------------------------------------------------
        // START BIN FILL MONITOR
        // ----------------------------------------------------

        await startBinFillMonitor();

        // ----------------------------------------------------
        // START EXPRESS SERVER
        // ----------------------------------------------------

        app.listen(PORT, () => {
            console.log(
                `🚀 Server is running on http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "❌ Failed to start server:",
            error
        );

        process.exit(1);
    }
};


startServer();