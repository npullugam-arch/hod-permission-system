const form = document.getElementById("loginForm");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(err => {
                throw new Error(err);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Login Success:", data);

        localStorage.setItem("user", JSON.stringify(data));

        if (data.role === "STUDENT") {
            window.location.href = "student.html";
        } else if (data.role === "HOD") {
            window.location.href = "hod.html";
        } else {
            document.getElementById("errorMsg").innerText = "Unknown role";
        }
    })
    .catch(error => {
        document.getElementById("errorMsg").innerText =
            error.message === "Failed to fetch"
                ? "Unable to reach the server. Please check that the app is running and the ngrok URL points to this server."
                : error.message;
    });
});
