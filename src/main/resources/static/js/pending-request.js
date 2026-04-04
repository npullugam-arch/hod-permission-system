const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.top.location.href = "index.html";
}

window.onload = function () {
    loadPendingRequests();
};

function getStudentName(req) {
    if (req.student) {
        return req.student.name || req.student.username || req.student.fullName || "N/A";
    }
    return "N/A";
}

function loadPendingRequests() {
    fetch(`/hod/${user.id}/requests`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load requests");
            }
            return res.json();
        })
        .then(data => {
            const table = document.getElementById("pendingTable");
            table.innerHTML = "";

            const pendingRequests = data.filter(req => req.status === "PENDING");

            if (pendingRequests.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">No pending requests found.</td>
                    </tr>
                `;
                return;
            }

            pendingRequests.forEach(req => {
                const row = `
                    <tr>
                        <td>${getStudentName(req)}</td>
                        <td>${req.reason || "—"}</td>
                        <td>${req.startDate || "—"}</td>
                        <td>${req.endDate || "—"}</td>
                        <td>${req.requestDate || "—"}</td>
                        <td>
                            <div class="action-group">
                                <button class="approve-btn" onclick="approveRequest(${req.id})">Approve</button>
                                <button class="reject-btn" onclick="rejectRequest(${req.id})">Reject</button>
                            </div>
                        </td>
                    </tr>
                `;
                table.innerHTML += row;
            });
        })
        .catch(err => {
            console.error(err);
            document.getElementById("pendingTable").innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">Unable to load pending requests.</td>
                </tr>
            `;
        });
}

function approveRequest(id) {
    const approvalRemark = "Your leave request has been approved by the HOD.";

    fetch(`/request/approve/${id}?remark=${encodeURIComponent(approvalRemark)}`, {
        method: "PUT"
    })
        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                console.error("Approve API error:", errorText);
                throw new Error("Failed to approve request");
            }
            return res.json();
        })
        .then(() => {
            alert("The leave request has been approved successfully.");
            loadPendingRequests();
        })
        .catch(err => {
            console.error(err);
            alert("Error while approving request.");
        });
}

function rejectRequest(id) {
    const remark = prompt("Enter remark for rejection:");

    if (remark === null) {
        return;
    }

    if (remark.trim() === "") {
        alert("Rejection remark is required.");
        return;
    }

    fetch(`/request/reject/${id}?remark=${encodeURIComponent(remark.trim())}`, {
        method: "PUT"
    })
        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                console.error("Reject API error:", errorText);
                throw new Error("Failed to reject request");
            }
            return res.json();
        })
        .then(() => {
            alert("The leave request has been rejected successfully.");
            loadPendingRequests();
        })
        .catch(err => {
            console.error(err);
            alert("Error while rejecting request.");
        });
}
