const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "index.html";
}

window.onload = function () {
    loadRequests();
};

// Load all requests for HOD
function loadRequests() {

    fetch(`http://localhost:8080/hod/${user.id}/requests`)
    .then(res => res.json())
    .then(data => {

        const table = document.getElementById("requestTable");
        table.innerHTML = "";

        let total = data.length;
        let pending = 0, approved = 0, rejected = 0;

        data.forEach(req => {

            if (req.status === "PENDING") pending++;
            else if (req.status === "APPROVED") approved++;
            else rejected++;

            let statusClass = "";
            if (req.status === "APPROVED") statusClass = "approved";
            else if (req.status === "PENDING") statusClass = "pending";
            else statusClass = "rejected";

            const row = `
                <tr>
                    <td>${req.student ? req.student.name : "N/A"}</td>
                    <td>${req.reason}</td>
                    <td class="${statusClass}">${req.status}</td>
                    <td>${req.endDate}</td>
                    <td>
                        ${req.status === "PENDING" ? `
                            <button class="approve" onclick="approve(${req.id})">Approve</button>
                            <button class="reject" onclick="reject(${req.id})">Reject</button>
                        ` : "—"}
                    </td>
                </tr>
            `;

            table.innerHTML += row;
        });

        // Update cards
        document.getElementById("total").innerText = total;
        document.getElementById("pending").innerText = pending;
        document.getElementById("approved").innerText = approved;
        document.getElementById("rejected").innerText = rejected;

    });
}

// Approve request
function approve(id) {
    fetch(`http://localhost:8080/request/approve/${id}`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(() => {
        alert("Approved!");
        loadRequests();
    });
}

// Reject request
function reject(id) {
    fetch(`http://localhost:8080/request/reject/${id}`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(() => {
        alert("Rejected!");
        loadRequests();
    });
}