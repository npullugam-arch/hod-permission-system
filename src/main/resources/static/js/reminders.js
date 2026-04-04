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

function getReminderStatus(req) {
    const dueDate = req.certificateDueDate ? new Date(req.certificateDueDate) : null;
    const today = new Date();

    if (dueDate && today > dueDate) {
        return "OVERDUE";
    }

    return "PENDING";
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

                const row = `
                    <tr>
                        <td><input type="checkbox" class="row-check" value="${req.id}"></td>
                        <td>${getStudentName(req)}</td>
                        <td>${req.reason || "—"}</td>
                        <td>${req.endDate || "—"}</td>
                        <td>${req.certificateDueDate || "—"}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <button class="remind-btn" onclick="sendSingleReminder('${getStudentName(req)}', '${req.reason || ""}')">Send Reminder</button>
                        </td>
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

function sendSingleReminder(studentName, eventName) {
    alert(`Reminder sent to ${studentName} for ${eventName}.`);
}

function sendBulkReminder() {
    const checked = document.querySelectorAll(".row-check:checked");

    if (checked.length === 0) {
        alert("Please select at least one student.");
        return;
    }

    alert(`Bulk reminder sent to ${checked.length} student(s).`);
}
