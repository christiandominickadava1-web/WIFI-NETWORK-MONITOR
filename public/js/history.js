async function loadHistory() {

    const tableBody =
        document.getElementById(
            "historyTableBody"
        );

    try {

        const response =
            await fetch("/api/history");

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                "Unable to load history"
            );

        }

        const devices =
            data.devices || [];


        document
            .getElementById("historyCount")
            .textContent =
            devices.length;


        displayHistory(devices);

    }

    catch (error) {

        console.error(error);

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="loading-cell">

                    Unable to load device history.

                </td>

            </tr>

        `;

    }

}


function displayHistory(devices) {

    const tableBody =
        document.getElementById(
            "historyTableBody"
        );


    if (devices.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="loading-cell">

                    No device history yet.

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

                    ${formatDate(
                        device.firstSeen
                    )}

                </td>


                <td>

                    ${formatDate(
                        device.lastSeen
                    )}

                </td>

            </tr>

        `).join("");

}


function formatDate(date) {

    if (!date) {

        return "-";

    }

    return new Date(
        date
    ).toLocaleString();

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* REFRESH BUTTON */

document
    .getElementById(
        "refreshHistoryButton"
    )
    .addEventListener(
        "click",
        loadHistory
    );


loadHistory();