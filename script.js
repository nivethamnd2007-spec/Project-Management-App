/* =========================================================
   TaskFlow - Project Management Tool
   script.js : one script shared by ALL pages

   How it works:
   - Login / sign-up pages are found by their form ids.
   - App pages (dashboard, profile, settings, about)
     have <body data-page="..."> so we know which page we are on.
   - The code that starts each page is at the very bottom
     (section 15).

   Local Storage keys used:
   pm_users        -> list of all user accounts
   pm_currentUser  -> email/username of the logged-in user
   pm_projects     -> list of all projects
   pm_settings     -> preferences (theme, recent project count)
   pm_adminCreated -> remembers that the admin account was added
   ========================================================= */


/* =========================================================
   1. LOCAL STORAGE HELPERS
   Local Storage only stores text, so we use JSON.stringify
   to save arrays/objects and JSON.parse to read them back.
   ========================================================= */

// ----- Users -----
function getUsers() {
  return JSON.parse(localStorage.getItem("pm_users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("pm_users", JSON.stringify(users));
}

// ----- Projects (of every user) -----
function getAllProjects() {
  return JSON.parse(localStorage.getItem("pm_projects")) || [];
}

function saveAllProjects(projects) {
  localStorage.setItem("pm_projects", JSON.stringify(projects));
}

// ----- Preferences (with default values) -----
function getSettings() {
  return JSON.parse(localStorage.getItem("pm_settings")) || { theme: "light", recentCount: 5 };
}

function saveSettings(settings) {
  localStorage.setItem("pm_settings", JSON.stringify(settings));
}

// ----- The logged-in user (or null if nobody is logged in) -----
function getCurrentUser() {
  const email = localStorage.getItem("pm_currentUser");
  if (!email) return null;
  const users = getUsers();
  return users.find(function (user) { return user.email === email; }) || null;
}


/* =========================================================
   2. SMALL HELPER FUNCTIONS
   ========================================================= */

// Check if an email looks valid, e.g. name@site.com
function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// Show an error message under an input.
// The error <small> always has the id: inputId + "Error"
function showError(inputId, message) {
  document.getElementById(inputId).classList.add("invalid");
  document.getElementById(inputId + "Error").textContent = message;
}

// Remove all error messages inside a form
function clearErrors(form) {
  form.querySelectorAll(".error").forEach(function (el) { el.textContent = ""; });
  form.querySelectorAll(".invalid").forEach(function (el) { el.classList.remove("invalid"); });
}

// Show the alert box (id="formMessage") at the top of a form
function showAlert(message, type) {
  const alertBox = document.getElementById("formMessage");
  alertBox.textContent = message;
  alertBox.className = "alert show " + type; // type = "error-alert" or "success-alert"
}

// Show a small message at the bottom right for 2.5 seconds
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}

// Open / close a popup (modal) by its id
function openModal(modalId) {
  document.getElementById(modalId).classList.add("show");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("show");
}

// Make user text safe before putting it inside HTML
// (stops someone typing <script> into a project name)
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Turn "2026-10-09" into "Oct 9, 2026"
function formatDate(dateText) {
  if (!dateText) return "-";
  const date = new Date(dateText + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Turn "In Progress" into the CSS class "in-progress"
function statusClass(status) {
  return status.toLowerCase().replace(" ", "-");
}

// Today's date as "YYYY-MM-DD"
function todayText() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}


/* =========================================================
   3. DEFAULT ADMIN ACCOUNT
   Runs only once. Adds a built-in admin so you can log in
   right away with:  admin@123  /  123
   ========================================================= */
if (!localStorage.getItem("pm_adminCreated")) {
  const users = getUsers();
  users.push({
    name: "Admin User",
    email: "admin@123",
    password: "123",
    phone: "",
    role: "Administrator",
    location: "",
    bio: "Default administrator account.",
    joined: todayText()
  });
  saveUsers(users);
  localStorage.setItem("pm_adminCreated", "yes");
}


/* =========================================================
   4. DARK / LIGHT THEME
   The theme is saved in pm_settings, so it stays after refresh
   and is the same on every page.
   ========================================================= */
const themeButton = document.getElementById("themeToggle");

function applyTheme() {
  const theme = getSettings().theme;
  document.documentElement.setAttribute("data-theme", theme);

  // Sun icon in dark mode, moon icon in light mode
  if (themeButton) {
    themeButton.innerHTML = theme === "dark"
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }

  // Keep the switch on the Settings page in sync
  const darkSwitch = document.getElementById("darkModeSwitch");
  if (darkSwitch) darkSwitch.checked = theme === "dark";
}

// Change the theme and save it
function setTheme(theme) {
  const settings = getSettings();
  settings.theme = theme;
  saveSettings(settings);
  applyTheme();
}

if (themeButton) {
  themeButton.addEventListener("click", function () {
    setTheme(getSettings().theme === "dark" ? "light" : "dark");
  });
}

applyTheme(); // run once when any page loads


/* =========================================================
   5. SHOW / HIDE PASSWORD
   Every eye button has data-target="id of the input".
   ========================================================= */
document.querySelectorAll(".toggle-password").forEach(function (button) {
  button.addEventListener("click", function () {
    const input = document.getElementById(button.dataset.target);
    const icon = button.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.className = "fa-regular fa-eye-slash";
      button.title = "Hide password";
    } else {
      input.type = "password";
      icon.className = "fa-regular fa-eye";
      button.title = "Show password";
    }
  });
});


/* =========================================================
   6. SIGN-UP PAGE
   ========================================================= */
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  // If already logged in, go straight to the dashboard
  if (getCurrentUser()) window.location.href = "dashboard.html";

  signupForm.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading
    clearErrors(signupForm);

    // Read the values from the inputs
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;

    let isValid = true;

    // --- Validate each field ---
    if (name === "") {
      showError("signupName", "Please enter your name.");
      isValid = false;
    } else if (name.length < 3) {
      showError("signupName", "Name must be at least 3 characters.");
      isValid = false;
    }

    if (email === "") {
      showError("signupEmail", "Please enter your email.");
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError("signupEmail", "Please enter a valid email address.");
      isValid = false;
    }

    if (password === "") {
      showError("signupPassword", "Please enter a password.");
      isValid = false;
    } else if (password.length < 6) {
      showError("signupPassword", "Password must be at least 6 characters.");
      isValid = false;
    }

    if (confirm === "") {
      showError("signupConfirm", "Please confirm your password.");
      isValid = false;
    } else if (confirm !== password) {
      showError("signupConfirm", "Passwords do not match.");
      isValid = false;
    }

    if (!isValid) return;

    // --- Check that the email is not already registered ---
    const users = getUsers();
    const exists = users.some(function (user) { return user.email === email; });

    if (exists) {
      showError("signupEmail", "This email is already registered.");
      return;
    }

    // --- Save the new user ---
    // Note: this is a learning project. Real websites never store
    // passwords in the browser; they use a secure server.
    users.push({
      name: name,
      email: email,
      password: password,
      phone: "",
      role: "Team Member",
      location: "",
      bio: "",
      joined: todayText()
    });
    saveUsers(users);

    showAlert("Account created successfully! Redirecting to login...", "success-alert");
    signupForm.reset();

    // Go to the login page after 1.5 seconds
    setTimeout(function () {
      window.location.href = "index.html";
    }, 1500);
  });
}


