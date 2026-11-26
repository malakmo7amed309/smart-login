const page = window.location.pathname.split("/").pop() || "index.html";
const $ = (id) => document.getElementById(id);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getUsers() {
  try { return JSON.parse(localStorage.getItem("users")) || []; } catch { return []; }
}
function saveUsers(u) { localStorage.setItem("users", JSON.stringify(u)); }

function showMessage(id, message, isError = true) {
  const box = $(id);
  if (!box) return;
  box.textContent = message;
  box.classList.remove("d-none");
  box.classList.toggle("is-error", isError);
  box.classList.toggle("is-ok", !isError);
}

function randomSalt() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
async function hash(password, salt) {
  const data = new TextEncoder().encode(salt + ":" + password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function makeRecord(name, email, password, createdAt) {
  const salt = randomSalt();
  return { name, email, salt, hash: await hash(password, salt), createdAt: createdAt || Date.now() };
}
// Accepts hashed users and old plaintext users from v1 (upgrades them on success).
async function checkPassword(user, password) {
  if (user.hash) return (await hash(password, user.salt)) === user.hash;
  return user.password === password;
}
function currentUser() {
  const email = localStorage.getItem("loggedInEmail");
  const name = localStorage.getItem("loggedInUser");
  const users = getUsers();
  return users.find((u) => u.email === email) || users.find((u) => u.name === name) || null;
}
function strength(p) {
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}

// Show / hide password buttons
document.querySelectorAll("[data-eye]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.eye);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.setAttribute("aria-pressed", String(show));
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
});

if (page === "register.html") {
  const pw = $("signupPassword");
  const labels = ["Too short", "Weak", "Okay", "Good", "Strong"];
  const colors = ["#c0392b", "#e67e22", "#d4ac0d", "#27ae60", "#1e8449"];
  pw.addEventListener("input", () => {
    const s = pw.value ? strength(pw.value) : 0;
    $("meterBar").style.width = (pw.value ? Math.max(s, 1) * 25 : 0) + "%";
    $("meterBar").style.background = colors[s];
    $("meterTxt").textContent = pw.value ? "Strength: " + labels[s] : "Use 6+ characters. Mix letters, numbers and symbols.";
  });
  $("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("signupName").value.trim();
    const email = $("signupEmail").value.trim();
    const password = pw.value;
    if (!name || !email || !password) return showMessage("formMsg", "Please fill in all fields.");
    if (!EMAIL_RE.test(email)) return showMessage("formMsg", "Please enter a valid email address.");
    if (password.length < 6) return showMessage("formMsg", "Password must be at least 6 characters.");
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      return showMessage("formMsg", "This email is already registered.");
    users.push(await makeRecord(name, email, password));
    saveUsers(users);
    showMessage("formMsg", "Account created! Redirecting to login...", false);
    setTimeout(() => (window.location.href = "index.html"), 800);
  });
}

else if (page === "index.html") {
  const remembered = localStorage.getItem("rememberEmail");
  if (remembered) { $("signinEmail").value = remembered; $("remember").checked = true; }
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("signinEmail").value.trim();
    const password = $("signinPassword").value;
    if (!email || !password) return showMessage("formMsg", "Enter your email and password.");
    const users = getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    const user = users[idx];
    if (!user || !(await checkPassword(user, password))) return showMessage("formMsg", "Invalid email or password.");
    if (!user.hash) { // upgrade an old plaintext account
      users[idx] = await makeRecord(user.name, user.email, password);
      saveUsers(users);
    }
    if ($("remember").checked) localStorage.setItem("rememberEmail", user.email);
    else localStorage.removeItem("rememberEmail");
    localStorage.setItem("loggedInUser", user.name);
    localStorage.setItem("loggedInEmail", user.email);
    window.location.href = "display.html";
  });
}

else if (page === "display.html") {
  const user = currentUser();
  if (!localStorage.getItem("loggedInUser") || !user) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInEmail");
    window.location.href = "index.html";
  } else {
    const render = () => {
      $("welcome").textContent = "Welcome " + user.name;
      $("newName").value = user.name;
      $("since").textContent = user.email + (user.createdAt ? " . Member since " + new Date(user.createdAt).toLocaleDateString() : "");
    };
    render();
    const logout = () => {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("loggedInEmail");
      window.location.href = "index.html";
    };
    $("logoutBtn").addEventListener("click", logout);

    $("nameForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const n = $("newName").value.trim();
      if (n.length < 2) return showMessage("nameMsg", "Name must be at least 2 characters.");
      const users = getUsers();
      const u = users.find((x) => x.email === user.email);
      u.name = n; user.name = n;
      saveUsers(users);
      localStorage.setItem("loggedInUser", n);
      render();
      showMessage("nameMsg", "Name updated.", false);
    });

    $("pwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const oldP = $("oldPw").value, newP = $("newPw").value;
      if (!(await checkPassword(user, oldP))) return showMessage("pwMsg", "Current password is wrong.");
      if (newP.length < 6) return showMessage("pwMsg", "New password must be at least 6 characters.");
      const users = getUsers();
      const i = users.findIndex((x) => x.email === user.email);
      users[i] = await makeRecord(user.name, user.email, newP, user.createdAt);
      saveUsers(users);
      Object.assign(user, users[i]);
      $("oldPw").value = ""; $("newPw").value = "";
      showMessage("pwMsg", "Password updated.", false);
    });

    $("deleteBtn").addEventListener("click", () => {
      if (!confirm("Delete this account from this browser? This cannot be undone.")) return;
      saveUsers(getUsers().filter((x) => x.email !== user.email));
      logout();
    });
  }
}

// Clear a stale message as soon as the user edits any field
document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("input", () => {
    form.querySelectorAll(".msg").forEach((m) => {
      m.classList.add("d-none");
      m.textContent = "";
    });
  });
});
