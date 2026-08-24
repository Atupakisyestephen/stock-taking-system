let stockOutModal;

let products = [];

let stockOutTransactions = [];


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const modalElement =
            document.getElementById(
                "stockOutModal"
            );


        stockOutModal =
            new bootstrap.Modal(
                modalElement
            );


        const newButton =
            document.getElementById(
                "btnNewStockOut"
            );


        if (newButton) {

            newButton.addEventListener(
                "click",
                openStockOutModal
            );

        }


        const saveButton =
            document.getElementById(
                "btnSaveStockOut"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                saveStockOut
            );

        }


        const productSelect =
            document.getElementById(
                "product_id"
            );


        if (productSelect) {

            productSelect.addEventListener(
                "change",
                updateAvailableStock
            );

        }


        const search =
            document.getElementById(
                "searchStockOut"
            );


        if (search) {

            search.addEventListener(
                "input",
                searchStockOut
            );

        }


        loadProducts();

        loadStockOutTransactions();

    }
);


// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts() {

    try {

        const response =
            await fetch(
                "/stock-out/products",
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


        populateProducts();


    } catch (error) {

        console.error(
            "Load products error:",
            error
        );

    }

}


// ======================================================
// POPULATE PRODUCT SELECT
// ======================================================

function populateProducts() {

    const select =
        document.getElementById(
            "product_id"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `
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
                `${product.product_code} - ${product.product_name} (${Number(product.quantity).toLocaleString()} ${product.unit})`;


            select.appendChild(
                option
            );

        }
    );

}


// ======================================================
// UPDATE AVAILABLE STOCK
// ======================================================

function updateAvailableStock() {

    const productId =
        Number(
            document.getElementById(
                "product_id"
            ).value
        );


    const display =
        document.getElementById(
            "availableStock"
        );


    const product =
        products.find(
            item =>
                Number(item.id) ===
                productId
        );


    if (!product) {

        display.textContent =
            "Select a product to see available stock.";

        return;

    }


    display.innerHTML =
        `
        <strong>
            Available stock:
        </strong>
        ${Number(product.quantity).toLocaleString()}
        ${product.unit}
        `;

}


// ======================================================
// OPEN MODAL
// ======================================================

function openStockOutModal() {

    const form =
        document.getElementById(
            "stockOutForm"
        );


    if (form) {

        form.reset();

    }


    const message =
        document.getElementById(
            "stockOutMessage"
        );


    if (message) {

        message.innerHTML =
            "";

    }


    const availableStock =
        document.getElementById(
            "availableStock"
        );


    if (availableStock) {

        availableStock.textContent =
            "Select a product to see available stock.";

    }


    stockOutModal.show();

}


// ======================================================
// SAVE STOCK OUT
// ======================================================

async function saveStockOut() {

    const productId =
        document.getElementById(
            "product_id"
        ).value;


    const quantity =
        document.getElementById(
            "quantity"
        ).value;


    const referenceNumber =
        document.getElementById(
            "reference_number"
        ).value.trim();


    const reason =
        document.getElementById(
            "reason"
        ).value;


    const notes =
        document.getElementById(
            "notes"
        ).value.trim();


    const message =
        document.getElementById(
            "stockOutMessage"
        );


    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!productId) {

        showMessage(
            message,
            "Please select a product.",
            "danger"
        );

        return;

    }


    const quantityNumber =
        Number(quantity);


    if (
        !Number.isFinite(quantityNumber) ||
        quantityNumber <= 0
    ) {

        showMessage(
            message,
            "Please enter a valid quantity.",
            "danger"
        );

        return;

    }


    const product =
        products.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );


    if (!product) {

        showMessage(
            message,
            "Selected product was not found.",
            "danger"
        );

        return;

    }


    const available =
        Number(product.quantity);


    if (quantityNumber > available) {

        showMessage(
            message,
            `Insufficient stock. Only ${available} ${product.unit} available.`,
            "danger"
        );

        return;

    }


    // ------------------------------------------
    // DISABLE BUTTON
    // ------------------------------------------

    const saveButton =
        document.getElementById(
            "btnSaveStockOut"
        );


    saveButton.disabled =
        true;


    saveButton.innerHTML =
        `
        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        Saving...
        `;


    try {

        const response =
            await fetch(
                "/stock-out",
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            product_id:
                                productId,

                            quantity:
                                quantityNumber,

                            reference_number:
                                referenceNumber,

                            reason:
                                reason,

                            notes:
                                notes

                        })

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
                "Failed to record stock out."
            );

        }


        showMessage(
            message,
            data.message,
            "success"
        );


        await loadProducts();

        await loadStockOutTransactions();


        setTimeout(
            () => {

                stockOutModal.hide();

            },
            800
        );


    } catch (error) {

        console.error(
            "Save stock out error:",
            error
        );


        showMessage(
            message,
            error.message ||
                "Failed to record stock out.",
            "danger"
        );


    } finally {

        saveButton.disabled =
            false;


        saveButton.innerHTML =
            `
            <i class="bi bi-check-circle me-1"></i>

            Record Stock Out
            `;

    }

}


// ======================================================
// LOAD TRANSACTIONS
// ======================================================

async function loadStockOutTransactions() {

    try {

        const response =
            await fetch(
                "/stock-out",
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
                "Failed to load stock out transactions."
            );

        }


        stockOutTransactions =
            data.data || [];


        renderStockOutTransactions(
            stockOutTransactions
        );


        updateSummary(
            stockOutTransactions
        );


    } catch (error) {

        console.error(
            "Load stock out transactions error:",
            error
        );

    }

}


// ======================================================
// RENDER TRANSACTIONS
// ======================================================

function renderStockOutTransactions(
    transactions
) {

    const table =
        document.getElementById(
            "stockOutTable"
        );


    if (!table) {
        return;
    }


    if (!transactions.length) {

        table.innerHTML =
            `
            <tr>

                <td
                    colspan="8"
                    class="text-center text-muted py-4">

                    No stock out transactions yet.

                </td>

            </tr>
            `;

        return;

    }


    table.innerHTML =
        transactions.map(
            transaction => {

                const date =
                    transaction.transaction_date
                        ? new Date(
                            transaction.transaction_date
                        ).toLocaleString(
                            "en-TZ",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )
                        : "-";


                return `
                <tr>

                    <td>
                        ${escapeHtml(
                            transaction.reference_number ||
                            "-"
                        )}
                    </td>

                    <td>

                        <strong>
                            ${escapeHtml(
                                transaction.product_name
                            )}
                        </strong>

                        <br>

                        <small class="text-muted">

                            ${escapeHtml(
                                transaction.product_code
                            )}

                        </small>

                    </td>

                    <td>

                        <span class="badge text-bg-warning">

                            -
                            ${Number(
                                transaction.quantity
                            ).toLocaleString()}

                            ${escapeHtml(
                                transaction.unit
                            )}

                        </span>

                    </td>

                    <td>
                        ${Number(
                            transaction.previous_quantity
                        ).toLocaleString()}
                    </td>

                    <td>

                        <strong>
                            ${Number(
                                transaction.new_quantity
                            ).toLocaleString()}
                        </strong>

                    </td>

                    <td>
                        ${escapeHtml(
                            transaction.reason ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${date}
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


// ======================================================
// SUMMARY
// ======================================================

function updateSummary(
    transactions
) {

    const totalTransactions =
        document.getElementById(
            "totalTransactions"
        );


    const totalItemsIssued =
        document.getElementById(
            "totalItemsIssued"
        );


    const totalProducts =
        document.getElementById(
            "totalProducts"
        );


    const totalQuantity =
        transactions.reduce(
            (
                total,
                transaction
            ) => {

                return total +
                    Number(
                        transaction.quantity
                    );

            },
            0
        );


    const uniqueProducts =
        new Set(
            transactions.map(
                transaction =>
                    transaction.product_id
            )
        );


    if (totalTransactions) {

        totalTransactions.textContent =
            transactions.length
                .toLocaleString();

    }


    if (totalItemsIssued) {

        totalItemsIssued.textContent =
            totalQuantity.toLocaleString();

    }


    if (totalProducts) {

        totalProducts.textContent =
            uniqueProducts.size
                .toLocaleString();

    }

}


// ======================================================
// SEARCH
// ======================================================

function searchStockOut(event) {

    const search =
        event.target.value
            .trim()
            .toLowerCase();


    if (!search) {

        renderStockOutTransactions(
            stockOutTransactions
        );

        return;

    }


    const filtered =
        stockOutTransactions.filter(
            transaction => {

                return (

                    String(
                        transaction.reference_number ||
                        ""
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        transaction.product_name ||
                        ""
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        transaction.product_code ||
                        ""
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        transaction.reason ||
                        ""
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        transaction.user_name ||
                        ""
                    )
                    .toLowerCase()
                    .includes(search)

                );

            }
        );


    renderStockOutTransactions(
        filtered
    );

}


// ======================================================
// MESSAGE
// ======================================================

function showMessage(
    element,
    message,
    type
) {

    if (!element) {
        return;
    }


    element.innerHTML =
        `
        <div
            class="alert alert-${type}"
            role="alert">

            ${escapeHtml(message)}

        </div>
        `;

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;

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

displayCopyrightYear();