const { exec } = require("child_process");
const os = require("os");


/* =========================
   GET ACTIVE NETWORK
========================= */

function getActiveIPv4Network() {

    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {

        const networks = interfaces[name];

        for (const network of networks) {

            if (
                network.family === "IPv4" &&
                !network.internal &&
                !network.address.startsWith("169.254.")
            ) {

                return {
                    interface: name,
                    ip: network.address,
                    mac: network.mac,
                    netmask: network.netmask
                };

            }

        }

    }

    return null;

}


/* =========================
   PING ONE LOCAL DEVICE
========================= */

function pingDevice(ip) {

    return new Promise((resolve) => {

        exec(
            `ping -n 1 -w 300 ${ip}`,

            (error) => {

                resolve(!error);

            }

        );

    });

}


/* =========================
   READ ARP ENTRY
========================= */

function getARPTable() {

    return new Promise((resolve) => {

        exec("arp -a", (error, stdout) => {

            if (error) {

                resolve([]);
                return;

            }

            const devices = [];

            const lines = stdout.split("\n");

            for (const line of lines) {

                const parts =
                    line.trim().split(/\s+/);

                if (parts.length < 3) {
                    continue;
                }

                const ip = parts[0];
                const mac = parts[1];
                const type = parts[2];

                const ipPattern =
                    /^(\d{1,3}\.){3}\d{1,3}$/;

                if (!ipPattern.test(ip)) {
                    continue;
                }

                if (
                    ip.endsWith(".255") ||
                    ip === "255.255.255.255"
                ) {
                    continue;
                }

                if (
                    mac === "ff-ff-ff-ff-ff-ff"
                ) {
                    continue;
                }

                devices.push({
                    ip,
                    mac,
                    type
                });

            }

            resolve(devices);

        });

    });

}


/* =========================
   DISCOVER LOCAL DEVICES
========================= */

async function discoverNetwork() {

    const network =
        getActiveIPv4Network();

    if (!network) {

        return [];

    }

    const parts =
        network.ip.split(".");

    const subnet =
        `${parts[0]}.${parts[1]}.${parts[2]}`;

    /*
       Only check the local network.

       Example:
       192.168.1.1
       through
       192.168.1.254
    */

    const addresses = [];

    for (let i = 1; i <= 254; i++) {

        const ip =
            `${subnet}.${i}`;

        /*
           Skip this computer.
        */

        if (ip === network.ip) {
            continue;
        }

        addresses.push(ip);

    }


    /*
       LIMITED PARALLEL CHECKING

       Checks a small number at once
       instead of running 254 commands
       simultaneously.
    */

    const CONCURRENCY = 20;

    const onlineIPs = [];


    for (
        let i = 0;
        i < addresses.length;
        i += CONCURRENCY
    ) {

        const batch =
            addresses.slice(
                i,
                i + CONCURRENCY
            );


        const results =
            await Promise.all(

                batch.map(
                    async (ip) => {

                        const online =
                            await pingDevice(ip);

                        return {
                            ip,
                            online
                        };

                    }
                )

            );


        for (const result of results) {

            if (result.online) {

                onlineIPs.push(
                    result.ip
                );

            }

        }

    }


    return onlineIPs;

}


/* =========================
   MAIN NETWORK SCAN
========================= */

async function scanNetwork() {

    try {

        const network =
            getActiveIPv4Network();


        if (!network) {

            return {

                success: false,

                safeMode: true,

                message:
                    "No active local network found.",

                devices: []

            };

        }


        /*
           Discover reachable devices.
        */

        const onlineIPs =
            await discoverNetwork();


        /*
           Read ARP table after discovery.

           Windows may now have MAC
           addresses for some devices.
        */

        const arpDevices =
            await getARPTable();


        const devices = [];


        for (const ip of onlineIPs) {

            const arpDevice =
                arpDevices.find(
                    device =>
                        device.ip === ip
                );


            devices.push({

                ip,

                mac:
                    arpDevice
                        ? arpDevice.mac
                        : "Unknown",

                type:
                    arpDevice
                        ? arpDevice.type
                        : "dynamic",

                name:
                    "Unknown Device",

                status:
                    "online"

            });

        }


        return {

            success: true,

            safeMode: true,

            scanMethod:
                "Local network discovery",

            network: {

                interface:
                    network.interface,

                ip:
                    network.ip,

                subnet:
                    network.netmask

            },

            devices

        };

    }

    catch (error) {

        console.error(
            "Network discovery error:",
            error
        );


        return {

            success: false,

            safeMode: true,

            message:
                "Unable to scan the local network.",

            devices: []

        };

    }

}


/* =========================
   COMPUTER NETWORK INFO
========================= */

function getComputerNetworkInfo() {

    const interfaces =
        os.networkInterfaces();

    const networkInfo = [];


    for (
        const name of Object.keys(interfaces)
    ) {

        for (
            const network of interfaces[name]
        ) {

            if (
                network.family === "IPv4" &&
                !network.internal
            ) {

                networkInfo.push({

                    interface: name,

                    ip:
                        network.address,

                    mac:
                        network.mac,

                    netmask:
                        network.netmask

                });

            }

        }

    }

    return networkInfo;

}


module.exports = {

    scanNetwork,

    getComputerNetworkInfo

};