/* =========================================================
   7. LOGIN PAGE
   ========================================================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  // If already logged in, go straight to the dashboard
  if (getCurrentUser()) window.location.href = "dashboard.html";

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors(loginForm);

    const username = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    let isValid = true;

    // --- Validate fields ---
    // (usernames like "admin@123" and emails both contain "@")
    if (username === "") {
      showError("loginEmail", "Please enter your username or email.");
      isValid = false;
    } else if (!username.includes("@")) {
      showError("loginEmail", "Please enter a valid username or email.");
      isValid = false;
    }

    if (password === "") {
      showError("loginPassword", "Please enter your password.");
      isValid = false;
    }

    if (!isValid) return;

    // --- Find a user with the same username/email and password ---
    const users = getUsers();
    const user = users.find(function (u) {
      return u.email === username && u.password === password;
    });

    if (!user) {
      showAlert("Invalid username or password. Please try again.", "error-alert");
      return;
    }

    // --- Save login status and open the dashboard ---
    localStorage.setItem("pm_currentUser", user.email);
    showAlert("Login successful! Opening your dashboard...", "success-alert");

    setTimeout(function () {
      window.location.href = "dashboard.html";
    }, 800);
  });
}


/* =========================================================
   8. SHARED LAYOUT FOR ALL APP PAGES
   (sidebar, top bar, logout, popups)
   ========================================================= */
