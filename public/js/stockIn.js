let products = [];

let stockInTransactions = [];

let stockInModal;


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeModal();

        setupEvents();

        displayCopyrightYear();

        await loadProducts();

        await loadStockInTransactions();

    }
);


// ========================================
// INITIALIZE BOOTSTRAP MODAL
// ========================================

function initializeModal() {

    const modalElement =
        document.getElementById(
            "stockInModal"
        );


    if (!modalElement) {

        console.error(
            "Stock In modal not found."
        );

        return;

    }


    stockInModal =
        new bootstrap.Modal(
            modalElement
        );

}


// ========================================
// SETUP EVENTS
// ========================================

function setupEvents() {

    // ------------------------------------
    // NEW STOCK IN BUTTON
    // ------------------------------------

    const newButton =
        document.getElementById(
            "btnNewStockIn"
        );


    if (newButton) {

        newButton.addEventListener(
            "click",
            openStockInModal
        );

    }


    // ------------------------------------
    // PRODUCT CHANGE
    // ------------------------------------

    const productSelect =
        document.getElementById(
            "productId"
        );


    if (productSelect) {

        productSelect.addEventListener(
            "change",
            updateProductInformation
        );

    }


    // ------------------------------------
    // QUANTITY INPUT
    // ------------------------------------

    const quantityInput =
        document.getElementById(
            "quantity"
        );


    if (quantityInput) {

        quantityInput.addEventListener(
            "input",
            updateStockPreview
        );

    }


    // ------------------------------------
    // FORM SUBMIT
    // ------------------------------------

    const form =
        document.getElementById(
            "stockInForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            saveStockIn
        );

    }


    // ------------------------------------
    // SAVE BUTTON
    // ------------------------------------

    const saveButton =
        document.getElementById(
            "btnSaveStockIn"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            () => {

                const form =
                    document.getElementById(
                        "stockInForm"
                    );


                if (form) {

                    if (
                        typeof form.requestSubmit ===
                        "function"
                    ) {

                        form.requestSubmit();

                    } else {

                        saveStockIn(
                            new Event("submit")
                        );

                    }

                }

            }
        );

    }


    // ------------------------------------
    // SEARCH
    // ------------------------------------

    const searchInput =
        document.getElementById(
            "searchStockIn"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            searchStockIn
        );

    }


    // ------------------------------------
    // MODAL RESET
    // ------------------------------------

    const modalElement =
        document.getElementById(
            "stockInModal"
        );


    if (modalElement) {

        modalElement.addEventListener(
            "hidden.bs.modal",
            resetStockForm
        );

    }

}


// ========================================
// OPEN STOCK IN MODAL
// ========================================

function openStockInModal() {

    resetStockForm();


    clearStockInMessage();


    if (stockInModal) {

        stockInModal.show();

    }

}


// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

    try {

        const response =
            await fetch(
                "/stock-in/products",
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
                "Failed to load products."
            );

        }


        products =
            data.data || [];


        populateProductSelect();


    } catch (error) {

        console.error(
            "Load Stock In products error:",
            error
        );


        showPageMessage(
            error.message ||
            "Failed to load products.",
            "danger"
        );

    }

}


// ========================================
// POPULATE PRODUCT SELECT
// ========================================

