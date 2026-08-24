let users = [];

let currentUser = null;

let userModal;
let passwordModal;


// ========================================
// LOAD CURRENT USER
// ========================================

async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                "/auth/me",
                {
                    credentials: "include"
                }
            );


        if (!response.ok) {

            window.location.href =
                "/login.html";

            return null;

        }


        const data =
            await response.json();


        if (!data.success || !data.user) {

            window.location.href =
                "/login.html";

            return null;

        }


        currentUser =
            data.user;


        // --------------------------------
        // ADMIN CHECK
        // --------------------------------

        if (
            currentUser.role !==
            "admin"
        ) {

            alert(
                "Access denied. Administrator privileges required."
            );

            window.location.href =
                "/dashboard.html";

            return null;

        }


        const userName =
            document.getElementById(
                "userName"
            );

        const userRole =
            document.getElementById(
                "userRole"
            );


        if (userName) {

            userName.textContent =
                currentUser.full_name;

        }


        if (userRole) {

            userRole.textContent =
                currentUser.role
                    .charAt(0)
                    .toUpperCase()
                +
                currentUser.role.slice(1);

        }


        return currentUser;


    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        window.location.href =
            "/login.html";

        return null;

    }

}


// ========================================
// LOAD USERS
// ========================================

async function loadUsers() {

    try {

        const response =
            await fetch(
                "/users",
                {
                    credentials: "include"
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login.html";

            return;

        }


        if (response.status === 403) {

            alert(
                "Access denied."
            );

            window.location.href =
                "/dashboard.html";

            return;

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load users."
            );

        }


        users =
            data.users || [];


        displayUsers(users);


    } catch (error) {

        console.error(
            "Load users error:",
            error
        );


        showAlert(
            error.message,
            "danger"
        );

    }

}


// ========================================
// DISPLAY USERS
// ========================================