let currentUser = null; // filled in at the bottom of the file

// Put the user's name, email and first letter in the top bar
function fillUserInfo() {
  document.querySelectorAll(".user-name").forEach(function (el) {
    el.textContent = currentUser.name;
  });
  document.querySelectorAll(".user-email").forEach(function (el) {
    el.textContent = currentUser.email;
  });
  document.querySelectorAll(".user-avatar").forEach(function (el) {
    el.textContent = currentUser.name.charAt(0).toUpperCase();
  });
}

function setupLayout() {
  fillUserInfo();

  // ----- Mobile menu: open / close the sidebar -----
  document.getElementById("menuBtn").addEventListener("click", function () {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("overlay").classList.add("show");
  });
  document.getElementById("overlay").addEventListener("click", closeSidebar);

  // ----- Every button with class "logout-btn" logs out -----
  document.querySelectorAll(".logout-btn").forEach(function (button) {
    button.addEventListener("click", logout);
  });

  // ----- Close a popup when clicking its dark background -----
  document.querySelectorAll(".modal").forEach(function (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) modal.classList.remove("show");
    });
  });
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

// Log out: forget the current user and go back to login
function logout() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("pm_currentUser");
    window.location.href = "index.html";
  }
}

// Save changes made to currentUser back into the users list.
// oldEmail is needed in case the user changed their email.
function saveCurrentUser(oldEmail) {
  const users = getUsers();
  const index = users.findIndex(function (u) { return u.email === oldEmail; });
  users[index] = currentUser;
  saveUsers(users);
  localStorage.setItem("pm_currentUser", currentUser.email);
}

// Get only the projects that belong to the current user
function getMyProjects() {
  return getAllProjects().filter(function (project) {
    return project.owner === currentUser.email;
  });
}

// Count the current user's projects for each status
function countProjects() {
  const projects = getMyProjects();
  const counts = { total: projects.length, progress: 0, completed: 0, pending: 0 };

  projects.forEach(function (project) {
    if (project.status === "In Progress") counts.progress++;
    else if (project.status === "Completed") counts.completed++;
    else counts.pending++;
  });

  return counts;
}


/* =========================================================
   9. DASHBOARD PAGE: setup and navigation
   ========================================================= */
function startDashboard() {
  document.getElementById("welcomeName").textContent = currentUser.name.split(" ")[0];

  // ----- Sidebar links switch between Dashboard and Projects -----
  document.querySelectorAll(".nav-link[data-section]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      showSection(link.dataset.section);
    });
  });

  // "View all" link opens the Projects section
  document.getElementById("viewAllLink").addEventListener("click", function (event) {
    event.preventDefault();
    showSection("projectsSection");
  });

  // ----- Search and filter: re-draw the cards when they change -----
  document.getElementById("searchInput").addEventListener("input", renderProjects);
  document.getElementById("statusFilter").addEventListener("change", renderProjects);

  // ----- Add / Edit form submit -----
  document.getElementById("projectForm").addEventListener("submit", saveProject);

  // Draw everything for the first time
  refreshAll();

  // Other pages link to "dashboard.html#projects" to open Projects directly
  if (window.location.hash === "#projects") showSection("projectsSection");
}

// Show one section (Dashboard or Projects) and hide the other
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(function (section) {
    section.classList.remove("active");
  });
  document.getElementById(sectionId).classList.add("active");

  // Highlight the matching sidebar link
  document.querySelectorAll(".nav-link[data-section]").forEach(function (link) {
    link.classList.toggle("active", link.dataset.section === sectionId);
  });

  // Change the title in the top bar
  document.getElementById("pageTitle").textContent =
    sectionId === "dashboardSection" ? "Dashboard" : "Projects";

  closeSidebar();
}

// Find one project by its id
function findProject(id) {
  return getAllProjects().find(function (project) { return project.id === id; });
}

// Re-draw stats, recent table and project cards
function refreshAll() {
  renderStats();
  renderRecent();
  renderProjects();
}


/* =========================================================
   10. DASHBOARD: stats, recent projects and project cards
   ========================================================= */
