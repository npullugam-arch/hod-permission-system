const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.top.location.href = "index.html";
}

window.onload = function () {
    loadCertificateRequests();
};

function loadCertificateRequests() {
    fetch(`/request/student/${user.id}`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load requests");
            }
            return res.json();
        })
        .then(data => {
            const table = document.getElementById("certificateTable");
            table.innerHTML = "";

            const approvedRequests = data.filter(req => req.status === "APPROVED");

            if (approvedRequests.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">No approved requests found for certificate upload.</td>
                    </tr>
                `;
                return;
            }

            approvedRequests.forEach(req => {
                const hodName = req.hod && req.hod.username ? req.hod.username : "—";
                const endDate = req.endDate || "—";
                const dueDate = req.certificateDueDate || "—";

                let certificatePathHtml = "—";
                let actionHtml = "";

                if (req.certificate && req.certificate.filePath) {
                    certificatePathHtml = `
                        <a href="${req.certificate.filePath}" target="_blank" class="view-link">View File</a>
                    `;
                    actionHtml = `<span class="uploaded-badge">Already Uploaded</span>`;
                } else {
                    certificatePathHtml = `
                        <span class="no-file">No file selected</span>
                        <div class="file-name" id="file-name-${req.id}"></div>
                    `;

                    actionHtml = `
                        <input 
                            type="file" 
                            id="file-${req.id}" 
                            class="hidden-file-input" 
                            accept=".jpg,.jpeg,.png,.pdf"
                            onchange="showSelectedFileName(${req.id})"
                        />
                        <button class="choose-btn" onclick="openFilePicker(${req.id})">Choose File</button>
                        <button class="upload-btn" onclick="uploadCertificate(${req.id})">Upload</button>
                    `;
                }

                const row = `
                    <tr>
                        <td>${req.reason || "—"}</td>
                        <td>${hodName}</td>
                        <td>${endDate}</td>
                        <td>${dueDate}</td>
                        <td>${certificatePathHtml}</td>
                        <td>${actionHtml}</td>
                    </tr>
                `;

                table.innerHTML += row;
            });
        })
        .catch(err => {
            console.error(err);
            document.getElementById("certificateTable").innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">Unable to load certificate requests.</td>
                </tr>
            `;
        });
}

function openFilePicker(requestId) {
    const fileInput = document.getElementById(`file-${requestId}`);
    if (fileInput) {
        fileInput.click();
    }
}

function showSelectedFileName(requestId) {
    const fileInput = document.getElementById(`file-${requestId}`);
    const fileNameBox = document.getElementById(`file-name-${requestId}`);

    if (!fileInput || !fileNameBox) return;

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileNameBox.innerHTML = `Selected: ${file.name}`;
    } else {
        fileNameBox.innerHTML = "";
    }
}

function uploadCertificate(requestId) {
    const fileInput = document.getElementById(`file-${requestId}`);

    if (!fileInput || fileInput.files.length === 0) {
        alert("Please select a certificate file.");
        return;
    }

    const file = fileInput.files[0];
    const allowedExtensions = ["jpg", "jpeg", "png", "pdf"];
    const fileName = file.name.toLowerCase();
    const extension = fileName.split(".").pop();

    if (!allowedExtensions.includes(extension)) {
        alert("Only JPG, JPEG, PNG, and PDF files are allowed.");
        fileInput.value = "";
        showSelectedFileName(requestId);
        return;
    }

    if (file.size > 1024 * 1024) {
        alert("File size is more than 1 MB, so upload rejected.");
        fileInput.value = "";
        showSelectedFileName(requestId);
        return;
    }

    const formData = new FormData();
    formData.append("requestId", requestId);
    formData.append("file", file);

    fetch("/certificate/upload", {
        method: "POST",
        body: formData
    })
        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to upload certificate");
            }
            return res.json();
        })
        .then(() => {
            alert("Certificate uploaded successfully!");
            loadCertificateRequests();
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Error while uploading certificate.");
        });
}