let stockTaking = null;

let stockTakingItems = [];

let filteredItems = [];

let completeModal;

let cancelModal;


// =====================================================
// GET STOCK TAKING ID
// =====================================================

function getStockTakingId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        Number(
            params.get("id")
        );

    return id;
}


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
// LOAD STOCK TAKING
// =====================================================

async function loadStockTaking() {

    const id =
        getStockTakingId();


    if (!id) {

        showPageMessage(
            "Invalid stock taking ID.",
            "danger"
        );

        return;
    }


    try {

        const response =
            await fetch(
                `/stock-takings/${id}`,
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


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load stock taking."
            );
        }


        stockTaking =
            data.data.stockTaking;


        stockTakingItems =
            data.data.items || [];


        filteredItems =
            [...stockTakingItems];


        renderStockTaking();


    } catch (error) {

        console.error(
            "Load stock taking error:",
            error
        );


        showPageMessage(
            error.message,
            "danger"
        );
    }
}


// =====================================================
// RENDER STOCK TAKING
// =====================================================

function renderStockTaking() {

    if (!stockTaking) {
        return;
    }


    document.title =
        `${stockTaking.title} - Stock Taking System`;


    document.getElementById(
        "stockTakingTitle"
    ).textContent =
        stockTaking.title;


    document.getElementById(
        "stockTakingReference"
    ).textContent =
        stockTaking.reference_number;


    document.getElementById(
        "stockTakingStatus"
    ).innerHTML =
        getStatusBadge(
            stockTaking.status
        );


    document.getElementById(
        "infoReference"
    ).textContent =
        stockTaking.reference_number;


    document.getElementById(
        "infoTitle"
    ).textContent =
        stockTaking.title;


    document.getElementById(
        "infoDescription"
    ).textContent =
        stockTaking.description || "-";


    document.getElementById(
        "infoCreated"
    ).textContent =
        formatDateTime(
            stockTaking.created_at
        );


    document.getElementById(
        "infoStarted"
    ).textContent =
        formatDateTime(
            stockTaking.started_at
        );


    document.getElementById(
        "infoCompleted"
    ).textContent =
        formatDateTime(
            stockTaking.completed_at
        );


    renderSummary();

    renderActionButtons();

    renderItems();
}


// =====================================================
// STATUS BADGE
// =====================================================

function getStatusBadge(status) {

    const classes = {

        draft: "bg-secondary",

        in_progress:
            "bg-warning text-dark",

        completed:
            "bg-success",

        cancelled:
            "bg-danger"

    };


    const labels = {

        draft: "Draft",

        in_progress:
            "In Progress",

        completed:
            "Completed",

        cancelled:
            "Cancelled"

    };


    return `
        <span class="badge ${
            classes[status] ||
            "bg-secondary"
        }">

            ${
                labels[status] ||
                status
            }

        </span>
    `;
}


// =====================================================
// SUMMARY
// =====================================================

function renderSummary() {

    const total =
        stockTakingItems.length;


    const counted =
        stockTakingItems.filter(
            item =>
                item.counted_at !== null
        ).length;


    const differences =
        stockTakingItems.filter(
            item =>
                Number(item.difference) !== 0
        ).length;


    const progress =
        total > 0
            ? Math.round(
                (counted / total) * 100
            )
            : 0;


    document.getElementById(
        "totalItems"
    ).textContent =
        total.toLocaleString();


    document.getElementById(
        "countedItems"
    ).textContent =
        counted.toLocaleString();


    document.getElementById(
        "differenceItems"
    ).textContent =
        differences.toLocaleString();


    document.getElementById(
        "countProgress"
    ).textContent =
        `${progress}%`;
}


// =====================================================
// ACTION BUTTONS
// =====================================================

