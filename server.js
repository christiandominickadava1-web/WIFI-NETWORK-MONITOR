const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const {
    scanNetwork,
    getComputerNetworkInfo
} = require("./services/networkScanner");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(
    __dirname,
    "data",
    "devices.json"
);

app.use(cors());

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* =========================
   SAFE HISTORY FUNCTIONS
========================= */

function readDeviceHistory() {

    try {

        if (!fs.existsSync(DATA_FILE)) {

            fs.writeFileSync(
                DATA_FILE,
                "[]"
            );

        }

        const data =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        if (!data.trim()) {

            return [];

        }

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "History read error:",
            error
        );

        return [];

    }

}


function saveDeviceHistory(history) {

    try {

        fs.writeFileSync(
            DATA_FILE,

            JSON.stringify(
                history,
                null,
                2
            )

        );

    } catch (error) {

        console.error(
            "History save error:",
            error
        );

    }

}


function updateDeviceHistory(devices) {

    const history =
        readDeviceHistory();

    const now =
        new Date().toISOString();


    for (const device of devices) {

        const existingDevice =
            history.find(item =>
                item.ip === device.ip &&
                item.mac === device.mac
            );


        if (existingDevice) {

            existingDevice.lastSeen =
                now;

            existingDevice.name =
                device.name;

            existingDevice.type =
                device.type;

        } else {

            history.push({

                name:
                    device.name ||
                    "Unknown Device",

                ip:
                    device.ip,

                mac:
                    device.mac,

                type:
                    device.type ||
                    "unknown",

                firstSeen:
                    now,

                lastSeen:
                    now

            });

        }

    }


    saveDeviceHistory(history);

    return history;

}


/* =========================
   SERVER STATUS
========================= */

app.get(
    "/api/status",

    (req, res) => {

        res.json({

            success: true,

            message:
                "WiFi Network Monitor Server is Running!",

            status:
                "online",

            safeMode:
                true

        });

    }
);


/* =========================
   SAFE DEVICE DETECTION
========================= */

app.get(
    "/api/devices",

    async (req, res) => {

        try {

            const result =
                await scanNetwork();


            const devices =
                result.devices || [];


            updateDeviceHistory(
                devices
            );


            res.json({

                ...result,

                safeMode:
                    true

            });

        } catch (error) {

            console.error(
                "Network scan error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to read local network information."

            });

        }

    }
);


/* =========================
   DEVICE HISTORY
========================= */

app.get(
    "/api/history",

    (req, res) => {

        const history =
            readDeviceHistory();


        res.json({

            success: true,

            safeMode:
                true,

            devices:
                history

        });

    }
);


/* =========================
   COMPUTER NETWORK INFO
========================= */

app.get(
    "/api/network-info",

    (req, res) => {

        try {

            const networkInfo =
                getComputerNetworkInfo();


            res.json({

                success: true,

                safeMode:
                    true,

                networkInfo

            });

        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Unable to read network information."

            });

        }

    }
);


/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {

    console.log(
        "================================="
    );

    console.log(
        " WiFi Network Monitor"
    );

    console.log(
        ` Server running: http://localhost:${PORT}`
    );

    console.log(
        " Mode: SAFE READ-ONLY"
    );

    console.log(
        "================================="
    );

});