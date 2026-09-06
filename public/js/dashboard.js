let networkChart;


async function checkServer() {

    try {

        const response =
            await fetch("/api/status");

        const data =
            await response.json();


        if (data.success) {

            document
                .getElementById("serverStatus")
                .textContent = "System Online";


            document
                .getElementById("networkStatus")
                .textContent = "Online";

        }

    } catch (error) {

        document
            .getElementById("serverStatus")
            .textContent = "Server Offline";


        document
            .getElementById("networkStatus")
            .textContent = "Offline";

    }

}


async function loadDevices() {

    try {

        const response =
            await fetch("/api/devices");


        const data =
            await response.json();


        if (!data.success) {

            return;

        }


        const devices =
            data.devices || [];


        document
            .getElementById("deviceCount")
            .textContent =
            devices.length;


        displayDevices(devices);


        updateChart(devices.length);


        updateTime();

    }

    catch (error) {

        console.error(
            "Unable to load devices:",
            error
        );

    }

}


function displayDevices(devices) {

    const deviceList =
        document.getElementById("deviceList");


    if (devices.length === 0) {

        deviceList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📡
                </div>

                <h3>No devices found yet</h3>

                <p>
                    Your computer has not discovered
                    any local devices recently.
                </p>

            </div>

        `;

        return;

    }


    const previewDevices =
        devices.slice(0, 5);


    deviceList.innerHTML =
        previewDevices.map(device => `

            <div class="device-item">

                <div class="device-icon">
                    💻
                </div>


                <div class="device-info">

                    <h3>
                        ${escapeHTML(device.name)}
                    </h3>

                    <p>
                        ${escapeHTML(device.ip)}
                    </p>

                </div>


                <div class="device-status">

                    <span class="online-dot"></span>

                    Detected

                </div>

            </div>

        `).join("");

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function updateTime() {

    const now = new Date();


    document
        .getElementById("lastUpdate")
        .textContent =
        now.toLocaleTimeString();

}


function createChart() {

    const canvas =
        document.getElementById(
            "networkChart"
        );


    const ctx =
        canvas.getContext("2d");


    networkChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: [
                "Start"
            ],

            datasets: [

                {

                    label:
                        "Devices Detected",

                    data: [0],

                    borderColor:
                        "#4f8cff",

                    backgroundColor:
                        "rgba(79, 140, 255, 0.1)",

                    tension: 0.4,

                    fill: true

                }

            ]

        },


        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    labels: {

                        color:
                            "#ffffff"

                    }

                }

            },

            scales: {

                x: {

                    ticks: {

                        color:
                            "#91a1b5"

                    }

                },


                y: {

                    beginAtZero: true,

                    ticks: {

                        color:
                            "#91a1b5",

                        stepSize: 1

                    }

                }

            }

        }

    });

}


function updateChart(
    deviceCount
) {

    if (!networkChart) {

        return;

    }


    const time =
        new Date()
            .toLocaleTimeString();


    networkChart.data.labels.push(
        time
    );


    networkChart.data.datasets[0].data.push(
        deviceCount
    );


    // Keep only the latest 10 updates

    if (
        networkChart.data.labels.length > 10
    ) {

        networkChart.data.labels.shift();

        networkChart
            .data
            .datasets[0]
            .data
            .shift();

    }


    networkChart.update();

}


async function initializeDashboard() {

    createChart();

    await checkServer();

    await loadDevices();

}


initializeDashboard();


// Refresh safely every 30 seconds

setInterval(() => {

    loadDevices();

}, 30000);