function renderStats() {
  const counts = countProjects();
  document.getElementById("totalCount").textContent = counts.total;
  document.getElementById("progressCount").textContent = counts.progress;
  document.getElementById("completedCount").textContent = counts.completed;
  document.getElementById("pendingCount").textContent = counts.pending;
}

function renderRecent() {
  // Newest projects first. How many to show comes from Settings.
  const howMany = Number(getSettings().recentCount) || 5;
  const projects = getMyProjects()
    .sort(function (a, b) { return b.id - a.id; })
    .slice(0, howMany);

  const tableBody = document.getElementById("recentTable");
  const emptyBox = document.getElementById("recentEmpty");
  tableBody.innerHTML = "";

  // Show the empty message if there are no projects
  if (projects.length === 0) {
    emptyBox.classList.add("show");
    tableBody.parentElement.style.display = "none";
    return;
  }

  emptyBox.classList.remove("show");
  tableBody.parentElement.style.display = "";

  projects.forEach(function (project) {
    tableBody.innerHTML +=
      "<tr>" +
        "<td><strong>" + escapeHTML(project.name) + "</strong></td>" +
        "<td>" + formatDate(project.startDate) + "</td>" +
        "<td>" + formatDate(project.deadline) + "</td>" +
        '<td><span class="badge ' + statusClass(project.status) + '">' + project.status + "</span></td>" +
      "</tr>";
  });
}

function renderProjects() {
  const searchText = document.getElementById("searchInput").value.trim().toLowerCase();
  const filter = document.getElementById("statusFilter").value;
  const allMine = getMyProjects();

  // Keep only projects that match the search text and status filter
  const projects = allMine
    .filter(function (project) {
      const matchesSearch =
        project.name.toLowerCase().includes(searchText) ||
        project.description.toLowerCase().includes(searchText);
      const matchesStatus = filter === "All" || project.status === filter;
      return matchesSearch && matchesStatus;
    })
    .sort(function (a, b) { return b.id - a.id; });

  const grid = document.getElementById("projectsGrid");
  const emptyBox = document.getElementById("projectsEmpty");
  grid.innerHTML = "";

  // ----- Empty message -----
  if (projects.length === 0) {
    if (allMine.length === 0) {
      document.getElementById("emptyTitle").textContent = "No projects available";
      document.getElementById("emptyText").textContent = "Click \"Add Project\" to create your first project.";
    } else {
      document.getElementById("emptyTitle").textContent = "No matching projects";
      document.getElementById("emptyText").textContent = "Try a different search or status filter.";
    }
    emptyBox.classList.add("show");
    return;
  }
  emptyBox.classList.remove("show");

  // ----- Build one card for each project -----
  const today = todayText();

  projects.forEach(function (project) {
    const isOverdue = project.status !== "Completed" && project.deadline < today;

    grid.innerHTML +=
      '<div class="project-card">' +
        '<div class="card-top">' +
          "<h4>" + escapeHTML(project.name) + "</h4>" +
          '<span class="badge ' + statusClass(project.status) + '">' + project.status + "</span>" +
        "</div>" +
        '<p class="card-desc">' + escapeHTML(project.description) + "</p>" +
        '<div class="card-dates">' +
          "<div>Start<strong>" + formatDate(project.startDate) + "</strong></div>" +
          '<div style="text-align:right">Deadline<strong>' + formatDate(project.deadline) +
            (isOverdue ? '<span class="overdue">Overdue</span>' : "") +
          "</strong></div>" +
        "</div>" +
        '<div class="card-bottom">' +
          // Status dropdown: changes status instantly
          '<select class="status-select" onchange="changeStatus(' + project.id + ', this.value)">' +
            statusOption("Pending", project.status) +
            statusOption("In Progress", project.status) +
            statusOption("Completed", project.status) +
          "</select>" +
          '<div class="card-actions">' +
            '<button class="icon-btn view" title="View" onclick="viewProject(' + project.id + ')"><i class="fa-regular fa-eye"></i></button>' +
            '<button class="icon-btn edit" title="Edit" onclick="openEditModal(' + project.id + ')"><i class="fa-regular fa-pen-to-square"></i></button>' +
            '<button class="icon-btn delete" title="Delete" onclick="deleteProject(' + project.id + ')"><i class="fa-regular fa-trash-can"></i></button>' +
          "</div>" +
        "</div>" +
      "</div>";
  });
}

