let allDevices = [];


async function loadDevices() {

    const tableBody =
        document.getElementById(
            "devicesTableBody"
        );


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="loading-cell">

                Loading devices...

            </td>

        </tr>

    `;


    try {

        const response =
            await fetch("/api/devices");


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                "Unable to load devices"
            );

        }


        allDevices =
            data.devices || [];


        document
            .getElementById("totalDevices")
            .textContent =
            allDevices.length;


        displayDevices(allDevices);

    }

    catch (error) {

        console.error(error);


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="loading-cell">

                    Unable to load local
                    network information.

                </td>

            </tr>

        `;

    }

}


function displayDevices(devices) {

    const tableBody =
        document.getElementById(
            "devicesTableBody"
        );


    if (devices.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="loading-cell">

                    No devices detected.

                </td>

            </tr>

        `;

        return;

    }


    tableBody.innerHTML =
        devices.map(device => `

            <tr>

                <td>

                    <div class="table-device">

                        <div class="table-device-icon">
                            💻
                        </div>


                        <strong>

                            ${escapeHTML(
                                device.name ||
                                "Unknown Device"
                            )}

                        </strong>

                    </div>

                </td>


                <td>

                    ${escapeHTML(
                        device.ip || "-"
                    )}

                </td>


                <td class="mac-address">

                    ${escapeHTML(
                        device.mac || "-"
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        device.type || "-"
                    )}

                </td>


                <td>

                    <span class="status-badge">

                        <span
                            class="online-dot">
                        </span>

                        Detected

                    </span>

                </td>

            </tr>

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


/* SEARCH */

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .toLowerCase()
                    .trim();


            const filteredDevices =
                allDevices.filter(device => {

                    return (

                        String(device.name || "")
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(device.ip || "")
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(device.mac || "")
                            .toLowerCase()
                            .includes(search)

                    );

                });


            displayDevices(
                filteredDevices
            );

        }
    );


/* REFRESH */

document
    .getElementById("refreshButton")
    .addEventListener(
        "click",
        loadDevices
    );


/* START */

loadDevices();