function renderActionButtons() {

    const container =
        document.getElementById(
            "actionButtons"
        );


    let html = "";


    if (
        stockTaking.status ===
        "draft"
    ) {

        html += `
            <button
                id="btnStart"
                class="btn btn-primary">

                <i class="bi bi-play-circle me-1"></i>

                Start Stock Taking

            </button>
        `;


        html += `
            <button
                id="btnCancel"
                class="btn btn-outline-danger">

                <i class="bi bi-x-circle me-1"></i>

                Cancel

            </button>
        `;
    }


    if (
        stockTaking.status ===
        "in_progress"
    ) {

        html += `
            <button
                id="btnComplete"
                class="btn btn-success">

                <i class="bi bi-check-circle me-1"></i>

                Complete Stock Taking

            </button>
        `;


        html += `
            <button
                id="btnCancel"
                class="btn btn-outline-danger">

                <i class="bi bi-x-circle me-1"></i>

                Cancel

            </button>
        `;
    }


    container.innerHTML =
        html;


    const startButton =
        document.getElementById(
            "btnStart"
        );


    if (startButton) {

        startButton.addEventListener(
            "click",
            startStockTaking
        );
    }


    const completeButton =
        document.getElementById(
            "btnComplete"
        );


    if (completeButton) {

        completeButton.addEventListener(
            "click",
            showCompleteModal
        );
    }


    const cancelButton =
        document.getElementById(
            "btnCancel"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            showCancelModal
        );
    }
}


// =====================================================
// RENDER ITEMS
// =====================================================