// Build one <option> and mark it selected if it is the current status
function statusOption(value, currentStatus) {
  const selected = value === currentStatus ? " selected" : "";
  return '<option value="' + value + '"' + selected + ">" + value + "</option>";
}


/* =========================================================
   11. DASHBOARD: add, edit, view, delete, change status
   ========================================================= */

// Open an empty form for a new project
function openAddModal() {
  const form = document.getElementById("projectForm");
  form.reset();
  clearErrors(form);
  document.getElementById("projectId").value = "";
  document.getElementById("projectStart").value = todayText();
  document.getElementById("modalTitle").textContent = "Add Project";
  openModal("projectModal");
}

// Open the form filled with an existing project's data
function openEditModal(id) {
  const project = findProject(id);
  if (!project) return;

  const form = document.getElementById("projectForm");
  clearErrors(form);
  document.getElementById("projectId").value = project.id;
  document.getElementById("projectName").value = project.name;
  document.getElementById("projectDesc").value = project.description;
  document.getElementById("projectStart").value = project.startDate;
  document.getElementById("projectDeadline").value = project.deadline;
  document.getElementById("projectStatus").value = project.status;
  document.getElementById("modalTitle").textContent = "Edit Project";
  openModal("projectModal");
}

// Runs when the Add/Edit form is submitted
function saveProject(event) {
  event.preventDefault();
  const form = document.getElementById("projectForm");
  clearErrors(form);

  const id = document.getElementById("projectId").value;
  const name = document.getElementById("projectName").value.trim();
  const description = document.getElementById("projectDesc").value.trim();
  const startDate = document.getElementById("projectStart").value;
  const deadline = document.getElementById("projectDeadline").value;
  const status = document.getElementById("projectStatus").value;

  // --- Validate ---
  let isValid = true;

  if (name === "") {
    showError("projectName", "Project name is required.");
    isValid = false;
  }
  if (description === "") {
    showError("projectDesc", "Description is required.");
    isValid = false;
  }
  if (startDate === "") {
    showError("projectStart", "Start date is required.");
    isValid = false;
  }
  if (deadline === "") {
    showError("projectDeadline", "Deadline is required.");
    isValid = false;
  } else if (startDate !== "" && deadline < startDate) {
    showError("projectDeadline", "Deadline cannot be before the start date.");
    isValid = false;
  }

  if (!isValid) return;

  const projects = getAllProjects();

  if (id === "") {
    // --- ADD a new project ---
    projects.push({
      id: Date.now(),              // unique number based on the time
      owner: currentUser.email,    // so each user only sees their own projects
      name: name,
      description: description,
      startDate: startDate,
      deadline: deadline,
      status: status
    });
    showToast("Project added successfully");
  } else {
    // --- EDIT an existing project ---
    const project = projects.find(function (p) { return p.id === Number(id); });
    project.name = name;
    project.description = description;
    project.startDate = startDate;
    project.deadline = deadline;
    project.status = status;
    showToast("Project updated successfully");
  }

  saveAllProjects(projects);
  closeModal("projectModal");
  refreshAll();
}

// Show all details of a project in the View popup
function viewProject(id) {
  const project = findProject(id);
  if (!project) return;

  document.getElementById("viewContent").innerHTML =
    '<div class="detail-row"><span>Project Name</span><p><strong>' + escapeHTML(project.name) + "</strong></p></div>" +
    '<div class="detail-row"><span>Description</span><p>' + escapeHTML(project.description) + "</p></div>" +
    '<div class="form-row">' +
      '<div class="detail-row"><span>Start Date</span><p>' + formatDate(project.startDate) + "</p></div>" +
      '<div class="detail-row"><span>Deadline</span><p>' + formatDate(project.deadline) + "</p></div>" +
    "</div>" +
    '<div class="detail-row"><span>Status</span><p><span class="badge ' + statusClass(project.status) + '">' + project.status + "</span></p></div>";

  openModal("viewModal");
}

// Delete a project after asking for confirmation
function deleteProject(id) {
  const project = findProject(id);
  if (!project) return;

  if (!confirm('Are you sure you want to delete "' + project.name + '"?')) return;

  const projects = getAllProjects().filter(function (p) { return p.id !== id; });
  saveAllProjects(projects);
  refreshAll();
  showToast("Project deleted");
}

