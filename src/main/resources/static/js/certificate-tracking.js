const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.top.location.href = "index.html";
}

window.onload = function () {
    loadCertificateTracking();
};

function getStudentName(req) {
    if (req.student) {
        return req.student.name || req.student.username || req.student.fullName || "N/A";
    }
    return "N/A";
}

function getCertificateStatus(req) {
    if (req.certificate) {
        if (req.certificate.status === "VERIFIED") {
            return "VERIFIED";
        }
        return "SUBMITTED";
    }

    const today = new Date();
    const dueDate = req.certificateDueDate ? new Date(req.certificateDueDate) : null;

    if (dueDate && today > dueDate) {
        return "OVERDUE";
    }

    return "PENDING";
}

function getStatusBadge(status) {
    if (status === "VERIFIED") {
        return `<span class="status-badge verified">Verified</span>`;
    }

    if (status === "SUBMITTED") {
        return `<span class="status-badge submitted">Submitted</span>`;
    }

    if (status === "OVERDUE") {
        return `<span class="status-badge overdue">Overdue</span>`;
    }

    return `<span class="status-badge pending">Pending</span>`;
}

function getActionButtons(req, status) {
    if (req.certificate && req.certificate.filePath) {
        const filePath = req.certificate.filePath;
        const certificateId = req.certificate.id;

        let buttons = `
            <a href="${filePath}" target="_blank" class="view-btn">View Certificate</a>
        `;

        if (req.certificate.status !== "VERIFIED") {
            buttons += `
                <button class="verify-btn" onclick="verifyCertificate(${certificateId})">Verify</button>
            `;
        }

        return buttons;
    }

    return `
        <button class="remind-btn" onclick="sendReminder('${escapeText(getStudentName(req))}', '${escapeText(req.reason || "")}')">
            Remind
        </button>
    `;
}

function loadCertificateTracking() {
    fetch(`/hod/${user.id}/requests`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load requests");
            }
            return res.json();
        })
        .then(data => {
            const table = document.getElementById("trackingTable");
            table.innerHTML = "";

            const approvedRequests = data.filter(req => req.status === "APPROVED");

            if (approvedRequests.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">No approved requests found.</td>
                    </tr>
                `;
                return;
            }

            approvedRequests.forEach(req => {
                const status = getCertificateStatus(req);
                const action = getActionButtons(req, status);

                const row = `
                    <tr>
                        <td>${getStudentName(req)}</td>
                        <td>${req.reason || "—"}</td>
                        <td>${req.endDate || "—"}</td>
                        <td>${req.certificateDueDate || "—"}</td>
                        <td>${getStatusBadge(status)}</td>
                        <td>${action}</td>
                    </tr>
                `;

                table.innerHTML += row;
            });
        })
        .catch(err => {
            console.error(err);
            document.getElementById("trackingTable").innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">Unable to load certificate tracking data.</td>
                </tr>
            `;
        });
}

function verifyCertificate(certificateId) {
    fetch(`/certificate/verify/${certificateId}`, {
        method: "POST"
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to verify certificate");
            }
            return res.json();
        })
        .then(() => {
            alert("Certificate verified successfully!");
            loadCertificateTracking();
        })
        .catch(err => {
            console.error(err);
            alert("Error while verifying certificate.");
        });
}

function sendReminder(studentName, eventName) {
    alert(`Reminder sent to ${studentName} for ${eventName}.`);
}

function escapeText(value) {
    return String(value).replace(/'/g, "\\'");
}