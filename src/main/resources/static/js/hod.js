const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "index.html";
}

window.onload = function () {
    setHodInfo();
    loadDashboardCounts();
    showDashboard();
};

function setHodInfo() {
    const hodNameEl = document.getElementById("hodName");
    const userInitialEl = document.getElementById("userInitial");

    if (hodNameEl) {
        hodNameEl.textContent = user.username || "HOD";
    }

    if (userInitialEl) {
        userInitialEl.textContent = (user.username || "H").charAt(0).toUpperCase();
    }
}

function setActiveNav(clickedItem) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    if (clickedItem) {
        clickedItem.classList.add("active");
    }
}

function showDashboard(event) {
    if (event) {
        event.preventDefault();
        setActiveNav(event.currentTarget);
    } else {
        const dashboardNav = document.querySelector('.nav-item[data-page="dashboard"]');
        if (dashboardNav) {
            setActiveNav(dashboardNav);
        }
    }

    document.getElementById("pageTitle").textContent = "Dashboard";
    document.getElementById("pageSubtitle").textContent = "Overview of requests and certificate submissions.";

    document.getElementById("dashboardSection").classList.remove("hidden");
    document.getElementById("iframeSection").classList.add("hidden");
    document.getElementById("contentFrame").src = "";

    loadDashboardCounts();
}

function loadPage(event, pageUrl, title) {
    event.preventDefault();
    setActiveNav(event.currentTarget);

    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageSubtitle").textContent = "Manage this section from the right panel.";

    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("iframeSection").classList.remove("hidden");

    const frame = document.getElementById("contentFrame");
    const resolvedPageUrl = new URL(pageUrl, window.location.href);

    frame.onerror = function () {
        alert("Unable to load " + title + " right now.");
    };

    frame.src = resolvedPageUrl.pathname + "?t=" + new Date().getTime();
}

function loadDashboardCounts() {
    fetch(`/hod/${user.id}/requests`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load requests");
            }
            return res.json();
        })
        .then(data => {
            let newCount = 0;
            let certificatePendingCount = 0;
            let approvedCount = 0;
            let rejectedCount = 0;

            data.forEach(req => {
                if (req.status === "PENDING") {
                    newCount++;
                } else if (req.status === "APPROVED") {
                    approvedCount++;
                    if (!req.certificate) {
                        certificatePendingCount++;
                    }
                } else if (req.status === "REJECTED") {
                    rejectedCount++;
                }
            });

            document.getElementById("newCount").textContent = newCount;
            document.getElementById("certificatePendingCount").textContent = certificatePendingCount;
            document.getElementById("approvedCount").textContent = approvedCount;
            document.getElementById("rejectedCount").textContent = rejectedCount;
        })
        .catch(err => {
            console.error(err);
            document.getElementById("newCount").textContent = "0";
            document.getElementById("certificatePendingCount").textContent = "0";
            document.getElementById("approvedCount").textContent = "0";
            document.getElementById("rejectedCount").textContent = "0";
        });
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}