// Change the status straight from the dropdown on a card
function changeStatus(id, newStatus) {
  const projects = getAllProjects();
  const project = projects.find(function (p) { return p.id === id; });
  project.status = newStatus;
  saveAllProjects(projects);
  refreshAll();
  showToast("Status changed to " + newStatus);
}


/* =========================================================
   12. PROFILE PAGE
   ========================================================= */
function startProfile() {
  renderProfile();

  document.getElementById("editProfileBtn").addEventListener("click", openProfileModal);
  document.getElementById("changePasswordBtn").addEventListener("click", function () {
    const form = document.getElementById("passwordForm");
    form.reset();
    clearErrors(form);
    openModal("passwordModal");
  });
  document.getElementById("profileForm").addEventListener("submit", saveProfile);

  // Settings page links to "profile.html?edit=1" to open the edit form directly
  if (window.location.search.includes("edit=1")) openProfileModal();
}

// Show the current user's details on the page
function renderProfile() {
  const firstLetter = currentUser.name.charAt(0).toUpperCase();
  const role = currentUser.role || "Team Member";

  document.getElementById("profileAvatar").textContent = firstLetter;
  document.getElementById("profileName").textContent = currentUser.name;
  document.getElementById("profileRole").textContent = role;
  document.getElementById("profileEmail").textContent = currentUser.email;

  // "|| 'Not added'" shows a default text when a field is empty
  document.getElementById("infoName").textContent = currentUser.name;
  document.getElementById("infoEmail").textContent = currentUser.email;
  document.getElementById("infoPhone").textContent = currentUser.phone || "Not added";
  document.getElementById("infoRole").textContent = role;
  document.getElementById("infoLocation").textContent = currentUser.location || "Not added";
  document.getElementById("infoJoined").textContent = formatDate(currentUser.joined);
  document.getElementById("infoBio").textContent = currentUser.bio || "No bio added yet.";

  // Project activity numbers
  const counts = countProjects();
  document.getElementById("profileTotal").textContent = counts.total;
  document.getElementById("profileProgress").textContent = counts.progress;
  document.getElementById("profileCompleted").textContent = counts.completed;
  document.getElementById("profilePending").textContent = counts.pending;
}

// Fill the Edit Profile form with the current details and open it
function openProfileModal() {
  const form = document.getElementById("profileForm");
  clearErrors(form);
  document.getElementById("editName").value = currentUser.name;
  document.getElementById("editEmail").value = currentUser.email;
  document.getElementById("editPhone").value = currentUser.phone || "";
  document.getElementById("editRole").value = currentUser.role || "";
  document.getElementById("editLocation").value = currentUser.location || "";
  document.getElementById("editBio").value = currentUser.bio || "";
  openModal("profileModal");
}

// Runs when the Edit Profile form is submitted
function saveProfile(event) {
  event.preventDefault();
  const form = document.getElementById("profileForm");
  clearErrors(form);

  const name = document.getElementById("editName").value.trim();
  const email = document.getElementById("editEmail").value.trim().toLowerCase();
  const phone = document.getElementById("editPhone").value.trim();
  const oldEmail = currentUser.email;

  let isValid = true;

  // --- Validate ---
  if (name.length < 3) {
    showError("editName", "Name must be at least 3 characters.");
    isValid = false;
  }

  // The email must be valid, unless it was not changed
  // (the admin username "admin@123" is not a normal email)
  if (email === "") {
    showError("editEmail", "Email is required.");
    isValid = false;
  } else if (email !== oldEmail && !isValidEmail(email)) {
    showError("editEmail", "Please enter a valid email address.");
    isValid = false;
  } else if (email !== oldEmail) {
    // Make sure no other user already has this email
    const taken = getUsers().some(function (u) { return u.email === email; });
    if (taken) {
      showError("editEmail", "This email is already used by another account.");
      isValid = false;
    }
  }

  // Phone is optional, but if given it may only have digits, spaces, + and -
  if (phone !== "" && !/^[0-9+\-\s]{7,15}$/.test(phone)) {
    showError("editPhone", "Enter a valid phone number (7-15 digits).");
    isValid = false;
  }

  if (!isValid) return;

  // --- Update the user object ---
  currentUser.name = name;
  currentUser.email = email;
  currentUser.phone = phone;
  currentUser.role = document.getElementById("editRole").value.trim();
  currentUser.location = document.getElementById("editLocation").value.trim();
  currentUser.bio = document.getElementById("editBio").value.trim();

  // --- If the email changed, move the user's projects to the new email ---
  if (email !== oldEmail) {
    const projects = getAllProjects();
    projects.forEach(function (p) {
      if (p.owner === oldEmail) p.owner = email;
    });
    saveAllProjects(projects);
  }

  saveCurrentUser(oldEmail);
  closeModal("profileModal");
  renderProfile();
  fillUserInfo();
  showToast("Profile updated successfully");
}


