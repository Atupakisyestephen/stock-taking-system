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


// ========================================
// CURRENT DATE
// ========================================

function displayCurrentDate() {

    const dateElement =
        document.getElementById(
            "currentDate"
        );


    if (!dateElement) {
        return;
    }


    const today =
        new Date();


    dateElement.textContent =
        today.toLocaleDateString(
            "en-TZ",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}

// ========================================
// COPYRIGHT YEAR
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
// LOGOUT BUTTONS
// ========================================

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

// ========================================
// LOAD DASHBOARD STATISTICS
// ========================================

async function loadDashboardStats() {

    try {

        const response =
            await fetch(
                "/dashboard/stats",
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
                "Failed to load dashboard statistics."
            );

        }


        const stats =
            data.data;


        // Total products

        const totalProducts =
            document.getElementById(
                "totalProducts"
            );

        if (totalProducts) {

            totalProducts.textContent =
                Number(
                    stats.totalProducts
                ).toLocaleString();

        }


        // Total stock

        const totalStock =
            document.getElementById(
                "totalStock"
            );

        if (totalStock) {

            totalStock.textContent =
                Number(
                    stats.totalStock
                ).toLocaleString();

        }


        // Low stock

        const lowStock =
            document.getElementById(
                "lowStock"
            );

        if (lowStock) {

            lowStock.textContent =
                Number(
                    stats.lowStock
                ).toLocaleString();

        }


        // Out of stock

        const outOfStock =
            document.getElementById(
                "outOfStock"
            );

        if (outOfStock) {

            outOfStock.textContent =
                Number(
                    stats.outOfStock
                ).toLocaleString();

        }


    } catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );

    }

}

// ========================================
// LOAD LOW STOCK PRODUCTS
// ========================================

async function loadLowStockProducts() {

    const tableBody =
        document.getElementById(
            "lowStockTable"
        );


    if (!tableBody) {
        return;
    }


    try {

        const response =
            await fetch(
                "/dashboard/low-stock",
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
                "Failed to load low stock products."
            );

        }


        const products =
            data.data || [];


        // ========================================
        // NO LOW STOCK PRODUCTS
        // ========================================

        if (products.length === 0) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="text-center text-muted py-4">

                        <i
                            class="bi bi-check-circle me-1">
                        </i>

                        No low-stock products.

                    </td>

                </tr>

            `;

            return;

        }


        // ========================================
        // DISPLAY PRODUCTS
        // ========================================

        tableBody.innerHTML =
            products.map(
                product => {

                    const quantity =
                        Number(
                            product.quantity
                        ).toLocaleString(
                            "en-TZ",
                            {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                            }
                        );


                    const minimumStock =
                        Number(
                            product.minimum_stock
                        ).toLocaleString(
                            "en-TZ",
                            {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                            }
                        );


                    return `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    product.product_code
                                )}
                            </td>


                            <td>

                                <div class="fw-semibold">

                                    ${escapeHtml(
                                        product.product_name
                                    )}

                                </div>

                            </td>


                            <td>

                                ${escapeHtml(
                                    product.category_name ||
                                    "Uncategorized"
                                )}

                            </td>


                            <td>

                                <span
                                    class="text-warning fw-semibold">

                                    ${quantity}

                                </span>

                            </td>


                            <td>

                                ${minimumStock}

                            </td>


                            <td>

                                <span
                                    class="badge text-bg-warning">

                                    <i
                                        class="bi bi-exclamation-triangle me-1">
                                    </i>

                                    Low Stock

                                </span>

                            </td>

                        </tr>

                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            "Low stock products error:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center text-danger py-4">

                    Failed to load low-stock products.

                </td>

            </tr>

        `;

    }

}

// ========================================
// DASHBOARD STOCK OUT BUTTON
// ========================================

const dashboardStockOutButton =
    document.getElementById(
        "btnDashboardStockOut"
    );


if (dashboardStockOutButton) {

    dashboardStockOutButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "/pages/stock-out.html";

        }
    );

}

// ========================================
// DASHBOARD STOCK IN BUTTON
// ========================================

const dashboardStockInButton =
    document.getElementById(
        "btnDashboardStockIn"
    );


if (dashboardStockInButton) {

    dashboardStockInButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "/pages/stock-in.html";

        }
    );

}

// ========================================
// DASHBOARD ADD PRODUCT BUTTON
// ========================================

const dashboardAddProductButton =
    document.getElementById(
        "btnDashboardAddProduct"
    );


if (dashboardAddProductButton) {

    dashboardAddProductButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "/pages/products.html";

        }
    );

}

// ========================================
// DASHBOARD STOCK TAKING BUTTON
// ========================================

const dashboardStockTakingButton =
    document.getElementById(
        "btnDashboardStockTaking"
    );


if (dashboardStockTakingButton) {

    dashboardStockTakingButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "/pages/stock-taking.html";

        }
    );

}

// ========================================
// LOAD RECENT STOCK MOVEMENTS
// ========================================

async function loadRecentMovements() {

    const tableBody =
        document.getElementById(
            "recentMovements"
        );


    if (!tableBody) {
        return;
    }


    try {

        const response =
            await fetch(
                "/dashboard/recent-movements",
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
                "Failed to load recent stock movements."
            );

        }


        const movements =
            data.data || [];


        if (movements.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="4"
                        class="text-center text-muted py-4">

                        No stock movements yet.

                    </td>
                </tr>
            `;

            return;

        }


        tableBody.innerHTML =
            movements.map(
                movement => {

                    const type =
                        movement.transaction_type;


                    let typeBadge;


                    if (type === "stock_in") {

                        typeBadge = `
                            <span class="badge text-bg-success">
                                <i class="bi bi-box-arrow-in-down me-1"></i>
                                Stock In
                            </span>
                        `;

                    } else if (type === "stock_out") {

                        typeBadge = `
                            <span class="badge text-bg-warning">
                                <i class="bi bi-box-arrow-up me-1"></i>
                                Stock Out
                            </span>
                        `;

                    } else {

                        typeBadge = `
                            <span class="badge text-bg-primary">
                                <i class="bi bi-arrow-left-right me-1"></i>
                                Adjustment
                            </span>
                        `;

                    }


                    const quantity =
                        Number(
                            movement.quantity
                        ).toLocaleString(
                            "en-TZ",
                            {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                            }
                        );


                    const date =
                        movement.transaction_date
                            ? new Date(
                                movement.transaction_date
                            ).toLocaleDateString(
                                "en-TZ",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                }
                            )
                            : "-";


                    return `
                        <tr>

                            <td>

                                <div class="fw-semibold">
                                    ${escapeHtml(
                                        movement.product_name
                                    )}
                                </div>

                                <small class="text-muted">
                                    ${escapeHtml(
                                        movement.product_code || ""
                                    )}
                                </small>

                            </td>


                            <td>
                                ${typeBadge}
                            </td>


                            <td>
                                ${quantity}
                            </td>


                            <td>
                                ${date}
                            </td>

                        </tr>
                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            "Recent stock movements error:",
            error
        );


        tableBody.innerHTML = `
            <tr>

                <td
                    colspan="4"
                    class="text-center text-danger py-4">

                    Failed to load stock movements.

                </td>

            </tr>
        `;

    }

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}

// ========================================
// INITIALIZE
// ========================================

async function initializeDashboard() {

    const user =
        await loadCurrentUser();


    if (!user) {
        return;
    }


    displayCurrentDate();

    displayCopyrightYear();

    await loadDashboardStats();

    await loadLowStockProducts();

    await loadRecentMovements();

}


initializeDashboard();