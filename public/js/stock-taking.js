let stockTakingModal;

let allStockTakings = [];


// =====================================================
// LOAD CURRENT USER
// =====================================================

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


        const user =
            data.user;


        const userName =
            document.getElementById(
                "userName"
            );


        if (userName) {

            userName.textContent =
                user.full_name;
        }


        return user;

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


// =====================================================
// LOAD STOCK TAKINGS
// =====================================================

async function loadStockTakings() {

    const table =
        document.getElementById(
            "stockTakingTable"
        );


    try {

        const response =
            await fetch(
                "/stock-takings",
                {
                    credentials: "include"
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login.html";

            return;
        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load stock takings."
            );
        }


        allStockTakings =
            data.data || [];


        renderStockTakings(
            allStockTakings
        );

    } catch (error) {

        console.error(
            "Load stock takings error:",
            error
        );


        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-danger py-4">

                    Failed to load stock takings.

                </td>
            </tr>
        `;
    }
}


// =====================================================
// RENDER STOCK TAKINGS
// =====================================================

function renderStockTakings(
    stockTakings
) {

    const table =
        document.getElementById(
            "stockTakingTable"
        );


    if (!stockTakings.length) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-muted py-4">

                    <i class="bi bi-clipboard-x fs-3 d-block mb-2"></i>

                    No stock taking records found.

                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        stockTakings.map(
            stockTaking => {

                const statusBadge =
                    getStatusBadge(
                        stockTaking.status
                    );


                const createdDate =
                    formatDate(
                        stockTaking.created_at
                    );


                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    stockTaking.reference_number
                                )}
                            </strong>
                        </td>


                        <td>

                            ${escapeHtml(
                                stockTaking.title
                            )}

                        </td>


                        <td>

                            ${Number(
                                stockTaking.total_items || 0
                            ).toLocaleString()}

                        </td>


                        <td>

                            ${Number(
                                stockTaking.items_with_difference || 0
                            ).toLocaleString()}

                        </td>


                        <td>

                            ${statusBadge}

                        </td>


                        <td>

                            ${createdDate}

                        </td>


                        <td class="text-end">

                            <button
                                class="btn btn-sm btn-outline-primary"
                                onclick="openStockTaking(${stockTaking.id})">

                                <i class="bi bi-eye"></i>

                                View

                            </button>

                        </td>

                    </tr>
                `;
            }
        ).join("");
}


// =====================================================
// STATUS BADGE
// =====================================================

function getStatusBadge(status) {

    const classes = {

        draft: "bg-secondary",

        in_progress: "bg-warning text-dark",

        completed: "bg-success",

        cancelled: "bg-danger"

    };


    const labels = {

        draft: "Draft",

        in_progress: "In Progress",

        completed: "Completed",

        cancelled: "Cancelled"

    };


    return `
        <span class="badge ${classes[status] || "bg-secondary"}">

            ${labels[status] || status}

        </span>
    `;
}


// =====================================================
// CREATE MODAL
// =====================================================

function openNewStockTakingModal() {

    document.getElementById(
        "stockTakingTitle"
    ).value = "";


    document.getElementById(
        "stockTakingDescription"
    ).value = "";


    const message =
        document.getElementById(
            "formMessage"
        );


    message.className =
        "alert d-none";


    if (!stockTakingModal) {

        stockTakingModal =
            new bootstrap.Modal(
                document.getElementById(
                    "stockTakingModal"
                )
            );
    }


    stockTakingModal.show();
}


// =====================================================
// CREATE STOCK TAKING
// =====================================================

async function createStockTaking() {

    const title =
        document.getElementById(
            "stockTakingTitle"
        ).value.trim();


    const description =
        document.getElementById(
            "stockTakingDescription"
        ).value.trim();


    const button =
        document.getElementById(
            "btnCreateStockTaking"
        );


    const message =
        document.getElementById(
            "formMessage"
        );


    if (!title) {

        message.className =
            "alert alert-danger";

        message.textContent =
            "Stock taking title is required.";

        return;
    }


    button.disabled = true;

    button.innerHTML =
        `
        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        Creating...
        `;


    try {

        const response =
            await fetch(
                "/stock-takings",
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title,
                        description
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to create stock taking."
            );
        }


        stockTakingModal.hide();


        await loadStockTakings();


        // Open the newly created stock taking

        if (data.data?.id) {

            openStockTaking(
                data.data.id
            );
        }


    } catch (error) {

        console.error(
            "Create stock taking error:",
            error
        );


        message.className =
            "alert alert-danger";


        message.textContent =
            error.message;

    } finally {

        button.disabled = false;

        button.innerHTML =
            `
            <i class="bi bi-check-circle me-1"></i>

            Create
            `;
    }
}


// =====================================================
// OPEN STOCK TAKING
// =====================================================

function openStockTaking(id) {

    window.location.href =
        `/pages/stock-taking-details.html?id=${id}`;
}


// =====================================================
// SEARCH
// =====================================================

function searchStockTakings() {

    const search =
        document.getElementById(
            "searchStockTaking"
        ).value
            .trim()
            .toLowerCase();


    if (!search) {

        renderStockTakings(
            allStockTakings
        );

        return;
    }


    const filtered =
        allStockTakings.filter(
            item => {

                return (

                    String(
                        item.reference_number || ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        item.title || ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        item.status || ""
                    )
                        .toLowerCase()
                        .includes(search)

                );
            }
        );


    renderStockTakings(
        filtered
    );
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleDateString(
        "en-TZ",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// LOGOUT
// =====================================================

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


// =====================================================
// INITIALIZE
// =====================================================

async function initialize() {

    const user =
        await loadCurrentUser();


    if (!user) {
        return;
    }


    await loadStockTakings();
}


// =====================================================
// EVENTS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const newButton =
            document.getElementById(
                "btnNewStockTaking"
            );


        if (newButton) {

            newButton.addEventListener(
                "click",
                openNewStockTakingModal
            );
        }


        const createButton =
            document.getElementById(
                "btnCreateStockTaking"
            );


        if (createButton) {

            createButton.addEventListener(
                "click",
                createStockTaking
            );
        }


        const searchInput =
            document.getElementById(
                "searchStockTaking"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                searchStockTakings
            );
        }


        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );
        }


        initialize();

    }
);

// ========================================
// COPYRIGHT
// ========================================

function displayCopyrightYear() {

    const yearElement =
        document.getElementById(
            "copyrightYear"
        );


    if (!yearElement) {

        return;

    }


    yearElement.textContent =
        new Date().getFullYear();

}

displayCopyrightYear();