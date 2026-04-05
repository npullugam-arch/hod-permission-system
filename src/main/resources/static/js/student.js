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
    window.location.href = "index.html";
}

window.addEventListener("DOMContentLoaded", () => {
    bindSidebarEvents();
    setStudentInfo();
    showDashboard();
});

function bindSidebarEvents() {
    const menuToggle = document.getElementById("menuToggle");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileCloseBtn = document.getElementById("mobileCloseBtn");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const sidePanel = document.getElementById("sidePanel");

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            document.body.classList.toggle("sidebar-collapsed");
        });
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            sidePanel.classList.add("mobile-open");
            sidebarOverlay.classList.add("active");
        });
    }

    const closeMobileSidebar = () => {
        sidePanel.classList.remove("mobile-open");
        sidebarOverlay.classList.remove("active");
    };

    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener("click", closeMobileSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeMobileSidebar);
    }
}

function setStudentInfo() {
    const studentNameEl = document.getElementById("studentName");
    const studentIdEl = document.getElementById("studentId");
    const userInitialEl = document.getElementById("userInitial");

    const profileNameEl = document.getElementById("profileName");
    const profileUserIdEl = document.getElementById("profileUserId");
    const profileRoleEl = document.getElementById("profileRole");
    const profileAvatarLargeEl = document.getElementById("profileAvatarLarge");

    const displayName = user.username || user.name || "Student";
    const displayId = user.rollNumber || user.studentId || user.id || "-";
    const displayRole = user.role || "STUDENT";
    const initial = String(displayName).charAt(0).toUpperCase();

    if (studentNameEl) studentNameEl.textContent = displayName;
    if (studentIdEl) studentIdEl.textContent = displayId;
    if (userInitialEl) userInitialEl.textContent = initial;

    if (profileNameEl) profileNameEl.textContent = displayName;
    if (profileUserIdEl) profileUserIdEl.textContent = displayId;
    if (profileRoleEl) profileRoleEl.textContent = displayRole;
    if (profileAvatarLargeEl) profileAvatarLargeEl.textContent = initial;
}

function setActiveNav(clickedLink) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    if (clickedLink) {
        clickedLink.classList.add("active");
    }
}

function setIframeMode(enabled) {
    document.body.classList.toggle("iframe-mode", enabled);
}

function showDashboard(event) {
    if (event) {
        event.preventDefault();
        setActiveNav(event.currentTarget);
    } else {
        const dashboardNav = document.querySelector('.nav-link[data-page="dashboard"]');
        if (dashboardNav) {
            setActiveNav(dashboardNav);
        }
    }

    setIframeMode(false);
    setHeader("Dashboard", "Welcome back! View your request summary here.", "fa-chart-bar");

    const dashboardSection = document.getElementById("dashboardSection");
    const iframeSection = document.getElementById("iframeSection");
    const contentFrame = document.getElementById("contentFrame");

    if (dashboardSection) dashboardSection.classList.remove("hidden");
    if (iframeSection) iframeSection.classList.add("hidden");

    if (contentFrame) {
        contentFrame.src = "";
        contentFrame.removeAttribute("src");
    }

    closeReminderModal();
    closeProfileCard();

    loadDashboardCounts();
    loadUnreadReminderCount();

    window.scrollTo({ top: 0, behavior: "auto" });
}

function loadPage(event, pageUrl, title) {
    if (event) {
        event.preventDefault();
        setActiveNav(event.currentTarget);
    }

    setIframeMode(true);
    setHeader(title, "Manage your student requests from this section.", "fa-folder-open");

    const dashboardSection = document.getElementById("dashboardSection");
    const iframeSection = document.getElementById("iframeSection");
    const frame = document.getElementById("contentFrame");

    if (dashboardSection) dashboardSection.classList.add("hidden");
    if (iframeSection) iframeSection.classList.remove("hidden");

    closeReminderModal();
    closeProfileCard();

    if (frame) {
        frame.onerror = function () {
            alert("Unable to load " + title + " right now.");
        };

        frame.onload = function () {
            window.scrollTo({ top: 0, behavior: "auto" });
        };

        const resolvedPageUrl = new URL(pageUrl, window.location.href);
        frame.src = resolvedPageUrl.pathname + "?t=" + new Date().getTime();
    }
}

function setHeader(title, subtitle, iconClass) {
    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");
    const headerIcon = document.getElementById("headerIcon");

    if (pageTitle) pageTitle.textContent = title;
    if (pageSubtitle) pageSubtitle.textContent = subtitle;
    if (headerIcon) headerIcon.className = "fa-solid " + iconClass;
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

function hasUploadedCertificate(req) {
    return !!(req.certificate && req.certificate.filePath);
}

function loadDashboardCounts() {
    fetch(`/request/student/${user.id}`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load dashboard data");
            }
            return res.json();
        })
        .then(data => {
            const requests = Array.isArray(data) ? data : [];

            let approved = 0;
            let pending = 0;
            let certificatePending = 0;
            let total = requests.length;

            requests.forEach(req => {
                const status = String(req.status || "").toUpperCase();

                if (status === "APPROVED") {
                    approved++;

                    if (isCertificateRequired(req.reason) && !hasUploadedCertificate(req)) {
                        certificatePending++;
                    }
                } else if (status === "PENDING") {
                    pending++;
                }
            });

            animateCounter("approvedCount", approved);
            animateCounter("pendingCount", pending);
            animateCounter("certificateCount", certificatePending);
            animateCounter("totalCount", total);
        })
        .catch(error => {
            console.error(error);
            animateCounter("approvedCount", 0);
            animateCounter("pendingCount", 0);
            animateCounter("certificateCount", 0);
            animateCounter("totalCount", 0);
        });
}

