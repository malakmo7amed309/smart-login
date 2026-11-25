const page = window.location.pathname.split("/").pop() || "index.html";

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function showMessage(id, message, isError = true) {
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = message;
  box.classList.remove("d-none");
  box.classList.toggle("text-danger", isError);
  box.classList.toggle("text-success", !isError);
}

// REGISTER PAGE
if (page === "register.html") {
  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");

  document.getElementById("signupBtn").addEventListener("click", () => {
    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;

    if (!name || !email || !password) {
      showMessage("formMsg", "Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("formMsg", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      showMessage("formMsg", "Password must be at least 6 characters.");
      return;
    }

    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      showMessage("formMsg", "This email is already registered.");
      return;
    }

    users.push({ name, email, password });
    localStorage.setItem("users", JSON.stringify(users));
    showMessage("formMsg", "Account created! Redirecting to login...", false);
    setTimeout(() => (window.location.href = "index.html"), 800);
  });
}

// LOGIN PAGE
else if (page === "index.html") {
  const signinEmail = document.getElementById("signinEmail");
  const signinPassword = document.getElementById("signinPassword");

  document.getElementById("signinBtn").addEventListener("click", () => {
    const email = signinEmail.value.trim();
    const password = signinPassword.value;

    const user = getUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      showMessage("formMsg", "Invalid email or password.");
      return;
    }

    localStorage.setItem("loggedInUser", user.name);
    window.location.href = "display.html";
  });
}

// DISPLAY PAGE
else if (page === "display.html") {
  const userName = localStorage.getItem("loggedInUser");

  if (!userName) {
    window.location.href = "index.html";
  } else {
    document.getElementById("welcome").textContent = "Welcome " + userName;
  }

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
  });
}