function populateProductSelect() {

    const select =
        document.getElementById(
            "productId"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Select Product
        </option>

    `;


    products.forEach(
        product => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                product.id;


            option.textContent =
                `${product.product_code} - ${product.product_name}`;


            select.appendChild(
                option
            );

        }
    );

}


// ========================================
// PRODUCT INFORMATION
// ========================================

function updateProductInformation() {

    const productId =
        Number(
            document.getElementById(
                "productId"
            ).value
        );


    const product =
        products.find(
            item =>
                Number(item.id) ===
                productId
        );


    const currentQuantity =
        document.getElementById(
            "currentQuantity"
        );


    const currentUnit =
        document.getElementById(
            "currentUnit"
        );


    const currentStockText =
        document.getElementById(
            "currentStock"
        );


    if (!product) {

        if (currentQuantity) {

            currentQuantity.value =
                "0";

        }


        if (currentUnit) {

            currentUnit.textContent =
                "-";

        }


        if (currentStockText) {

            currentStockText.textContent =
                "Select a product to see current stock.";

        }


        updateStockPreview();

        return;

    }


    const quantity =
        Number(
            product.quantity
        );


    if (currentQuantity) {

        currentQuantity.value =
            quantity.toLocaleString();

    }


    if (currentUnit) {

        currentUnit.textContent =
            product.unit || "-";

    }


    if (currentStockText) {

        currentStockText.textContent =
            `Current stock: ${quantity.toLocaleString()} ${product.unit || "units"}`;

    }


    updateStockPreview();

}


// ========================================
// STOCK PREVIEW
// ========================================

function updateStockPreview() {

    const productId =
        Number(
            document.getElementById(
                "productId"
            ).value
        );


    const quantity =
        Number(
            document.getElementById(
                "quantity"
            ).value
        );


    const product =
        products.find(
            item =>
                Number(item.id) ===
                productId
        );


    const preview =
        document.getElementById(
            "stockPreview"
        );


    const newQuantity =
        document.getElementById(
            "newQuantity"
        );


    const newUnit =
        document.getElementById(
            "newUnit"
        );


    if (!preview) {

        return;

    }


    if (
        !product ||
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {

        preview.classList.add(
            "d-none"
        );

        return;

    }


    const current =
        Number(
            product.quantity
        );


    const newStock =
        current + quantity;


    if (newQuantity) {

        newQuantity.textContent =
            newStock.toLocaleString();

    }


    if (newUnit) {

        newUnit.textContent =
            product.unit || "units";

    }


    preview.classList.remove(
        "d-none"
    );

}


// ========================================
// SAVE STOCK IN
// ========================================

async function saveStockIn(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "btnSaveStockIn"
        );


    const productId =
        Number(
            document.getElementById(
                "productId"
            ).value
        );


    const quantity =
        Number(
            document.getElementById(
                "quantity"
            ).value
        );


    const referenceNumber =
        document.getElementById(
            "referenceNumber"
        )?.value.trim();


    const reason =
        document.getElementById(
            "reason"
        )?.value.trim();


    const notes =
        document.getElementById(
            "notes"
        )?.value.trim();


    // ========================================
    // VALIDATE PRODUCT
    // ========================================

    if (
        !Number.isInteger(productId) ||
        productId <= 0
    ) {

        showModalMessage(
            "Please select a product.",
            "danger"
        );

        return;

    }


    // ========================================
    // VALIDATE QUANTITY
    // ========================================

    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {

        showModalMessage(
            "Please enter a quantity greater than zero.",
            "danger"
        );

        return;

    }


    // ========================================
    // DISABLE BUTTON
    // ========================================

    if (button) {

        button.disabled = true;


        button.innerHTML = `

            <span
                class="spinner-border spinner-border-sm me-1"
            ></span>

            Recording...

        `;

    }


    try {

        const response =
            await fetch(
                "/stock-in",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify({

                            product_id:
                                productId,

                            quantity:
                                quantity,

                            reference_number:
                                referenceNumber ||
                                null,

                            reason:
                                notes
                                    ? `${reason || ""}${reason && notes ? " - " : ""}${notes}`
                                    : reason || null

                        })

                }
            );


        const data =
            await response.json();


        // ========================================
        // CHECK RESPONSE
        // ========================================

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to record Stock In."
            );

        }


        // ========================================
        // SUCCESS MESSAGE
        // ========================================

        showPageMessage(
            data.message ||
            "Stock In recorded successfully.",
            "success"
        );


        // ========================================
        // CLOSE MODAL
        // ========================================

        if (stockInModal) {

            stockInModal.hide();

        }


        // ========================================
        // RESET FORM
        // ========================================

        resetStockForm();


        // ========================================
        // REFRESH DATA
        // ========================================

        await loadProducts();

        await loadStockInTransactions();


    } catch (error) {

        console.error(
            "Save Stock In error:",
            error
        );


        showModalMessage(
            error.message ||
            "Failed to record Stock In.",
            "danger"
        );


    } finally {

        if (button) {

            button.disabled = false;


            button.innerHTML = `

                <i
                    class="bi bi-check-circle me-1"
                ></i>

                Record Stock In

            `;

        }

    }

}


// ========================================
// LOAD STOCK IN TRANSACTIONS
// ========================================

async function loadStockInTransactions() {

    try {

        const response =
            await fetch(
                "/stock-in",
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
                "Failed to load Stock In history."
            );

        }


        stockInTransactions =
            data.data || [];


        updateSummaryCards(
            stockInTransactions
        );


        renderStockInTable(
            stockInTransactions
        );


    } catch (error) {

        console.error(
            "Load Stock In transactions error:",
            error
        );


        renderStockInError(
            error.message ||
            "Failed to load Stock In history."
        );

    }

}


// ========================================
// UPDATE SUMMARY CARDS
// ========================================

function updateSummaryCards(
    transactions
) {

    const totalTransactions =
        document.getElementById(
            "totalTransactions"
        );


    const totalItemsReceived =
        document.getElementById(
            "totalItemsReceived"
        );


    const totalProducts =
        document.getElementById(
            "totalProducts"
        );


    // ----------------------------------------
    // TOTAL TRANSACTIONS
    // ----------------------------------------

    if (totalTransactions) {

        totalTransactions.textContent =
            transactions.length.toLocaleString();

    }


    // ----------------------------------------
    // TOTAL ITEMS RECEIVED
    // ----------------------------------------

    const totalQuantity =
        transactions.reduce(
            (
                total,
                transaction
            ) => {

                return total +
                    Number(
                        transaction.quantity || 0
                    );

            },
            0
        );


    if (totalItemsReceived) {

        totalItemsReceived.textContent =
            totalQuantity.toLocaleString();

    }


    // ----------------------------------------
    // UNIQUE PRODUCTS
    // ----------------------------------------

    const uniqueProducts =
        new Set(
            transactions.map(
                transaction =>
                    transaction.product_id
            )
        );


    if (totalProducts) {

        totalProducts.textContent =
            uniqueProducts.size.toLocaleString();

    }

}


// ========================================
// RENDER STOCK IN TABLE
// ========================================

function renderStockInTable(
    transactions
) {

    const table =
        document.getElementById(
            "stockInTable"
        );


    if (!table) {

        return;

    }


    if (
        !transactions ||
        transactions.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="text-center text-muted py-4">

                    <i
                        class="bi bi-inbox fs-3 d-block mb-2">
                    </i>

                    No Stock In transactions found.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        transactions.map(
            transaction => {

                const quantity =
                    Number(
                        transaction.quantity || 0
                    );


                const previousQuantity =
                    Number(
                        transaction.previous_quantity || 0
                    );


                const newQuantity =
                    Number(
                        transaction.new_quantity || 0
                    );


                const transactionDate =
                    formatDate(
                        transaction.transaction_date
                    );


                return `

                    <tr>

                        <td>

                            ${escapeHtml(
                                transaction.reference_number ||
                                "-"
                            )}

                        </td>


                        <td>

                            <div class="fw-semibold">

                                ${escapeHtml(
                                    transaction.product_name ||
                                    "-"
                                )}

                            </div>


                            <small class="text-muted">

                                ${escapeHtml(
                                    transaction.product_code ||
                                    ""
                                )}

                            </small>

                        </td>


                        <td>

                            <span
                                class="badge bg-success-subtle text-success">

                                +${quantity.toLocaleString()}

                                ${escapeHtml(
                                    transaction.unit ||
                                    ""
                                )}

                            </span>

                        </td>


                        <td>

                            ${previousQuantity.toLocaleString()}

                            ${escapeHtml(
                                transaction.unit ||
                                ""
                            )}

                        </td>


                        <td>

                            <strong>

                                ${newQuantity.toLocaleString()}

                            </strong>

                            ${escapeHtml(
                                transaction.unit ||
                                ""
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                transaction.reason ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${transactionDate}

                        </td>


                        <td>

                            ${escapeHtml(
                                transaction.user_name ||
                                "-"
                            )}

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


// ========================================
// SEARCH STOCK IN
// ========================================

function searchStockIn(event) {

    const searchTerm =
        event.target.value
            .trim()
            .toLowerCase();


    if (!searchTerm) {

        renderStockInTable(
            stockInTransactions
        );

        return;

    }


    const filtered =
        stockInTransactions.filter(
            transaction => {

                const reference =
                    String(
                        transaction.reference_number ||
                        ""
                    ).toLowerCase();


                const productCode =
                    String(
                        transaction.product_code ||
                        ""
                    ).toLowerCase();


                const productName =
                    String(
                        transaction.product_name ||
                        ""
                    ).toLowerCase();


                const reason =
                    String(
                        transaction.reason ||
                        ""
                    ).toLowerCase();


                const user =
                    String(
                        transaction.user_name ||
                        ""
                    ).toLowerCase();


                return (
                    reference.includes(searchTerm) ||
                    productCode.includes(searchTerm) ||
                    productName.includes(searchTerm) ||
                    reason.includes(searchTerm) ||
                    user.includes(searchTerm)
                );

            }
        );


    renderStockInTable(
        filtered
    );

}


// ========================================
// RESET FORM
// ========================================

function resetStockForm() {

    const form =
        document.getElementById(
            "stockInForm"
        );


    if (form) {

        form.reset();

    }


    const currentQuantity =
        document.getElementById(
            "currentQuantity"
        );


    const currentUnit =
        document.getElementById(
            "currentUnit"
        );


    const currentStockText =
        document.getElementById(
            "currentStock"
        );


    const preview =
        document.getElementById(
            "stockPreview"
        );


    if (currentQuantity) {

        currentQuantity.value =
            "0";

    }


    if (currentUnit) {

        currentUnit.textContent =
            "-";

    }


    if (currentStockText) {

        currentStockText.textContent =
            "Select a product to see current stock.";

    }


    if (preview) {

        preview.classList.add(
            "d-none"
        );

    }


    clearStockInMessage();

}


// ========================================
// PAGE MESSAGE
// ========================================

function showPageMessage(
    text,
    type = "success"
) {

    const message =
        document.getElementById(
            "message"
        );


    if (!message) {

        return;

    }


    message.innerHTML = `

        <div
            class="alert alert-${type} alert-dismissible fade show"
            role="alert">

            ${escapeHtml(text)}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>

        </div>

    `;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ========================================
// MODAL MESSAGE
// ========================================

function showModalMessage(
    text,
    type = "danger"
) {

    const message =
        document.getElementById(
            "stockInMessage"
        );


    if (!message) {

        return;

    }


    message.innerHTML = `

        <div
            class="alert alert-${type} alert-dismissible fade show"
            role="alert">

            ${escapeHtml(text)}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>

        </div>

    `;

}


// ========================================
// CLEAR MODAL MESSAGE
// ========================================

function clearStockInMessage() {

    const message =
        document.getElementById(
            "stockInMessage"
        );


    if (message) {

        message.innerHTML =
            "";

    }

}


// ========================================
// RENDER TABLE ERROR
// ========================================

function renderStockInError(
    message
) {

    const table =
        document.getElementById(
            "stockInTable"
        );


    if (!table) {

        return;

    }


    table.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="text-center text-danger py-4">

                <i
                    class="bi bi-exclamation-triangle me-1">
                </i>

                ${escapeHtml(message)}

            </td>

        </tr>

    `;

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {

        return escapeHtml(
            String(value)
        );

    }


    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
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