/* =========================================================
   13. CHANGE PASSWORD (used on Profile AND Settings pages)
   Both pages have a form with id="passwordForm".
   ========================================================= */
function setupPasswordForm() {
  const form = document.getElementById("passwordForm");
  if (!form) return; // this page has no password form

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors(form);

    const current = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmNewPassword").value;

    let isValid = true;

    // --- Validate ---
    if (current === "") {
      showError("currentPassword", "Please enter your current password.");
      isValid = false;
    } else if (current !== currentUser.password) {
      showError("currentPassword", "Current password is incorrect.");
      isValid = false;
    }

    if (newPass === "") {
      showError("newPassword", "Please enter a new password.");
      isValid = false;
    } else if (newPass.length < 6) {
      showError("newPassword", "New password must be at least 6 characters.");
      isValid = false;
    } else if (newPass === current) {
      showError("newPassword", "New password must be different from the current one.");
      isValid = false;
    }

    if (confirmPass === "") {
      showError("confirmNewPassword", "Please confirm your new password.");
      isValid = false;
    } else if (confirmPass !== newPass) {
      showError("confirmNewPassword", "Passwords do not match.");
      isValid = false;
    }

    if (!isValid) return;

    // --- Save the new password ---
    currentUser.password = newPass;
    saveCurrentUser(currentUser.email);
    form.reset();

    // On the Profile page the form is inside a popup, so close it
    if (document.getElementById("passwordModal")) closeModal("passwordModal");
    showToast("Password changed successfully");
  });
}


/* =========================================================
   14. SETTINGS PAGE
   ========================================================= */
function startSettings() {
  const settings = getSettings();

  // ----- Account info -----
  document.getElementById("settingsName").textContent = currentUser.name;
  document.getElementById("settingsEmail").textContent = currentUser.email;
  document.getElementById("settingsJoined").textContent = formatDate(currentUser.joined);

  // ----- Dark mode switch -----
  const darkSwitch = document.getElementById("darkModeSwitch");
  darkSwitch.checked = settings.theme === "dark";
  darkSwitch.addEventListener("change", function () {
    setTheme(darkSwitch.checked ? "dark" : "light");
    showToast(darkSwitch.checked ? "Dark mode on" : "Light mode on");
  });

  // ----- Number of recent projects on the dashboard -----
  const recentSelect = document.getElementById("recentCountSelect");
  recentSelect.value = String(settings.recentCount);
  recentSelect.addEventListener("change", function () {
    const newSettings = getSettings();
    newSettings.recentCount = Number(recentSelect.value);
    saveSettings(newSettings);
    showToast("Preference saved");
  });

  // ----- Delete all of my projects -----
  document.getElementById("clearProjectsBtn").addEventListener("click", function () {
    const myCount = getMyProjects().length;

    if (myCount === 0) {
      showToast("You have no projects to delete");
      return;
    }

    if (!confirm("Delete all " + myCount + " of your projects? This cannot be undone.")) return;

    // Keep only the projects that belong to OTHER users
    const others = getAllProjects().filter(function (p) {
      return p.owner !== currentUser.email;
    });
    saveAllProjects(others);
    showToast("All your projects were deleted");
  });
}


/* =========================================================
   15. START THE RIGHT CODE FOR EACH PAGE
   App pages have <body data-page="...">.
   Login and sign-up pages do not, so nothing here runs there.
   ========================================================= */
const appPage = document.body.dataset.page;

if (appPage) {
  currentUser = getCurrentUser();

  // Login protection: nobody logged in -> back to the login page
  if (!currentUser) {
    window.location.href = "index.html";
  } else {
    setupLayout();        // sidebar, top bar, logout (every app page)
    setupPasswordForm();  // only does something if the page has the form

    if (appPage === "dashboard") startDashboard();
    if (appPage === "profile") startProfile();
    if (appPage === "settings") startSettings();
    // The About page only needs the shared layout
  }
}
