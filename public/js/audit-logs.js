let auditLogs = [];

let currentUser = null;

let detailsModal;


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


        if (
            !data.success ||
            !data.user
        ) {

            window.location.href =
                "/login.html";

            return null;

        }


        currentUser =
            data.user;


        // --------------------------------
        // ADMIN ONLY
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


        document.getElementById(
            "userName"
        ).textContent =
            currentUser.full_name;


        document.getElementById(
            "userRole"
        ).textContent =
            currentUser.role
                .charAt(0)
                .toUpperCase()
            +
            currentUser.role.slice(1);


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
// LOAD LOGS
// ========================================

async function loadAuditLogs() {

    try {

        const response =
            await fetch(
                "/audit-logs",
                {
                    credentials: "include"
                }
            );


        if (
            response.status ===
            401
        ) {

            window.location.href =
                "/login.html";

            return;

        }


        if (
            response.status ===
            403
        ) {

            alert(
                "Access denied."
            );


            window.location.href =
                "/dashboard.html";


            return;

        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load audit logs."
            );

        }


        auditLogs =
            data.logs || [];


        buildFilters();

        updateStatistics();

        displayLogs(
            auditLogs
        );


    } catch (error) {

        console.error(
            "Audit logs error:",
            error
        );


        showAlert(
            error.message,
            "danger"
        );

    }

}


// ========================================
// DISPLAY LOGS
// ========================================

function displayLogs(
    logs
) {

    const table =
        document.getElementById(
            "auditLogsTable"
        );


    if (!table) {
        return;
    }


    if (
        logs.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="text-center text-muted py-5">

                    <i
                        class="bi bi-journal-x fs-1 d-block mb-2">
                    </i>

                    No audit logs found.

                </td>

            </tr>

        `;


        return;

    }


    table.innerHTML =
        logs.map(
            (log, index) => {

                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <div
                                class="fw-semibold">

                                ${escapeHtml(
                                    log.full_name ||
                                    "Unknown User"
                                )}

                            </div>


                            <small
                                class="text-muted">

                                ${escapeHtml(
                                    log.email ||
                                    ""
                                )}

                            </small>

                        </td>


                        <td>

                            ${getActionBadge(
                                log.action
                            )}

                        </td>


                        <td>

                            <span
                                class="badge text-bg-light border">

                                ${
                                    log.table_name
                                        ? escapeHtml(
                                            log.table_name
                                        )
                                        : "—"
                                }

                            </span>

                        </td>


                        <td>

                            <span
                                class="d-inline-block text-truncate"
                                style="max-width:300px;"
                                title="${escapeHtml(
                                    log.description || ""
                                )}">

                                ${
                                    log.description
                                        ? escapeHtml(
                                            log.description
                                        )
                                        : "—"
                                }

                            </span>


                            <button
                                class="btn btn-sm btn-link p-0 ms-1"
                                onclick="showLogDetails(${log.id})">

                                Details

                            </button>

                        </td>


                        <td>

                            <code>
                                ${
                                    log.ip_address
                                        ? escapeHtml(
                                            log.ip_address
                                        )
                                        : "—"
                                }
                            </code>

                        </td>


                        <td>

                            <div>

                                ${formatDate(
                                    log.created_at
                                )}

                            </div>

                            <small
                                class="text-muted">

                                ${formatTime(
                                    log.created_at
                                )}

                            </small>

                        </td>


                    </tr>

                `;

            }
        ).join("");

}


// ========================================
// ACTION BADGE
// ========================================

function getActionBadge(
    action
) {

    const actionMap = {

        LOGIN: {
            className:
                "text-bg-success",
            icon:
                "bi-box-arrow-in-right",
            text:
                "Login"
        },

        LOGOUT: {
            className:
                "text-bg-secondary",
            icon:
                "bi-box-arrow-right",
            text:
                "Logout"
        },

        CREATE_USER: {
            className:
                "text-bg-primary",
            icon:
                "bi-person-plus",
            text:
                "Create User"
        },

        UPDATE_USER: {
            className:
                "text-bg-info",
            icon:
                "bi-person-gear",
            text:
                "Update User"
        },

        CHANGE_PASSWORD: {
            className:
                "text-bg-warning",
            icon:
                "bi-key",
            text:
                "Change Password"
        },

        ACTIVATE_USER: {
            className:
                "text-bg-success",
            icon:
                "bi-person-check",
            text:
                "Activate User"
        },

        DEACTIVATE_USER: {
            className:
                "text-bg-secondary",
            icon:
                "bi-person-slash",
            text:
                "Deactivate User"
        },

        DELETE_USER: {
            className:
                "text-bg-danger",
            icon:
                "bi-trash",
            text:
                "Delete User"
        }

    };


    const item =
        actionMap[action];


    if (!item) {

        return `

            <span
                class="badge text-bg-dark">

                ${escapeHtml(
                    action || "UNKNOWN"
                )}

            </span>

        `;

    }


    return `

        <span
            class="badge ${item.className}">

            <i
                class="bi ${item.icon} me-1">
            </i>

            ${item.text}

        </span>

    `;

}