function animateCounter(elementId, target) {
    const counter = document.getElementById(elementId);
    if (!counter) return;

    const safeTarget = Number(target) || 0;
    counter.setAttribute("data-target", String(safeTarget));

    const animationDuration = 900;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentCount = Math.floor(easeOutQuart * safeTarget);

        counter.textContent = currentCount < 10 ? "0" + currentCount : String(currentCount);

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            counter.textContent = safeTarget < 10 ? "0" + safeTarget : String(safeTarget);
            counter.classList.remove("pop");
            void counter.offsetWidth;
            counter.classList.add("pop");
        }
    }

    requestAnimationFrame(updateCounter);
}

function loadUnreadReminderCount() {
    fetch(`/notification/unread/${user.id}`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load unread reminders");
            }
            return res.json();
        })
        .then(data => {
            const badge = document.getElementById("reminderBadge");
            if (!badge) return;

            const unreadCount = Array.isArray(data) ? data.length : 0;

            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
                badge.style.display = "inline-block";
            } else {
                badge.textContent = "0";
                badge.style.display = "none";
            }
        })
        .catch(error => {
            console.error(error);
            const badge = document.getElementById("reminderBadge");
            if (badge) {
                badge.textContent = "0";
                badge.style.display = "none";
            }
        });
}

function openReminderModal(event) {
    if (event) {
        event.preventDefault();
        setActiveNav(event.currentTarget);
    } else {
        const reminderNav = document.querySelector('.nav-link[data-page="reminders"]');
        if (reminderNav) {
            setActiveNav(reminderNav);
        }
    }

    setIframeMode(false);

    const modal = document.getElementById("reminderModal");
    if (!modal) return;

    closeProfileCard();
    modal.classList.remove("hidden");

    setHeader("Reminders", "Check important reminder notifications.", "fa-bell");

    loadReminderNotifications(true);
}

function closeReminderModal() {
    const modal = document.getElementById("reminderModal");
    if (!modal) return;
    modal.classList.add("hidden");
}

function loadReminderNotifications(markUnreadAsRead) {
    const reminderList = document.getElementById("reminderList");
    if (!reminderList) return;

    reminderList.innerHTML = `<div class="empty-state">Loading reminders...</div>`;

    fetch(`/notification/${user.id}`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load reminders");
            }
            return res.json();
        })
        .then(async data => {
            const notifications = Array.isArray(data) ? data : [];

            if (notifications.length === 0) {
                reminderList.innerHTML = `
                    <div class="empty-state">
                        No reminders available right now.
                    </div>
                `;
                loadUnreadReminderCount();
                return;
            }

            if (markUnreadAsRead) {
                const unreadNotifications = notifications.filter(item => item && item.read === false);

                await Promise.all(
                    unreadNotifications.map(item =>
                        fetch(`/notification/read/${item.id}`, {
                            method: "PUT"
                        }).catch(() => null)
                    )
                );
            }

            reminderList.innerHTML = notifications.map(item => {
                const isRead = item.read === true;
                const createdAt = formatDateTime(item.createdAt);

                return `
                    <div class="reminder-item ${isRead ? "read" : "unread"}">
                        <div class="reminder-top">
                            <div class="reminder-title">
                                ${isRead ? "Reminder" : "New Reminder"}
                            </div>
                            <div class="reminder-date">
                                ${escapeHtml(createdAt)}
                            </div>
                        </div>

                        <div class="reminder-message">
                            ${escapeHtml(item.message || "No message available.")}
                        </div>
                    </div>
                `;
            }).join("");

            loadUnreadReminderCount();
        })
        .catch(error => {
            console.error(error);
            reminderList.innerHTML = `
                <div class="error-state">
                    Unable to load reminders right now.
                </div>
            `;
            loadUnreadReminderCount();
        });
}

function openProfileCard(event) {
    if (event) {
        event.preventDefault();
    }

    const modal = document.getElementById("profileModal");
    if (!modal) return;

    closeReminderModal();
    modal.classList.remove("hidden");
}

function closeProfileCard() {
    const modal = document.getElementById("profileModal");
    if (!modal) return;
    modal.classList.add("hidden");
}

function formatDateTime(dateTimeValue) {
    if (!dateTimeValue) {
        return "Date not available";
    }

    const date = new Date(dateTimeValue);

    if (Number.isNaN(date.getTime())) {
        return "Date not available";
    }

    return date.toLocaleString();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

window.addEventListener("click", function (event) {
    const reminderModal = document.getElementById("reminderModal");
    const profileModal = document.getElementById("profileModal");

    if (reminderModal && !reminderModal.classList.contains("hidden") && event.target === reminderModal) {
        closeReminderModal();
        showDashboard();
    }

    if (profileModal && !profileModal.classList.contains("hidden") && event.target === profileModal) {
        closeProfileCard();
    }
});