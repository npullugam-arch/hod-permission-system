const user = JSON.parse(localStorage.getItem("user"));

const CERTIFICATE_REQUIRED_REASONS = [
    "HACKATHON",
    "SEMINAR",
    "MEDICAL LEAVE",
    "SPORTS EVENT",
    "WORKSHOP / TRAINING",
    "INTERNSHIP"
];

if (!user) {
    window.top.location.href = "index.html";
}

window.onload = function () {
    loadCertificateTracking();
};

function getStudentName(req) {
    if (req.student) {
        return req.student.name || req.student.username || req.student.fullName || "Student";
    }
    return "Student";
}

function normalizeDate(dateValue) {
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);
    return date;
}

function normalizeReason(reason) {
    return String(reason || "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
}

function isCertificateRequired(reason) {
    return CERTIFICATE_REQUIRED_REASONS.includes(normalizeReason(reason));
}

function isDateInReminderWindow(today, endDate, dueDate) {
    if (!today || !endDate || !dueDate) return false;
    return today >= endDate && today <= dueDate;
}

function hasUploadedCertificate(req) {
    return !!(req.certificate && req.certificate.filePath);
}

function getCertificateStatus(req) {
    if (req.certificate) {
        const certStatus = (req.certificate.status || "").toUpperCase();

        if (certStatus === "VERIFIED") {
            return "VERIFIED";
        }

        if (certStatus === "REJECTED") {
            return "REJECTED";
        }

        return "SUBMITTED";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = normalizeDate(req.certificateDueDate);

    if (dueDate && today > dueDate) {
        return "OVERDUE";
    }

    return "PENDING";
}

function getStatusBadge(status, req) {
    if (status === "VERIFIED") {
        return `<span class="status-badge verified">Verified</span>`;
    }

    if (status === "REJECTED") {
        const remark = req.certificate && req.certificate.rejectionRemark
            ? `<div class="remark-text">Remark: ${escapeHtml(req.certificate.rejectionRemark)}</div>`
            : "";

        return `
            <div class="status-wrap">
                <span class="status-badge rejected">Rejected</span>
                ${remark}
            </div>
        `;
    }

    if (status === "SUBMITTED") {
        return `<span class="status-badge submitted">Submitted</span>`;
    }

    if (status === "OVERDUE") {
        return `<span class="status-badge overdue">Overdue</span>`;
    }

    return `<span class="status-badge pending">Pending</span>`;
}

function getActionButtons(req) {
    if (req.certificate && req.certificate.filePath) {
        const filePath = req.certificate.filePath;
        const certificateId = req.certificate.id;
        const certificateStatus = (req.certificate.status || "SUBMITTED").toUpperCase();

        if (certificateStatus === "VERIFIED") {
            return `<span class="no-action-text">No action needed</span>`;
        }

        if (certificateStatus === "REJECTED") {
            return `
                <div class="action-btn-group">
                    <a href="${filePath}" target="_blank" class="view-btn">View</a>
                    <button class="reject-btn" onclick="rejectCertificate(${certificateId})">Update Remark</button>
                </div>
            `;
        }

        return `
            <div class="action-btn-group">
                <a href="${filePath}" target="_blank" class="view-btn">View</a>
                <button class="verify-btn" onclick="verifyCertificate(${certificateId})">Verify</button>
                <button class="reject-btn" onclick="rejectCertificate(${certificateId})">Reject</button>
            </div>
        `;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = normalizeDate(req.endDate);
    const dueDate = normalizeDate(req.certificateDueDate);

    if (isDateInReminderWindow(today, endDate, dueDate) && !hasUploadedCertificate(req)) {
        return `
            <button
                class="remind-btn"
                title="Send Reminder"
                onclick="sendReminder(${req.id}, '${escapeText(getStudentName(req))}')"
            >
                Remind
            </button>
        `;
    }

    return `<span class="no-action-text">No action available</span>`;
}

function loadCertificateTracking() {
    fetch(`/request/hod/${user.id}`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load requests");
            }
            return res.json();
        })
        .then(data => {
            const table = document.getElementById("trackingTable");
            table.innerHTML = "";

            if (!data || data.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">No requests found.</td>
                    </tr>
                `;
                return;
            }

            const approvedCertificateRequests = data.filter(req => {
                const status = (req.status || "").toUpperCase();
                return status === "APPROVED" && isCertificateRequired(req.reason);
            });

            if (approvedCertificateRequests.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">No approved certificate-required requests found.</td>
                    </tr>
                `;
                return;
            }

            approvedCertificateRequests.forEach(req => {
                const status = getCertificateStatus(req);
                const action = getActionButtons(req);

                const row = `
                    <tr>
                        <td>${escapeHtml(getStudentName(req))}</td>
                        <td>${escapeHtml(req.reason || "-")}</td>
                        <td>${escapeHtml(req.endDate || "-")}</td>
                        <td>${escapeHtml(req.certificateDueDate || "-")}</td>
                        <td>${getStatusBadge(status, req)}</td>
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
    const confirmed = confirm("Are you sure you want to verify this certificate?");
    if (!confirmed) return;

    fetch(`/certificate/verify/${certificateId}`, {
        method: "POST"
    })
        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to verify certificate");
            }
            return res.json();
        })
        .then(() => {
            alert("Certificate verified successfully!");
            loadCertificateTracking();
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Error while verifying certificate.");
        });
}

function rejectCertificate(certificateId) {
    const remark = prompt("Enter rejection remark:");

    if (remark === null) {
        return;
    }

    if (!remark.trim()) {
        alert("Rejection remark is required.");
        return;
    }

    fetch(`/certificate/reject/${certificateId}?remark=${encodeURIComponent(remark.trim())}`, {
        method: "POST"
    })
        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to reject certificate");
            }
            return res.json();
        })
        .then(() => {
            alert("Certificate rejected successfully!");
            loadCertificateTracking();
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Error while rejecting certificate.");
        });
}

function sendReminder(requestId, studentName) {
    const confirmed = confirm(`Send reminder to ${studentName} now?`);
    if (!confirmed) return;

    fetch(`/notification/send-reminder/${requestId}`, {
        method: "POST"
    })
        .then(async res => {
            const text = await res.text();

            if (!res.ok) {
                throw new Error(text || "Failed to send reminder");
            }

            return text;
        })
        .then(() => {
            alert(`Reminder sent successfully to ${studentName}.`);
            loadCertificateTracking();
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Error while sending reminder.");
        });
}

function escapeText(value) {
    return String(value).replace(/'/g, "\\'");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