function displayUsers(userList) {

    const table =
        document.getElementById(
            "usersTable"
        );


    if (!table) {
        return;
    }


    if (userList.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="text-center text-muted py-5">

                    <i
                        class="bi bi-people fs-1 d-block mb-2">
                    </i>

                    No users found.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        userList.map(
            (user, index) => {

                const roleBadge =
                    getRoleBadge(
                        user.role
                    );


                const statusBadge =
                    user.status ===
                    "active"

                        ? `
                            <span
                                class="badge text-bg-success">
                                Active
                            </span>
                          `

                        : `
                            <span
                                class="badge text-bg-secondary">
                                Inactive
                            </span>
                          `;


                const createdDate =
                    new Date(
                        user.created_at
                    ).toLocaleDateString(
                        "en-TZ",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    );


                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <div
                                class="d-flex align-items-center">

                                <div
                                    class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                                    style="width:40px;height:40px;">

                                    <i class="bi bi-person">
                                    </i>

                                </div>


                                <div>

                                    <div
                                        class="fw-semibold">

                                        ${escapeHtml(
                                            user.full_name
                                        )}

                                    </div>

                                </div>

                            </div>

                        </td>


                        <td>

                            ${escapeHtml(
                                user.email
                            )}

                        </td>


                        <td>

                            ${roleBadge}

                        </td>


                        <td>

                            ${statusBadge}

                        </td>


                        <td>

                            ${createdDate}

                        </td>


                        <td class="text-end">

                            <div
                                class="btn-group">

                                <button
                                    class="btn btn-sm btn-outline-primary"
                                    title="Edit"
                                    onclick="editUser(${user.id})">

                                    <i
                                        class="bi bi-pencil">
                                    </i>

                                </button>


                                <button
                                    class="btn btn-sm btn-outline-warning"
                                    title="Change Password"
                                    onclick="changePassword(${user.id})">

                                    <i
                                        class="bi bi-key">
                                    </i>

                                </button>


                                ${
                                    Number(user.id) ===
                                    Number(currentUser.id)

                                    ?

                                    ""

                                    :

                                    `

                                    <button
                                        class="btn btn-sm btn-outline-secondary"
                                        title="${
                                            user.status ===
                                            "active"
                                                ? "Deactivate"
                                                : "Activate"
                                        }"
                                        onclick="toggleStatus(
                                            ${user.id},
                                            '${user.status}'
                                        )">

                                        <i
                                            class="bi ${
                                                user.status ===
                                                "active"
                                                    ? "bi-person-slash"
                                                    : "bi-person-check"
                                            }">
                                        </i>

                                    </button>


                                    <button
                                        class="btn btn-sm btn-outline-danger"
                                        title="Delete"
                                        onclick="deleteUser(${user.id})">

                                        <i
                                            class="bi bi-trash">
                                        </i>

                                    </button>

                                    `
                                }

                            </div>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


// ========================================
// ROLE BADGE
// ========================================

function getRoleBadge(role) {

    if (role === "admin") {

        return `
            <span class="badge text-bg-primary">
                <i class="bi bi-shield-check me-1"></i>
                Administrator
            </span>
        `;

    }


    if (role === "manager") {

        return `
            <span class="badge text-bg-info">
                <i class="bi bi-person-gear me-1"></i>
                Manager
            </span>
        `;

    }


    return `
        <span class="badge text-bg-light border">
            <i class="bi bi-person me-1"></i>
            Staff
        </span>
    `;

}


// ========================================
// ADD USER
// ========================================

function openAddUserModal() {

    document.getElementById(
        "userForm"
    ).reset();


    document.getElementById(
        "userId"
    ).value = "";


    document.getElementById(
        "userModalTitle"
    ).textContent =
        "Add User";


    document.getElementById(
        "passwordGroup"
    ).classList.remove(
        "d-none"
    );


    document.getElementById(
        "password"
    ).required = true;


    userModal.show();

}


// ========================================
// EDIT USER
// ========================================

function editUser(id) {

    const user =
        users.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!user) {

        return;

    }


    document.getElementById(
        "userId"
    ).value =
        user.id;


    document.getElementById(
        "fullName"
    ).value =
        user.full_name;


    document.getElementById(
        "email"
    ).value =
        user.email;


    document.getElementById(
        "role"
    ).value =
        user.role;


    document.getElementById(
        "status"
    ).value =
        user.status;


    document.getElementById(
        "password"
    ).value = "";


    document.getElementById(
        "passwordGroup"
    ).classList.add(
        "d-none"
    );


    document.getElementById(
        "password"
    ).required = false;


    document.getElementById(
        "userModalTitle"
    ).textContent =
        "Edit User";


    userModal.show();

}


// ========================================
// SAVE USER
// ========================================

async function saveUser(event) {

    event.preventDefault();


    const userId =
        document.getElementById(
            "userId"
        ).value;


    const full_name =
        document.getElementById(
            "fullName"
        ).value.trim();


    const email =
        document.getElementById(
            "email"
        ).value.trim();


    const password =
        document.getElementById(
            "password"
        ).value;


    const role =
        document.getElementById(
            "role"
        ).value;


    const status =
        document.getElementById(
            "status"
        ).value;


    const button =
        document.getElementById(
            "saveUserButton"
        );


    button.disabled = true;


    try {

        let response;


        if (userId) {

            response =
                await fetch(
                    `/users/${userId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body: JSON.stringify({
                            full_name,
                            email,
                            role,
                            status
                        })
                    }
                );

        } else {

            response =
                await fetch(
                    "/users",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body: JSON.stringify({
                            full_name,
                            email,
                            password,
                            role,
                            status
                        })
                    }
                );

        }


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.message ||
                "Failed to save user."
            );

        }


        userModal.hide();


        showAlert(
            data.message,
            "success"
        );


        await loadUsers();


    } catch (error) {

        console.error(
            "Save user error:",
            error
        );


        showAlert(
            error.message,
            "danger"
        );

    } finally {

        button.disabled = false;

    }

}


// ========================================
// CHANGE PASSWORD
// ========================================

function changePassword(id) {

    const user =
        users.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!user) {
        return;
    }


    document.getElementById(
        "passwordUserId"
    ).value =
        user.id;


    document.getElementById(
        "passwordUserName"
    ).textContent =
        user.full_name;


    document.getElementById(
        "newPassword"
    ).value = "";


    passwordModal.show();

}


// ========================================
// SAVE PASSWORD
// ========================================

async function savePassword(event) {

    event.preventDefault();


    const userId =
        document.getElementById(
            "passwordUserId"
        ).value;


    const password =
        document.getElementById(
            "newPassword"
        ).value;


    try {

        const response =
            await fetch(
                `/users/${userId}/password`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        password
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.message ||
                "Failed to change password."
            );

        }


        passwordModal.hide();


        showAlert(
            data.message,
            "success"
        );


    } catch (error) {

        console.error(
            "Password error:",
            error
        );


        showAlert(
            error.message,
            "danger"
        );

    }

}


// ========================================
// TOGGLE STATUS
// ========================================

async function toggleStatus(
    id,
    currentStatus
) {

    const newStatus =
        currentStatus === "active"
            ? "inactive"
            : "active";


    const action =
        newStatus === "active"
            ? "activate"
            : "deactivate";


    if (
        !confirm(
            `Are you sure you want to ${action} this user?`
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/users/${id}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.message ||
                "Failed to update status."
            );

        }


        showAlert(
            data.message,
            "success"
        );


        await loadUsers();


    } catch (error) {

        console.error(
            "Status error:",
            error
        );


        showAlert(
            error.message,
            "danger"
        );

    }

}


// ========================================
// DELETE USER
// ========================================

async function deleteUser(id) {

    const user =
        users.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!user) {
        return;
    }


    const confirmed =
        confirm(
            `Delete user "${user.full_name}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/users/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.message ||
                "Failed to delete user."
            );

        }


        showAlert(
            data.message,
            "success"
        );


        await loadUsers();


    } catch (error) {

        console.error(
            "Delete user error:",
            error
        );


        showAlert(
            error.message,
            "danger"
        );

    }

}


// ========================================
// SEARCH
// ========================================

function searchUsers() {

    const search =
        document.getElementById(
            "searchUser"
        )
        .value
        .toLowerCase()
        .trim();


    if (!search) {

        displayUsers(users);

        return;

    }


    const filtered =
        users.filter(
            user =>

                user.full_name
                    .toLowerCase()
                    .includes(search)

                ||

                user.email
                    .toLowerCase()
                    .includes(search)

                ||

                user.role
                    .toLowerCase()
                    .includes(search)

                ||

                user.status
                    .toLowerCase()
                    .includes(search)
        );


    displayUsers(filtered);

}


// ========================================
// ALERT
// ========================================

function showAlert(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "alertContainer"
        );


    container.innerHTML = `

        <div
            class="alert alert-${type} alert-dismissible fade show"
            role="alert">

            <i
                class="bi ${
                    type === "success"
                        ? "bi-check-circle"
                        : "bi-exclamation-triangle"
                } me-2">
            </i>

            ${escapeHtml(message)}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>

        </div>

    `;

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ========================================
// LOGOUT
// ========================================

async function logout() {

    try {

        const response =
            await fetch(
                "/auth/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (data.success) {

            window.location.href =
                "/login.html";

        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        userModal =
            new bootstrap.Modal(
                document.getElementById(
                    "userModal"
                )
            );


        passwordModal =
            new bootstrap.Modal(
                document.getElementById(
                    "passwordModal"
                )
            );


        document
            .getElementById(
                "addUserButton"
            )
            .addEventListener(
                "click",
                openAddUserModal
            );


        document
            .getElementById(
                "userForm"
            )
            .addEventListener(
                "submit",
                saveUser
            );


        document
            .getElementById(
                "passwordForm"
            )
            .addEventListener(
                "submit",
                savePassword
            );


        document
            .getElementById(
                "searchUser"
            )
            .addEventListener(
                "input",
                searchUsers
            );


        document
            .getElementById(
                "logoutButton"
            )
            .addEventListener(
                "click",
                logout
            );


        document
            .getElementById(
                "mobileLogoutButton"
            )
            .addEventListener(
                "click",
                logout
            );


        document
            .getElementById(
                "copyrightYear"
            )
            .textContent =
                new Date()
                    .getFullYear();


        const user =
            await loadCurrentUser();


        if (!user) {
            return;
        }


        await loadUsers();

    }
);