// ========================================
// FILTER OPTIONS
// ========================================

function buildFilters() {

    const actionFilter =
        document.getElementById(
            "actionFilter"
        );


    const moduleFilter =
        document.getElementById(
            "moduleFilter"
        );


    const actions =
        [
            ...new Set(
                auditLogs
                    .map(
                        log =>
                            log.action
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    const modules =
        [
            ...new Set(
                auditLogs
                    .map(
                        log =>
                            log.table_name
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    actionFilter.innerHTML =
        `
            <option value="">
                All Actions
            </option>
        `
        +
        actions.map(
            action => `
                <option value="${escapeHtml(
                    action
                )}">
                    ${escapeHtml(
                        action
                    )}
                </option>
            `
        ).join("");


    moduleFilter.innerHTML =
        `
            <option value="">
                All Modules
            </option>
        `
        +
        modules.map(
            module => `
                <option value="${escapeHtml(
                    module
                )}">
                    ${escapeHtml(
                        module
                    )}
                </option>
            `
        ).join("");

}


// ========================================
// FILTER LOGS
// ========================================

function filterLogs() {

    const search =
        document.getElementById(
            "searchLogs"
        )
        .value
        .toLowerCase()
        .trim();


    const action =
        document.getElementById(
            "actionFilter"
        ).value;


    const module =
        document.getElementById(
            "moduleFilter"
        ).value;


    const filtered =
        auditLogs.filter(
            log => {

                const searchableText = [

                    log.full_name,

                    log.email,

                    log.action,

                    log.table_name,

                    log.description,

                    log.ip_address

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const matchesAction =
                    !action ||
                    log.action ===
                    action;


                const matchesModule =
                    !module ||
                    log.table_name ===
                    module;


                return (
                    matchesSearch &&
                    matchesAction &&
                    matchesModule
                );

            }
        );


    displayLogs(
        filtered
    );

}


// ========================================
// CLEAR FILTERS
// ========================================

function clearFilters() {

    document.getElementById(
        "searchLogs"
    ).value = "";


    document.getElementById(
        "actionFilter"
    ).value = "";


    document.getElementById(
        "moduleFilter"
    ).value = "";


    displayLogs(
        auditLogs
    );

}


// ========================================
// STATISTICS
// ========================================

function updateStatistics() {

    document.getElementById(
        "totalLogs"
    ).textContent =
        auditLogs.length.toLocaleString();


    const loginCount =
        auditLogs.filter(
            log =>
                log.action ===
                "LOGIN"
        ).length;


    document.getElementById(
        "loginLogs"
    ).textContent =
        loginCount.toLocaleString();


    const userChangeActions = [

        "CREATE_USER",

        "UPDATE_USER",

        "CHANGE_PASSWORD",

        "ACTIVATE_USER",

        "DEACTIVATE_USER",

        "DELETE_USER"

    ];


    const userChanges =
        auditLogs.filter(
            log =>
                userChangeActions.includes(
                    log.action
                )
        ).length;


    document.getElementById(
        "userChanges"
    ).textContent =
        userChanges.toLocaleString();


    const today =
        new Date();


    const todayString =
        today.toLocaleDateString(
            "en-CA"
        );


    const todayCount =
        auditLogs.filter(
            log => {

                const date =
                    new Date(
                        log.created_at
                    );


                return (
                    date.toLocaleDateString(
                        "en-CA"
                    ) ===
                    todayString
                );

            }
        ).length;


    document.getElementById(
        "todayLogs"
    ).textContent =
        todayCount.toLocaleString();

}


// ========================================
// SHOW LOG DETAILS
// ========================================

function showLogDetails(
    id
) {

    const log =
        auditLogs.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!log) {
        return;
    }


    const details =
        document.getElementById(
            "logDetails"
        );


    details.innerHTML = `

        <div
            class="row g-3">


            <div
                class="col-md-6">

                <strong>
                    User
                </strong>

                <div>
                    ${escapeHtml(
                        log.full_name ||
                        "Unknown"
                    )}
                </div>

            </div>


            <div
                class="col-md-6">

                <strong>
                    Email
                </strong>

                <div>
                    ${escapeHtml(
                        log.email ||
                        "—"
                    )}
                </div>

            </div>


            <div
                class="col-md-6">

                <strong>
                    Action
                </strong>

                <div class="mt-1">

                    ${getActionBadge(
                        log.action
                    )}

                </div>

            </div>


            <div
                class="col-md-6">

                <strong>
                    Module
                </strong>

                <div>

                    ${
                        log.table_name
                            ? escapeHtml(
                                log.table_name
                            )
                            : "—"
                    }

                </div>

            </div>


            <div
                class="col-md-6">

                <strong>
                    Record ID
                </strong>

                <div>

                    ${
                        log.record_id ??
                        "—"
                    }

                </div>

            </div>


            <div
                class="col-md-6">

                <strong>
                    IP Address
                </strong>

                <div>

                    <code>
                        ${
                            log.ip_address
                                ? escapeHtml(
                                    log.ip_address
                                )
                                : "—"
                        }
                    </code>

                </div>

            </div>


            <div
                class="col-12">

                <strong>
                    Description
                </strong>

                <div
                    class="bg-light rounded p-3 mt-1">

                    ${
                        log.description
                            ? escapeHtml(
                                log.description
                            )
                            : "No description."
                    }

                </div>

            </div>


            <div
                class="col-md-6">

                <strong>
                    Date
                </strong>

                <div>

                    ${formatDate(
                        log.created_at
                    )}

                </div>

            </div>


            <div
                class="col-md-6">

                <strong>
                    Time
                </strong>

                <div>

                    ${formatTime(
                        log.created_at
                    )}

                </div>

            </div>


        </div>

    `;


    detailsModal.show();

}


// ========================================
// DATE
// ========================================

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    return new Date(
        value
    ).toLocaleDateString(
        "en-TZ",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


// ========================================
// TIME
// ========================================

function formatTime(
    value
) {

    if (!value) {
        return "—";
    }


    return new Date(
        value
    ).toLocaleTimeString(
        "en-TZ",
        {
            hour:
                "2-digit",

            minute:
                "2-digit",

            second:
                "2-digit"
        }
    );

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
            class="alert alert-${type} alert-dismissible fade show">

            <i
                class="bi ${
                    type === "success"
                        ? "bi-check-circle"
                        : "bi-exclamation-triangle"
                } me-2">
            </i>

            ${escapeHtml(
                message
            )}

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

function escapeHtml(
    value
) {

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
                    method:
                        "POST",

                    credentials:
                        "include"
                }
            );


        const data =
            await response.json();


        if (
            data.success
        ) {

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

        detailsModal =
            new bootstrap.Modal(
                document.getElementById(
                    "logDetailsModal"
                )
            );


        document.getElementById(
            "searchLogs"
        ).addEventListener(
            "input",
            filterLogs
        );


        document.getElementById(
            "actionFilter"
        ).addEventListener(
            "change",
            filterLogs
        );


        document.getElementById(
            "moduleFilter"
        ).addEventListener(
            "change",
            filterLogs
        );


        document.getElementById(
            "clearFiltersButton"
        ).addEventListener(
            "click",
            clearFilters
        );


        document.getElementById(
            "refreshLogsButton"
        ).addEventListener(
            "click",
            loadAuditLogs
        );


        document.getElementById(
            "logoutButton"
        ).addEventListener(
            "click",
            logout
        );


        document.getElementById(
            "mobileLogoutButton"
        ).addEventListener(
            "click",
            logout
        );


        document.getElementById(
            "copyrightYear"
        ).textContent =
            new Date().getFullYear();


        const user =
            await loadCurrentUser();


        if (!user) {
            return;
        }


        await loadAuditLogs();

    }
);