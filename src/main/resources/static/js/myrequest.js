const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "index.html";
}

window.addEventListener("DOMContentLoaded", function () {
    loadRequests();
});

function loadRequests() {
    fetch(`/request/student/${user.id}`)
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to load requests");
            }
            return res.json();
        })
        .then((data) => {
            const table = document.getElementById("requestTable");
            table.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">No requests found.</td>
                    </tr>
                `;
                return;
            }

            data.forEach((req) => {
                const hodName = req.hod && req.hod.username ? escapeHtml(req.hod.username) : "-";
                const endDate = formatDate(req.endDate);
                const dueDate = formatDate(req.certificateDueDate);
                const statusBadge = getRequestStatusHtml(req);
                const certificateStatus = getCertificateStatusHtml(req);

                const row = `
                    <tr>
                        <td data-label="Event / Reason">${escapeHtml(req.reason || "-")}</td>
                        <td data-label="HOD">${hodName}</td>
                        <td data-label="Status">${statusBadge}</td>
                        <td data-label="End Date">${endDate}</td>
                        <td data-label="Certificate Due">${dueDate}</td>
                        <td data-label="Certificate">${certificateStatus}</td>
                    </tr>
                `;

                table.innerHTML += row;
            });
        })
        .catch((err) => {
            console.error(err);
            document.getElementById("requestTable").innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">Unable to load requests.</td>
                </tr>
            `;
        });
}

function getRequestStatusHtml(req) {
    const status = String(req.status || "").toUpperCase();

    if (status === "APPROVED") {
        return `
            <span class="status-badge badge-approved">
                <i class="fa-solid fa-check"></i>
                Approved
            </span>
        `;
    }

    if (status === "REJECTED") {
        const remark = req.rejectionRemark
            ? `<div class="request-remark">Remark: ${escapeHtml(req.rejectionRemark)}</div>`
            : "";

        return `
            <div class="request-status-wrap">
                <span class="status-badge badge-rejected">
                    <i class="fa-solid fa-xmark"></i>
                    Rejected
                </span>
                ${remark}
            </div>
        `;
    }

    return `
        <span class="status-badge badge-pending">
            <i class="fa-solid fa-clock-rotate-left"></i>
            Pending
        </span>
    `;
}

function getCertificateStatusHtml(req) {
    if (!req.certificate) {
        return `<span class="not-uploaded-text">Not Uploaded</span>`;
    }

    const certStatus = String(req.certificate.status || "").toUpperCase();

    if (certStatus === "VERIFIED") {
        return `
            <span class="certificate-badge verified-badge">
                <i class="fa-solid fa-circle-check"></i>
                Verified
            </span>
        `;
    }

    if (certStatus === "REJECTED") {
        const remark = req.certificate.rejectionRemark
            ? `<div class="certificate-remark">Remark: ${escapeHtml(req.certificate.rejectionRemark)}</div>`
            : "";

        return `
            <div class="certificate-status-wrap">
                <span class="certificate-badge rejected-badge">
                    <i class="fa-solid fa-circle-xmark"></i>
                    Rejected
                </span>
                ${remark}
            </div>
        `;
    }

    return `
        <span class="certificate-badge">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            Uploaded
        </span>
    `;
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (isNaN(date.getTime())) return escapeHtml(value);
    
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    
    return `${dd}-${mm}-${yy}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}