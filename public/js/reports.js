// =====================================================
// GLOBAL VARIABLES
// =====================================================

let currentReportData = [];

let currentReportType =
    "stock-movements";


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeReports
);


// =====================================================
// INITIALIZE
// =====================================================

async function initializeReports() {

    await loadCurrentUser();

    displayCurrentDate();

    displayCopyrightYear();

    setDefaultDates();

    setupEventListeners();

    await Promise.all([
        loadProducts(),
        loadCategories(),
        loadSuppliers()
    ]);

    updateFilterVisibility();

    await loadSummary();

    await generateReport();

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


        if (
            !data.success ||
            !data.user
        ) {

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


        const userRole =
            document.getElementById(
                "userRole"
            );


        if (userName) {

            userName.textContent =
                user.full_name;

        }


        if (userRole) {

            userRole.textContent =
                user.role.charAt(0).toUpperCase() +
                user.role.slice(1);

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
// CURRENT DATE
// =====================================================

function displayCurrentDate() {

    const element =
        document.getElementById(
            "currentDate"
        );


    if (!element) {
        return;
    }


    element.textContent =
        new Date().toLocaleDateString(
            "en-TZ",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


// =====================================================
// COPYRIGHT
// =====================================================

function displayCopyrightYear() {

    const element =
        document.getElementById(
            "copyrightYear"
        );


    if (!element) {
        return;
    }


    element.textContent =
        new Date().getFullYear();

}


// =====================================================
// DEFAULT DATES
// =====================================================

function setDefaultDates() {

    const today =
        new Date();


    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    const date =
        `${year}-${month}-${day}`;


    const fromDate =
        document.getElementById(
            "fromDate"
        );


    const toDate =
        document.getElementById(
            "toDate"
        );


    if (fromDate) {

        fromDate.value =
            date;

    }


    if (toDate) {

        toDate.value =
            date;

    }

}


// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {

    const reportType =
        document.getElementById(
            "reportType"
        );


    if (reportType) {

        reportType.addEventListener(
            "change",
            async () => {

                updateFilterVisibility();

            }
        );

    }


    const generateButton =
        document.getElementById(
            "generateReport"
        );


    if (generateButton) {

        generateButton.addEventListener(
            "click",
            generateReport
        );

    }


    const resetButton =
        document.getElementById(
            "resetFilters"
        );


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetFilters
        );

    }


    const printButton =
        document.getElementById(
            "printReport"
        );


    if (printButton) {

        printButton.addEventListener(
            "click",
            printReport
        );

    }


    const exportButton =
        document.getElementById(
            "exportReport"
        );


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportCSV
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


    const mobileLogoutButton =
        document.getElementById(
            "mobileLogoutButton"
        );


    if (mobileLogoutButton) {

        mobileLogoutButton.addEventListener(
            "click",
            logout
        );

    }

}


// =====================================================
// UPDATE FILTER VISIBILITY
// =====================================================

function updateFilterVisibility() {

    currentReportType =
        document.getElementById(
            "reportType"
        ).value;


    const movementFilters =
        document.getElementById(
            "movementFilters"
        );


    const stockTakingFilters =
        document.getElementById(
            "stockTakingFilters"
        );


    const varianceFilters =
        document.getElementById(
            "varianceFilters"
        );


    const productFilters =
        document.getElementById(
            "productFilters"
        );


    movementFilters.classList.add(
        "d-none"
    );

    stockTakingFilters.classList.add(
        "d-none"
    );

    varianceFilters.classList.add(
        "d-none"
    );

    productFilters.classList.add(
        "d-none"
    );


    if (
        currentReportType ===
        "stock-movements"
    ) {

        movementFilters.classList.remove(
            "d-none"
        );

    }


    if (
        currentReportType ===
        "stock-taking"
    ) {

        stockTakingFilters.classList.remove(
            "d-none"
        );

    }


    if (
        currentReportType ===
        "stock-variance"
    ) {

        varianceFilters.classList.remove(
            "d-none"
        );

    }


    if (
        currentReportType ===
        "products"
    ) {

        productFilters.classList.remove(
            "d-none"
        );

    }

}


// =====================================================
// LOAD SUMMARY
// =====================================================

async function loadSummary() {

    try {

        const response =
            await fetch(
                "/reports/summary",
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
                data.message
            );

        }


        const summary =
            data.data;


        setText(
            "totalProducts",
            formatNumber(
                summary.totalProducts
            )
        );


        setText(
            "totalStock",
            formatNumber(
                summary.totalStock
            )
        );


        setText(
            "lowStock",
            formatNumber(
                summary.lowStock
            )
        );


        setText(
            "outOfStock",
            formatNumber(
                summary.outOfStock
            )
        );


    } catch (error) {

        console.error(
            "Summary error:",
            error
        );

    }

}


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    try {

        const response =
            await fetch(
                "/reports/filters/products",
                {
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!data.success) {
            return;
        }


        const select =
            document.getElementById(
                "productFilter"
            );


        data.data.forEach(
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

    } catch (error) {

        console.error(
            "Products filter error:",
            error
        );

    }

}


// =====================================================
// LOAD CATEGORIES
// =====================================================

async function loadCategories() {

    try {

        const response =
            await fetch(
                "/reports/filters/categories",
                {
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!data.success) {
            return;
        }


        const select =
            document.getElementById(
                "categoryFilter"
            );


        data.data.forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    category.id;

                option.textContent =
                    category.name;

                select.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Categories filter error:",
            error
        );

    }

}


// =====================================================
// LOAD SUPPLIERS
// =====================================================

async function loadSuppliers() {

    try {

        const response =
            await fetch(
                "/reports/filters/suppliers",
                {
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!data.success) {
            return;
        }


        const select =
            document.getElementById(
                "supplierFilter"
            );


        data.data.forEach(
            supplier => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    supplier.id;

                option.textContent =
                    supplier.name;

                select.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Suppliers filter error:",
            error
        );

    }

}


// =====================================================
// GENERATE REPORT
// =====================================================

async function generateReport() {

    showLoading(true);

    hideMessage();


    try {

        const params =
            new URLSearchParams();


        const from =
            document.getElementById(
                "fromDate"
            ).value;


        const to =
            document.getElementById(
                "toDate"
            ).value;


        if (from) {

            params.append(
                "from",
                from
            );

        }


        if (to) {

            params.append(
                "to",
                to
            );

        }


        let endpoint = "";


        switch (currentReportType) {


            case "stock-movements":

                endpoint =
                    "/reports/stock-movements";


                const transactionType =
                    document.getElementById(
                        "transactionType"
                    ).value;


                const productFilter =
                    document.getElementById(
                        "productFilter"
                    ).value;


                if (transactionType) {

                    params.append(
                        "type",
                        transactionType
                    );

                }


                if (productFilter) {

                    params.append(
                        "product_id",
                        productFilter
                    );

                }


                break;



            case "stock-taking":

                endpoint =
                    "/reports/stock-taking";


                const stockTakingStatus =
                    document.getElementById(
                        "stockTakingStatus"
                    ).value;


                if (stockTakingStatus) {

                    params.append(
                        "status",
                        stockTakingStatus
                    );

                }


                break;



            case "stock-variance":

                endpoint =
                    "/reports/stock-variance";


                const varianceType =
                    document.getElementById(
                        "varianceType"
                    ).value;


                if (varianceType) {

                    params.append(
                        "variance",
                        varianceType
                    );

                }


                break;



            case "products":

                endpoint =
                    "/reports/products";


                const category =
                    document.getElementById(
                        "categoryFilter"
                    ).value;


                const supplier =
                    document.getElementById(
                        "supplierFilter"
                    ).value;


                if (category) {

                    params.append(
                        "category_id",
                        category
                    );

                }


                if (supplier) {

                    params.append(
                        "supplier_id",
                        supplier
                    );

                }


                break;



            case "low-stock":

                endpoint =
                    "/reports/low-stock";

                break;



            case "audit-logs":

                endpoint =
                    "/reports/audit-logs";

                break;


            default:

                throw new Error(
                    "Invalid report type."
                );

        }


        const response =
            await fetch(
                `${endpoint}?${params.toString()}`,
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
                "Failed to generate report."
            );

        }


        currentReportData =
            data.data || [];


        renderReport(
            currentReportData
        );


    } catch (error) {

        console.error(
            "Generate report error:",
            error
        );


        showMessage(
            error.message ||
            "Failed to generate report."
        );

    } finally {

        showLoading(false);

    }

}


// =====================================================
// RENDER REPORT
// =====================================================

function renderReport(rows) {

    const head =
        document.getElementById(
            "reportTableHead"
        );


    const body =
        document.getElementById(
            "reportTableBody"
        );


    const title =
        document.getElementById(
            "reportTitle"
        );


    const count =
        document.getElementById(
            "reportCount"
        );


    head.innerHTML = "";

    body.innerHTML = "";


    title.textContent =
        getReportTitle();


    count.textContent =
        `${rows.length} record${rows.length === 1 ? "" : "s"}`;


    if (!rows.length) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="20"
                    class="text-center text-muted py-5">

                    <i
                        class="bi bi-inbox fs-2 d-block mb-2">
                    </i>

                    No records found.

                </td>

            </tr>

        `;

        return;

    }


    switch (currentReportType) {

        case "stock-movements":

            renderStockMovements(
                rows,
                head,
                body
            );

            break;


        case "stock-taking":

            renderStockTaking(
                rows,
                head,
                body
            );

            break;


        case "stock-variance":

            renderStockVariance(
                rows,
                head,
                body
            );

            break;


        case "products":

            renderProducts(
                rows,
                head,
                body
            );

            break;


        case "low-stock":

            renderLowStock(
                rows,
                head,
                body
            );

            break;


        case "audit-logs":

            renderAuditLogs(
                rows,
                head,
                body
            );

            break;

    }

}


// =====================================================
// STOCK MOVEMENTS TABLE
// =====================================================

function renderStockMovements(
    rows,
    head,
    body
) {

    head.innerHTML = `

        <tr>

            <th>Code</th>
            <th>Product</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Previous</th>
            <th>New Stock</th>
            <th>Reference</th>
            <th>User</th>
            <th>Date</th>

        </tr>

    `;


    rows.forEach(
        row => {

            const typeBadge =
                getTransactionBadge(
                    row.transaction_type
                );


            body.innerHTML += `

                <tr>

                    <td>
                        ${escapeHTML(
                            row.product_code
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.product_name
                        )}
                    </td>

                    <td>
                        ${typeBadge}
                    </td>

                    <td>
                        ${formatNumber(
                            row.quantity
                        )}
                        ${escapeHTML(
                            row.unit || ""
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.previous_quantity
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.new_quantity
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.reference_number ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.user_name ||
                            "System"
                        )}
                    </td>

                    <td>
                        ${formatDateTime(
                            row.transaction_date
                        )}
                    </td>

                </tr>

            `;

        }
    );

}


// =====================================================
// STOCK TAKING TABLE
// =====================================================

function renderStockTaking(
    rows,
    head,
    body
) {

    head.innerHTML = `

        <tr>

            <th>Reference</th>
            <th>Title</th>
            <th>Status</th>
            <th>Product</th>
            <th>System Qty</th>
            <th>Counted Qty</th>
            <th>Difference</th>
            <th>Notes</th>
            <th>Counted At</th>
            <th>Created By</th>

        </tr>

    `;


    rows.forEach(
        row => {

            body.innerHTML += `

                <tr>

                    <td>
                        ${escapeHTML(
                            row.reference_number
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.title
                        )}
                    </td>

                    <td>
                        ${getStatusBadge(
                            row.status
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                row.product_code
                            )}
                        </strong>

                        <br>

                        <small class="text-muted">
                            ${escapeHTML(
                                row.product_name
                            )}
                        </small>
                    </td>

                    <td>
                        ${formatNumber(
                            row.system_quantity
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.counted_quantity
                        )}
                    </td>

                    <td>
                        ${getDifferenceHTML(
                            row.difference
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.notes ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${formatDateTime(
                            row.counted_at
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.created_by ||
                            "System"
                        )}
                    </td>

                </tr>

            `;

        }
    );

}


// =====================================================
// VARIANCE TABLE
// =====================================================

function renderStockVariance(
    rows,
    head,
    body
) {

    head.innerHTML = `

        <tr>

            <th>Reference</th>
            <th>Product</th>
            <th>System Qty</th>
            <th>Counted Qty</th>
            <th>Difference</th>
            <th>Variance</th>
            <th>Status</th>
            <th>Date</th>

        </tr>

    `;


    rows.forEach(
        row => {

            let varianceBadge =
                "";


            if (
                row.variance_type ===
                "Shortage"
            ) {

                varianceBadge =
                    `<span class="badge text-bg-danger">
                        Shortage
                    </span>`;

            } else if (
                row.variance_type ===
                "Excess"
            ) {

                varianceBadge =
                    `<span class="badge text-bg-warning">
                        Excess
                    </span>`;

            } else {

                varianceBadge =
                    `<span class="badge text-bg-success">
                        Balanced
                    </span>`;

            }


            body.innerHTML += `

                <tr>

                    <td>
                        ${escapeHTML(
                            row.reference_number
                        )}
                    </td>

                    <td>

                        <strong>
                            ${escapeHTML(
                                row.product_code
                            )}
                        </strong>

                        <br>

                        <small class="text-muted">
                            ${escapeHTML(
                                row.product_name
                            )}
                        </small>

                    </td>

                    <td>
                        ${formatNumber(
                            row.system_quantity
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.counted_quantity
                        )}
                    </td>

                    <td>
                        ${getDifferenceHTML(
                            row.difference
                        )}
                    </td>

                    <td>
                        ${varianceBadge}
                    </td>

                    <td>
                        ${getStatusBadge(
                            row.status
                        )}
                    </td>

                    <td>
                        ${formatDateTime(
                            row.counted_at
                        )}
                    </td>

                </tr>

            `;

        }
    );

}


// =====================================================
// PRODUCT TABLE
// =====================================================

function renderProducts(
    rows,
    head,
    body
) {

    head.innerHTML = `

        <tr>

            <th>Code</th>
            <th>Product</th>
            <th>Category</th>
            <th>Supplier</th>
            <th>Quantity</th>
            <th>Minimum</th>
            <th>Buying Price</th>
            <th>Selling Price</th>
            <th>Stock Value</th>
            <th>Status</th>

        </tr>

    `;


    rows.forEach(
        row => {

            body.innerHTML += `

                <tr>

                    <td>
                        ${escapeHTML(
                            row.product_code
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.product_name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.category_name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.supplier_name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.quantity
                        )}
                        ${escapeHTML(
                            row.unit ||
                            ""
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.minimum_stock
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            row.buying_price
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            row.selling_price
                        )}
                    </td>

                    <td class="fw-semibold">

                        ${formatMoney(
                            row.stock_value
                        )}

                    </td>

                    <td>
                        ${getProductStatusBadge(
                            row.status
                        )}
                    </td>

                </tr>

            `;

        }
    );

}


// =====================================================
// LOW STOCK TABLE
// =====================================================

function renderLowStock(
    rows,
    head,
    body
) {

    head.innerHTML = `

        <tr>

            <th>Code</th>
            <th>Product</th>
            <th>Category</th>
            <th>Supplier</th>
            <th>Current</th>
            <th>Minimum</th>
            <th>Shortage</th>
            <th>Stock Status</th>

        </tr>

    `;


    rows.forEach(
        row => {

            body.innerHTML += `

                <tr>

                    <td>
                        ${escapeHTML(
                            row.product_code
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.product_name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.category_name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.supplier_name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.quantity
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.minimum_stock
                        )}
                    </td>

                    <td class="text-danger fw-semibold">

                        ${formatNumber(
                            row.shortage_quantity
                        )}

                    </td>

                    <td>

                        ${
                            row.stock_status ===
                            "Out of Stock"

                                ? `<span class="badge text-bg-danger">
                                    Out of Stock
                                   </span>`

                                : `<span class="badge text-bg-warning">
                                    Low Stock
                                   </span>`
                        }

                    </td>

                </tr>

            `;

        }
    );

}


// =====================================================
// AUDIT LOG TABLE
// =====================================================

function renderAuditLogs(
    rows,
    head,
    body
) {

    head.innerHTML = `

        <tr>

            <th>Date</th>
            <th>User</th>
            <th>Role</th>
            <th>Action</th>
            <th>Table</th>
            <th>Record ID</th>
            <th>Description</th>
            <th>IP Address</th>

        </tr>

    `;


    rows.forEach(
        row => {

            body.innerHTML += `

                <tr>

                    <td>
                        ${formatDateTime(
                            row.created_at
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.user_name ||
                            "System"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.role ||
                            "-"
                        )}
                    </td>

                    <td>

                        <span
                            class="badge text-bg-primary">

                            ${escapeHTML(
                                row.action
                            )}

                        </span>

                    </td>

                    <td>
                        ${escapeHTML(
                            row.table_name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${row.record_id || "-"}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.description ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            row.ip_address ||
                            "-"
                        )}
                    </td>

                </tr>

            `;

        }
    );

}


// =====================================================
// REPORT TITLE
// =====================================================

function getReportTitle() {

    const titles = {

        "stock-movements":
            "Stock Movement Report",

        "stock-taking":
            "Stock Taking Report",

        "stock-variance":
            "Stock Variance Report",

        "products":
            "Product Inventory Report",

        "low-stock":
            "Low Stock Report",

        "audit-logs":
            "Audit Log Report"

    };


    return (
        titles[currentReportType] ||
        "Report"
    );

}


// =====================================================
// TRANSACTION BADGE
// =====================================================

function getTransactionBadge(type) {

    if (type === "stock_in") {

        return `
            <span class="badge text-bg-success">
                Stock In
            </span>
        `;

    }


    if (type === "stock_out") {

        return `
            <span class="badge text-bg-danger">
                Stock Out
            </span>
        `;

    }


    return `
        <span class="badge text-bg-warning">
            Adjustment
        </span>
    `;

}


// =====================================================
// STATUS BADGE
// =====================================================

function getStatusBadge(status) {

    const classes = {

        draft: "text-bg-secondary",

        in_progress: "text-bg-primary",

        completed: "text-bg-success",

        cancelled: "text-bg-danger"

    };


    const labels = {

        draft: "Draft",

        in_progress: "In Progress",

        completed: "Completed",

        cancelled: "Cancelled"

    };


    return `

        <span
            class="badge ${
                classes[status] ||
                "text-bg-secondary"
            }">

            ${
                labels[status] ||
                status ||
                "-"
            }

        </span>

    `;

}


// =====================================================
// PRODUCT STATUS
// =====================================================

function getProductStatusBadge(status) {

    if (status === "active") {

        return `
            <span class="badge text-bg-success">
                Active
            </span>
        `;

    }


    return `
        <span class="badge text-bg-secondary">
            Inactive
        </span>
    `;

}


// =====================================================
// DIFFERENCE
// =====================================================

function getDifferenceHTML(
    difference
) {

    const value =
        Number(difference || 0);


    if (value < 0) {

        return `

            <span class="text-danger fw-semibold">

                ${formatNumber(value)}

            </span>

        `;

    }


    if (value > 0) {

        return `

            <span class="text-warning fw-semibold">

                +${formatNumber(value)}

            </span>

        `;

    }


    return `

        <span class="text-success fw-semibold">

            0

        </span>

    `;

}


// =====================================================
// FORMAT NUMBER
// =====================================================

function formatNumber(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString(
        "en-TZ",
        {
            minimumFractionDigits:
                number % 1 !== 0
                    ? 2
                    : 0,
            maximumFractionDigits: 2
        }
    );

}


// =====================================================
// FORMAT MONEY
// =====================================================

function formatMoney(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString(
        "en-TZ",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


// =====================================================
// FORMAT DATE TIME
// =====================================================

function formatDateTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {

        return escapeHTML(
            String(value)
        );

    }


    return date.toLocaleString(
        "en-TZ",
        {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


// =====================================================
// LOADING
// =====================================================

function showLoading(show) {

    const loading =
        document.getElementById(
            "loading"
        );


    if (loading) {

        loading.classList.toggle(
            "d-none",
            !show
        );

    }

}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(message) {

    const element =
        document.getElementById(
            "reportMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.remove(
        "d-none"
    );

}


function hideMessage() {

    const element =
        document.getElementById(
            "reportMessage"
        );


    if (element) {

        element.classList.add(
            "d-none"
        );

    }

}


// =====================================================
// RESET FILTERS
// =====================================================

function resetFilters() {

    document.getElementById(
        "reportType"
    ).value =
        "stock-movements";


    document.getElementById(
        "transactionType"
    ).value =
        "";


    document.getElementById(
        "productFilter"
    ).value =
        "";


    document.getElementById(
        "stockTakingStatus"
    ).value =
        "";


    document.getElementById(
        "varianceType"
    ).value =
        "";


    document.getElementById(
        "categoryFilter"
    ).value =
        "";


    document.getElementById(
        "supplierFilter"
    ).value =
        "";


    setDefaultDates();


    updateFilterVisibility();


    generateReport();

}


// =====================================================
// PRINT REPORT
// =====================================================

function printReport() {

    if (!currentReportData.length) {

        alert(
            "Please generate a report before printing."
        );

        return;

    }


    const table =
        document.getElementById(
            "reportTable"
        );


    const title =
        getReportTitle();


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${title}
            </title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                }

                h1 {
                    margin-bottom: 5px;
                }

                p {
                    color: #666;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                th,
                td {
                    border: 1px solid #ccc;
                    padding: 8px;
                    text-align: left;
                    font-size: 12px;
                }

                th {
                    background: #f2f2f2;
                }

                .badge {
                    display: inline-block;
                    padding: 3px 6px;
                    border-radius: 4px;
                    background: #eee;
                }

            </style>

        </head>

        <body>

            <h1>
                Pajebe Stock Taking
            </h1>

            <h2>
                ${title}
            </h2>

            <p>
                Generated:
                ${new Date().toLocaleString("en-TZ")}
            </p>

            ${table.outerHTML}

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        () => {

            printWindow.print();

            printWindow.close();

        },
        500
    );

}


// =====================================================
// EXPORT CSV
// =====================================================

function exportCSV() {

    if (!currentReportData.length) {

        alert(
            "Please generate a report before exporting."
        );

        return;

    }


    let headers = [];

    let rows = [];


    switch (currentReportType) {

        case "stock-movements":

            headers = [
                "Product Code",
                "Product",
                "Type",
                "Quantity",
                "Previous Quantity",
                "New Quantity",
                "Reference",
                "Reason",
                "User",
                "Date"
            ];


            rows =
                currentReportData.map(
                    row => [

                        row.product_code,

                        row.product_name,

                        row.transaction_type,

                        row.quantity,

                        row.previous_quantity,

                        row.new_quantity,

                        row.reference_number,

                        row.reason,

                        row.user_name,

                        row.transaction_date

                    ]
                );

            break;



        case "stock-taking":

            headers = [
                "Reference",
                "Title",
                "Status",
                "Product Code",
                "Product",
                "System Quantity",
                "Counted Quantity",
                "Difference",
                "Notes",
                "Counted At",
                "Created By"
            ];


            rows =
                currentReportData.map(
                    row => [

                        row.reference_number,

                        row.title,

                        row.status,

                        row.product_code,

                        row.product_name,

                        row.system_quantity,

                        row.counted_quantity,

                        row.difference,

                        row.notes,

                        row.counted_at,

                        row.created_by

                    ]
                );

            break;



        case "stock-variance":

            headers = [
                "Reference",
                "Title",
                "Status",
                "Product Code",
                "Product",
                "System Quantity",
                "Counted Quantity",
                "Difference",
                "Variance",
                "Notes",
                "Date"
            ];


            rows =
                currentReportData.map(
                    row => [

                        row.reference_number,

                        row.title,

                        row.status,

                        row.product_code,

                        row.product_name,

                        row.system_quantity,

                        row.counted_quantity,

                        row.difference,

                        row.variance_type,

                        row.notes,

                        row.counted_at

                    ]
                );

            break;



        case "products":

            headers = [
                "Product Code",
                "Product",
                "Category",
                "Supplier",
                "Unit",
                "Buying Price",
                "Selling Price",
                "Quantity",
                "Minimum Stock",
                "Stock Value",
                "Status"
            ];


            rows =
                currentReportData.map(
                    row => [

                        row.product_code,

                        row.product_name,

                        row.category_name,

                        row.supplier_name,

                        row.unit,

                        row.buying_price,

                        row.selling_price,

                        row.quantity,

                        row.minimum_stock,

                        row.stock_value,

                        row.status

                    ]
                );

            break;



        case "low-stock":

            headers = [
                "Product Code",
                "Product",
                "Category",
                "Supplier",
                "Quantity",
                "Minimum Stock",
                "Shortage",
                "Buying Price",
                "Stock Value",
                "Status"
            ];


            rows =
                currentReportData.map(
                    row => [

                        row.product_code,

                        row.product_name,

                        row.category_name,

                        row.supplier_name,

                        row.quantity,

                        row.minimum_stock,

                        row.shortage_quantity,

                        row.buying_price,

                        row.stock_value,

                        row.stock_status

                    ]
                );

            break;



        case "audit-logs":

            headers = [
                "Date",
                "User",
                "Email",
                "Role",
                "Action",
                "Table",
                "Record ID",
                "Description",
                "IP Address"
            ];


            rows =
                currentReportData.map(
                    row => [

                        row.created_at,

                        row.user_name,

                        row.email,

                        row.role,

                        row.action,

                        row.table_name,

                        row.record_id,

                        row.description,

                        row.ip_address

                    ]
                );

            break;

    }


    const csv = [

        headers.map(
            csvEscape
        ).join(","),

        ...rows.map(
            row =>
                row.map(
                    csvEscape
                ).join(",")
        )

    ].join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `${currentReportType}-report-${getTodayString()}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


// =====================================================
// CSV ESCAPE
// =====================================================

function csvEscape(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const text =
        String(value);


    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;

    }


    return text;

}


// =====================================================
// TODAY STRING
// =====================================================

function getTodayString() {

    const date =
        new Date();


    return date
        .toISOString()
        .split("T")[0];

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
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