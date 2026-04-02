const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "index.html";
}

window.onload = function () {
    setStudentInfo();
    loadHods();
    loadRequests();
};

function setStudentInfo() {
    const studentNameEl = document.getElementById("studentName");
    const userInitialEl = document.getElementById("userInitial");

    if (studentNameEl) {
        studentNameEl.textContent = user.username || "Student";
    }

    if (userInitialEl) {
        userInitialEl.textContent = (user.username || "S").charAt(0).toUpperCase();
    }
}

function loadHods() {
    fetch("http://localhost:8080/request/hods")
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load HOD list");
            }
            return res.json();
        })
        .then(data => {
            const hodSelect = document.getElementById("hodSelect");
            hodSelect.innerHTML = `<option value="">-- Select HOD --</option>`;

            data.forEach(hod => {
                hodSelect.innerHTML += `<option value="${hod.id}">${hod.username}</option>`;
            });
        })
        .catch(err => {
            console.error(err);
            const hodSelect = document.getElementById("hodSelect");
            hodSelect.innerHTML = `<option value="">Unable to load HODs</option>`;
        });
}

function createRequest() {
    const hodId = document.getElementById("hodSelect").value;
    const reason = document.getElementById("reason").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const description = document.getElementById("description").value.trim();

    if (!hodId) {
        alert("Please select an HOD.");
        return;
    }

    if (!reason || !startDate || !endDate || !description) {
        alert("Please fill all fields.");
        return;
    }

    if (startDate > endDate) {
        alert("Start date cannot be greater than end date.");
        return;
    }

    const requestData = {
        reason: reason,
        description: description,
        startDate: startDate,
        endDate: endDate,
        student: { id: user.id },
        hod: { id: hodId }
    };

    fetch("http://localhost:8080/request/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Failed to create request");
        }
        return res.json();
    })
    .then(data => {
        alert("Request submitted successfully!");
        clearForm();
        loadRequests();
    })
    .catch(err => {
        console.error(err);
        alert("Error while submitting request.");
    });
}

function clearForm() {
    document.getElementById("hodSelect").value = "";
    document.getElementById("reason").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("description").value = "";
}

function loadRequests() {
    fetch(`http://localhost:8080/request/student/${user.id}`)
    .then(res => {
        if (!res.ok) {
            throw new Error("Failed to load requests");
        }
        return res.json();
    })
    .then(data => {
        const table = document.getElementById("requestTable");
        table.innerHTML = "";

        let approved = 0;
        let pending = 0;
        let certificatePending = 0;
        let total = data.length;

        if (data.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">No requests found.</td>
                </tr>
            `;
        }

        data.forEach(req => {
            let statusBadge = "";
            if (req.status === "APPROVED") {
                approved++;
                statusBadge = `<span class="status-badge approved">APPROVED</span>`;
                if (!req.certificate) {
                    certificatePending++;
                }
            } else if (req.status === "PENDING") {
                pending++;
                statusBadge = `<span class="status-badge pending">PENDING</span>`;
            } else {
                statusBadge = `<span class="status-badge rejected">REJECTED</span>`;
            }

            const hodName = req.hod && req.hod.username ? req.hod.username : "—";
            const endDate = req.endDate ? req.endDate : "—";
            const dueDate = req.certificateDueDate ? req.certificateDueDate : "—";

            const uploadCell = req.status === "APPROVED"
                ? `
                    <input type="text" class="file-input" placeholder="File Path" id="file-${req.id}">
                    <button class="upload-btn" onclick="uploadCertificate(${req.id})">Upload</button>
                  `
                : "—";

            const row = `
                <tr>
                    <td>${req.reason}</td>
                    <td>${hodName}</td>
                    <td>${statusBadge}</td>
                    <td>${endDate}</td>
                    <td>${dueDate}</td>
                    <td>${uploadCell}</td>
                </tr>
            `;

            table.innerHTML += row;
        });

        document.getElementById("approvedCount").textContent = approved;
        document.getElementById("pendingCount").textContent = pending;
        document.getElementById("certificateCount").textContent = certificatePending;
        document.getElementById("totalCount").textContent = total;
    })
    .catch(err => {
        console.error(err);
        document.getElementById("requestTable").innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">Unable to load requests.</td>
            </tr>
        `;
    });
}

function uploadCertificate(requestId) {
    const filePath = document.getElementById(`file-${requestId}`).value.trim();

    if (!filePath) {
        alert("Please enter certificate file path.");
        return;
    }

    fetch(`http://localhost:8080/certificate/upload?requestId=${requestId}&filePath=${encodeURIComponent(filePath)}`, {
        method: "POST"
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Failed to upload certificate");
        }
        return res.json();
    })
    .then(data => {
        alert("Certificate uploaded successfully!");
        loadRequests();
    })
    .catch(err => {
        console.error(err);
        alert("Error while uploading certificate.");
    });
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}