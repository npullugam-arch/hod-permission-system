const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.top.location.href = "index.html";
}

window.onload = function () {
    loadReminderData();
};

function getStudentName(req) {
    if (req.student) {
        return req.student.name || req.student.username || req.student.fullName || "N/A";
    }
    return "N/A";
}

function normalizeDate(dateValue) {
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);
    return date;
}

function getReminderStatus(req) {
    const dueDate = normalizeDate(req.certificateDueDate);
    const today = normalizeDate(new Date());

    if (dueDate && today > dueDate) {
        return "OVERDUE";
    }

    return "PENDING";
}

function isReminderAvailable(req) {
    const today = normalizeDate(new Date());
    const endDate = normalizeDate(req.endDate);
    const dueDate = normalizeDate(req.certificateDueDate);

    if (!today || !endDate || !dueDate) {
        return false;
    }

    return today >= endDate && today <= dueDate;
}

function loadReminderData() {
    fetch(`/hod/${user.id}/requests`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load requests");
            }
            return res.json();
        })
        .then(data => {
            const table = document.getElementById("reminderTable");
            table.innerHTML = "";

            const reminderRequests = data.filter(req => req.status === "APPROVED" && !req.certificate);

            if (reminderRequests.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="7" class="empty-row">No pending certificate reminders found.</td>
                    </tr>
                `;
                return;
            }

            reminderRequests.forEach(req => {
                const status = getReminderStatus(req);
                const statusBadge = status === "OVERDUE"
                    ? `<span class="status-badge overdue">Overdue</span>`
                    : `<span class="status-badge pending">Pending</span>`;
                const actionHtml = isReminderAvailable(req)
                    ? `<button class="remind-btn" onclick="sendSingleReminder(${req.id}, '${escapeText(getStudentName(req))}', '${escapeText(req.reason || "")}')">Send Reminder</button>`
                    : `<span class="no-action-text">No action available</span>`;

                const row = `
                    <tr>
                        <td><input type="checkbox" class="row-check" value="${req.id}"></td>
                        <td>${escapeHtml(getStudentName(req))}</td>
                        <td>${escapeHtml(req.reason || "-")}</td>
                        <td>${escapeHtml(req.endDate || "-")}</td>
                        <td>${escapeHtml(req.certificateDueDate || "-")}</td>
                        <td>${statusBadge}</td>
                        <td>${actionHtml}</td>
                    </tr>
                `;
                table.innerHTML += row;
            });
        })
        .catch(err => {
            console.error(err);
            document.getElementById("reminderTable").innerHTML = `
                <tr>
                    <td colspan="7" class="empty-row">Unable to load reminders.</td>
                </tr>
            `;
        });
}

function sendSingleReminder(requestId, studentName, eventName) {
    const confirmed = confirm(`Send reminder to ${studentName} for ${eventName || "this request"} now?`);
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
            loadReminderData();
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Error while sending reminder.");
        });
}

function sendBulkReminder() {
    const checked = document.querySelectorAll(".row-check:checked");

    if (checked.length === 0) {
        alert("Please select at least one student.");
        return;
    }

    const requestIds = Array.from(checked).map(item => item.value);

    Promise.all(
        requestIds.map(requestId =>
            fetch(`/notification/send-reminder/${requestId}`, {
                method: "POST"
            }).then(async res => {
                const text = await res.text();
                if (!res.ok) {
                    throw new Error(text || `Failed to send reminder for request ${requestId}`);
                }
                return text;
            })
        )
    )
        .then(() => {
            alert(`Bulk reminder sent to ${checked.length} student(s).`);
            loadReminderData();
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Error while sending bulk reminders.");
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