function renderItems() {

    const table =
        document.getElementById(
            "itemsTable"
        );


    if (!filteredItems.length) {

        table.innerHTML = `
            <tr>

                <td
                    colspan="10"
                    class="text-center text-muted py-5">

                    No products found.

                </td>

            </tr>
        `;

        return;
    }


    const editable =
        stockTaking.status ===
        "in_progress";


    table.innerHTML =
        filteredItems.map(
            (item, index) => {

                const systemQuantity =
                    Number(
                        item.system_quantity
                    );


                const hasBeenCounted =
                    item.counted_quantity !== null &&
                    item.counted_quantity !== undefined;

                const countedQuantity =
                    hasBeenCounted
                    ? Number(item.counted_quantity)
                    : "";


                const difference =
                    countedQuantity -
                    systemQuantity;


                const differenceClass =
                    difference > 0
                        ? "text-success"
                        : difference < 0
                            ? "text-danger"
                            : "text-muted";


                const differenceSign =
                    difference > 0
                        ? "+"
                        : "";


                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>
                            <strong>
                                ${escapeHtml(
                                    item.product_code
                                )}
                            </strong>
                        </td>


                        <td>
                            ${escapeHtml(
                                item.product_name
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                item.unit || "-"
                            )}
                        </td>


                        <td class="text-end">

                            ${formatNumber(
                                systemQuantity
                            )}

                        </td>


                        <td>

                            ${
                                editable
                                    ? `
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            class="form-control counted-input"
                                            data-item-id="${item.id}"
                                            value="${countedQuantity}">
                                      `
                                    : `
                                        <span>
                                            ${formatNumber(
                                                countedQuantity
                                            )}
                                        </span>
                                      `
                            }

                        </td>


                        <td
                            class="text-end fw-semibold ${differenceClass}">

                            ${differenceSign}

                            ${formatNumber(
                                difference
                            )}

                        </td>


                        <td>

                            ${
                                editable
                                    ? `
                                        <input
                                            type="text"
                                            class="form-control notes-input"
                                            data-item-id="${item.id}"
                                            value="${escapeHtml(
                                                item.notes || ""
                                            )}"
                                            placeholder="Optional notes">
                                      `
                                    : `
                                        <span class="text-muted">
                                            ${
                                                escapeHtml(
                                                    item.notes || "-"
                                                )
                                            }
                                        </span>
                                      `
                            }

                        </td>


                        <td>

                            ${
                                item.counted_at
                                    ? `
                                        <span class="badge bg-success">

                                            <i class="bi bi-check-circle me-1"></i>

                                            Counted

                                        </span>
                                      `
                                    : `
                                        <span class="badge bg-secondary">

                                            Not Counted

                                        </span>
                                      `
                            }

                        </td>


                        <td class="text-end">

                            ${
                                editable
                                    ? `
                                        <button
                                            class="btn btn-sm btn-primary save-item-btn"
                                            data-item-id="${item.id}">

                                            <i class="bi bi-save"></i>

                                            Save

                                        </button>
                                      `
                                    : "-"
                            }

                        </td>

                    </tr>
                `;
            }
        ).join("");


    if (editable) {

        attachItemEvents();
    }
}


// =====================================================
// ATTACH ITEM EVENTS
// =====================================================

function attachItemEvents() {

    const saveButtons =
        document.querySelectorAll(
            ".save-item-btn"
        );


    saveButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const itemId =
                        Number(
                            button.dataset.itemId
                        );


                    saveItem(
                        itemId,
                        button
                    );

                }
            );

        }
    );


    const countedInputs =
        document.querySelectorAll(
            ".counted-input"
        );


    countedInputs.forEach(
        input => {

            input.addEventListener(
                "input",
                () => {

                    updateDifferencePreview(
                        input
                    );
                }
            );

        }
    );
}


// =====================================================
// DIFFERENCE PREVIEW
// =====================================================

function updateDifferencePreview(
    input
) {

    const itemId =
        Number(
            input.dataset.itemId
        );


    const item =
        stockTakingItems.find(
            currentItem =>
                Number(currentItem.id) ===
                itemId
        );


    if (!item) {
        return;
    }


    const counted =
        Number(input.value);


    const system =
        Number(item.system_quantity);


    const difference =
        (Number.isFinite(counted)
            ? counted
            : 0) - system;


    const row =
        input.closest("tr");


    const differenceCell =
        row.querySelector(
            "td:nth-child(7)"
        );


    if (!differenceCell) {
        return;
    }


    differenceCell.classList.remove(
        "text-success",
        "text-danger",
        "text-muted"
    );


    if (difference > 0) {

        differenceCell.classList.add(
            "text-success"
        );

    } else if (difference < 0) {

        differenceCell.classList.add(
            "text-danger"
        );

    } else {

        differenceCell.classList.add(
            "text-muted"
        );
    }


    differenceCell.textContent =
        `${difference > 0 ? "+" : ""}${formatNumber(
            difference
        )}`;
}


// =====================================================
// SAVE ITEM
// =====================================================

async function saveItem(
    itemId,
    button
) {

    const row =
        button.closest("tr");


    const countedInput =
        row.querySelector(
            `.counted-input[data-item-id="${itemId}"]`
        );


    const notesInput =
        row.querySelector(
            `.notes-input[data-item-id="${itemId}"]`
        );


    if (!countedInput) {
        return;
    }


    const countedQuantity =
        Number(
            countedInput.value
        );


    const notes =
        notesInput
            ? notesInput.value.trim()
            : "";


    if (
        !Number.isFinite(
            countedQuantity
        ) ||
        countedQuantity < 0
    ) {

        showPageMessage(
            "Please enter a valid counted quantity.",
            "danger"
        );

        countedInput.focus();

        return;
    }


    const originalText =
        button.innerHTML;


    button.disabled = true;

    button.innerHTML =
        `
        <span
            class="spinner-border spinner-border-sm">
        </span>
        `;


    try {

        const response =
            await fetch(
                `/stock-takings/items/${itemId}`,
                {
                    method: "PUT",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        counted_quantity:
                            countedQuantity,

                        notes
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to save count."
            );
        }


        const item =
            stockTakingItems.find(
                currentItem =>
                    Number(currentItem.id) ===
                    itemId
            );


        if (item) {

            item.counted_quantity =
                countedQuantity;

            item.difference =
                data.data.difference;

            item.notes =
                notes;

            item.counted_at =
                new Date().toISOString();
        }


        filteredItems =
            [...stockTakingItems];


        renderSummary();

        renderItems();


        showPageMessage(
            "Count saved successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Save item error:",
            error
        );


        showPageMessage(
            error.message,
            "danger"
        );


        button.disabled = false;

        button.innerHTML =
            originalText;
    }
}


// =====================================================
// START STOCK TAKING
// =====================================================

async function startStockTaking() {

    if (!stockTaking) {
        return;
    }


    if (
        !confirm(
            "Start this stock taking now?"
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                `/stock-takings/${stockTaking.id}/start`,
                {
                    method: "PUT",
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to start stock taking."
            );
        }


        showPageMessage(
            "Stock taking started successfully.",
            "success"
        );


        await loadStockTaking();


    } catch (error) {

        console.error(
            "Start stock taking error:",
            error
        );


        showPageMessage(
            error.message,
            "danger"
        );
    }
}


// =====================================================
// SHOW COMPLETE MODAL
// =====================================================

function showCompleteModal() {

    const notCounted =
        stockTakingItems.filter(
            item =>
                !item.counted_at
        ).length;


    if (notCounted > 0) {

        const proceed =
            confirm(
                `${notCounted} product(s) have not been counted. Are you sure you want to continue?`
            );


        if (!proceed) {
            return;
        }
    }


    if (!completeModal) {

        completeModal =
            new bootstrap.Modal(
                document.getElementById(
                    "completeModal"
                )
            );
    }


    completeModal.show();
}


// =====================================================
// COMPLETE STOCK TAKING
// =====================================================

async function completeStockTaking() {

    const button =
        document.getElementById(
            "btnConfirmComplete"
        );


    button.disabled = true;

    button.innerHTML =
        `
        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        Completing...
        `;


    try {

        const response =
            await fetch(
                `/stock-takings/${stockTaking.id}/complete`,
                {
                    method: "PUT",
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to complete stock taking."
            );
        }


        completeModal.hide();


        showPageMessage(
            "Stock taking completed successfully. Inventory quantities have been updated.",
            "success"
        );


        await loadStockTaking();


    } catch (error) {

        console.error(
            "Complete stock taking error:",
            error
        );


        showPageMessage(
            error.message,
            "danger"
        );


    } finally {

        button.disabled = false;

        button.innerHTML =
            `
            <i class="bi bi-check-circle me-1"></i>

            Complete Stock Taking
            `;
    }
}


// =====================================================
// SHOW CANCEL MODAL
// =====================================================

function showCancelModal() {

    if (!cancelModal) {

        cancelModal =
            new bootstrap.Modal(
                document.getElementById(
                    "cancelModal"
                )
            );
    }


    cancelModal.show();
}


// =====================================================
// CANCEL STOCK TAKING
// =====================================================

async function cancelStockTaking() {

    const button =
        document.getElementById(
            "btnConfirmCancel"
        );


    button.disabled = true;

    button.innerHTML =
        `
        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        Cancelling...
        `;


    try {

        const response =
            await fetch(
                `/stock-takings/${stockTaking.id}/cancel`,
                {
                    method: "PUT",
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to cancel stock taking."
            );
        }


        cancelModal.hide();


        showPageMessage(
            "Stock taking cancelled successfully.",
            "success"
        );


        await loadStockTaking();


    } catch (error) {

        console.error(
            "Cancel stock taking error:",
            error
        );


        showPageMessage(
            error.message,
            "danger"
        );


    } finally {

        button.disabled = false;

        button.innerHTML =
            "Yes, Cancel";
    }
}


// =====================================================
// SEARCH PRODUCTS
// =====================================================

function searchProducts() {

    const search =
        document.getElementById(
            "searchProduct"
        ).value
            .trim()
            .toLowerCase();


    if (!search) {

        filteredItems =
            [...stockTakingItems];

        renderItems();

        return;
    }


    filteredItems =
        stockTakingItems.filter(
            item => {

                return (

                    String(
                        item.product_code || ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        item.product_name || ""
                    )
                        .toLowerCase()
                        .includes(search)

                );
            }
        );


    renderItems();
}


// =====================================================
// PAGE MESSAGE
// =====================================================

function showPageMessage(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "pageMessage"
        );


    element.className =
        `alert alert-${type}`;


    element.textContent =
        message;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    setTimeout(
        () => {

            element.classList.add(
                "d-none"
            );

        },
        5000
    );
}


// =====================================================
// FORMAT NUMBER
// =====================================================

function formatNumber(
    value
) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {
        return "0";
    }


    return number.toLocaleString(
        "en-TZ",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


// =====================================================
// FORMAT DATE/TIME
// =====================================================

function formatDateTime(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleString(
        "en-TZ",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
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

    const id =
        getStockTakingId();


    if (!id) {

        showPageMessage(
            "No stock taking was selected.",
            "danger"
        );

        return;
    }


    const user =
        await loadCurrentUser();


    if (!user) {
        return;
    }


    await loadStockTaking();
}


// =====================================================
// EVENTS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        completeModal =
            new bootstrap.Modal(
                document.getElementById(
                    "completeModal"
                )
            );


        cancelModal =
            new bootstrap.Modal(
                document.getElementById(
                    "cancelModal"
                )
            );


        document
            .getElementById(
                "btnConfirmComplete"
            )
            .addEventListener(
                "click",
                completeStockTaking
            );


        document
            .getElementById(
                "btnConfirmCancel"
            )
            .addEventListener(
                "click",
                cancelStockTaking
            );


        document
            .getElementById(
                "searchProduct"
            )
            .addEventListener(
                "input",
                searchProducts
            );


        document
            .getElementById(
                "logoutButton"
            )
            .addEventListener(
                "click",
                logout
            );


        initialize();

    }
);