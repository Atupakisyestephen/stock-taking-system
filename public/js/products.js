let productModal;

let allProducts = [];

let editingProductId = null;


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        productModal =
            new bootstrap.Modal(
                document.getElementById(
                    "productModal"
                )
            );


        document
            .getElementById(
                "addProductButton"
            )
            .addEventListener(
                "click",
                openAddProductModal
            );


        document
            .getElementById(
                "productForm"
            )
            .addEventListener(
                "submit",
                saveProduct
            );


        document
            .getElementById(
                "searchProduct"
            )
            .addEventListener(
                "input",
                filterProducts
            );


        document
            .getElementById(
                "statusFilter"
            )
            .addEventListener(
                "change",
                filterProducts
            );


        // Load lookup data first

        await loadCategories();

        await loadSuppliers();

        // Then load products

        await loadProducts();

    }
);


// ========================================
// LOAD CATEGORIES
// ========================================

async function loadCategories() {

    try {

        const response =
            await fetch(
                "/categories",
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
                "Failed to load categories."
            );

        }


        const categorySelect =
            document.getElementById(
                "categoryId"
            );


        if (!categorySelect) {

            return;

        }


        categorySelect.innerHTML = `

            <option value="">
                Select Category
            </option>

        `;


        const categories =
            data.data || [];


        categories
            .filter(
                category =>
                    category.status ===
                    "active"
            )
            .forEach(
                category => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        category.id;


                    option.textContent =
                        category.category_name;


                    categorySelect
                        .appendChild(
                            option
                        );

                }
            );


    } catch (error) {

        console.error(
            "Load categories error:",
            error
        );


        showMessage(
            "Failed to load categories.",
            "danger"
        );

    }

}


// ========================================
// LOAD SUPPLIERS
// ========================================

async function loadSuppliers() {

    try {

        const response =
            await fetch(
                "/suppliers",
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
                "Failed to load suppliers."
            );

        }


        const supplierSelect =
            document.getElementById(
                "supplierId"
            );


        if (!supplierSelect) {

            return;

        }


        supplierSelect.innerHTML = `

            <option value="">
                Select Supplier
            </option>

        `;


        const suppliers =
            data.data || [];


        suppliers
            .filter(
                supplier =>
                    supplier.status ===
                    "active"
            )
            .forEach(
                supplier => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        supplier.id;


                    option.textContent =
                        supplier.supplier_name;


                    supplierSelect
                        .appendChild(
                            option
                        );

                }
            );


    } catch (error) {

        console.error(
            "Load suppliers error:",
            error
        );


        showMessage(
            "Failed to load suppliers.",
            "danger"
        );

    }

}


// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

    try {

        const response =
            await fetch(
                "/products",
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


        allProducts =
            data.data || [];


        renderProducts(
            allProducts
        );


    } catch (error) {

        console.error(
            "Load products error:",
            error
        );


        showMessage(
            error.message ||
            "Failed to load products.",
            "danger"
        );

    }

}


// ========================================
// RENDER PRODUCTS
// ========================================

function renderProducts(products) {

    const table =
        document.getElementById(
            "productsTable"
        );


    const count =
        document.getElementById(
            "productCount"
        );


    count.textContent =
        products.length;


    if (products.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="11"
                    class="text-center text-muted py-5">

                    <i
                        class="bi bi-box-seam fs-1 d-block mb-2">
                    </i>

                    No products found.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        products
            .map(
                (product, index) => {

                    const stockStatus =
                        getStockStatus(
                            product
                        );


                    const statusBadge =
                        product.status ===
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


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>


                            <td>

                                <span
                                    class="fw-semibold">

                                    ${escapeHtml(
                                        product.product_code
                                    )}

                                </span>

                            </td>


                            <td>

                                ${escapeHtml(
                                    product.product_name
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    product.category_name ||
                                    "-"
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    product.unit
                                )}

                            </td>


                            <td>

                                ${formatMoney(
                                    product.buying_price
                                )}

                            </td>


                            <td>

                                ${formatMoney(
                                    product.selling_price
                                )}

                            </td>


                            <td>

                                <strong>

                                    ${Number(
                                        product.quantity
                                    ).toLocaleString()}

                                </strong>

                            </td>


                            <td>

                                ${stockStatus}

                            </td>


                            <td>

                                ${statusBadge}

                            </td>


                            <td
                                class="text-end">

                                <div
                                    class="btn-group btn-group-sm">


                                    <button
                                        class="btn btn-outline-primary"
                                        onclick="editProduct(${product.id})"
                                        title="Edit">

                                        <i
                                            class="bi bi-pencil">
                                        </i>

                                    </button>


                                    ${
                                        product.status ===
                                        "active"

                                        ? `

                                            <button
                                                class="btn btn-outline-danger"
                                                onclick="deactivateProduct(${product.id})"
                                                title="Deactivate">

                                                <i
                                                    class="bi bi-trash">
                                                </i>

                                            </button>

                                          `

                                        : ""
                                    }


                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


// ========================================
// STOCK STATUS
// ========================================

function getStockStatus(product) {

    const quantity =
        Number(
            product.quantity
        );


    const minimum =
        Number(
            product.minimum_stock
        );


    if (quantity <= 0) {

        return `

            <span
                class="badge text-bg-danger">

                Out of Stock

            </span>

        `;

    }


    if (quantity <= minimum) {

        return `

            <span
                class="badge text-bg-warning">

                Low Stock

            </span>

        `;

    }


    return `

        <span
            class="badge text-bg-success">

            In Stock

        </span>

    `;

}


// ========================================
// OPEN ADD MODAL
// ========================================

function openAddProductModal() {

    editingProductId =
        null;


    document.getElementById(
        "productModalTitle"
    ).textContent =
        "Add Product";


    document.getElementById(
        "productForm"
    ).reset();


    document.getElementById(
        "productId"
    ).value = "";


    document.getElementById(
        "categoryId"
    ).value = "";


    document.getElementById(
        "supplierId"
    ).value = "";


    document.getElementById(
        "quantity"
    ).value = 0;


    document.getElementById(
        "minimumStock"
    ).value = 0;


    document.getElementById(
        "buyingPrice"
    ).value = 0;


    document.getElementById(
        "sellingPrice"
    ).value = 0;


    productModal.show();

}


// ========================================
// EDIT PRODUCT
// ========================================

async function editProduct(id) {

    try {

        const response =
            await fetch(
                `/products/${id}`,
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


        const product =
            data.data;


        editingProductId =
            product.id;


        document.getElementById(
            "productModalTitle"
        ).textContent =
            "Edit Product";


        document.getElementById(
            "productId"
        ).value =
            product.id;


        document.getElementById(
            "productCode"
        ).value =
            product.product_code;


        document.getElementById(
            "productName"
        ).value =
            product.product_name;


        // IMPORTANT:
        // Select existing category

        document.getElementById(
            "categoryId"
        ).value =
            product.category_id || "";


        // IMPORTANT:
        // Select existing supplier

        document.getElementById(
            "supplierId"
        ).value =
            product.supplier_id || "";


        document.getElementById(
            "unit"
        ).value =
            product.unit;


        document.getElementById(
            "buyingPrice"
        ).value =
            product.buying_price;


        document.getElementById(
            "sellingPrice"
        ).value =
            product.selling_price;


        document.getElementById(
            "quantity"
        ).value =
            product.quantity;


        document.getElementById(
            "minimumStock"
        ).value =
            product.minimum_stock;


        productModal.show();


    } catch (error) {

        console.error(
            "Edit product error:",
            error
        );


        showMessage(
            error.message ||
            "Failed to load product.",
            "danger"
        );

    }

}


// ========================================
// SAVE PRODUCT
// ========================================

async function saveProduct(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveProductButton"
        );


    const product = {

        product_code:
            document.getElementById(
                "productCode"
            ).value.trim(),


        product_name:
            document.getElementById(
                "productName"
            ).value.trim(),


        category_id:
            document.getElementById(
                "categoryId"
            ).value || null,


        supplier_id:
            document.getElementById(
                "supplierId"
            ).value || null,


        unit:
            document.getElementById(
                "unit"
            ).value,


        buying_price:
            Number(
                document.getElementById(
                    "buyingPrice"
                ).value
            ) || 0,


        selling_price:
            Number(
                document.getElementById(
                    "sellingPrice"
                ).value
            ) || 0,


        quantity:
            Number(
                document.getElementById(
                    "quantity"
                ).value
            ) || 0,


        minimum_stock:
            Number(
                document.getElementById(
                    "minimumStock"
                ).value
            ) || 0

    };


    // Basic validation

    if (!product.product_code) {

        showMessage(
            "Product code is required.",
            "danger"
        );

        return;

    }


    if (!product.product_name) {

        showMessage(
            "Product name is required.",
            "danger"
        );

        return;

    }


    button.disabled = true;


    button.innerHTML = `

        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        Saving...

    `;


    try {

        const url =
            editingProductId

                ? `/products/${editingProductId}`

                : "/products";


        const method =
            editingProductId
                ? "PUT"
                : "POST";


        const response =
            await fetch(
                url,
                {

                    method,

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify(
                            product
                        )

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to save product."
            );

        }


        productModal.hide();


        showMessage(
            data.message,
            "success"
        );


        await loadProducts();


    } catch (error) {

        console.error(
            "Save product error:",
            error
        );


        showMessage(
            error.message ||
            "Failed to save product.",
            "danger"
        );

    } finally {

        button.disabled = false;


        button.innerHTML = `

            <i
                class="bi bi-check-circle me-1">
            </i>

            Save Product

        `;

    }

}


// ========================================
// DEACTIVATE PRODUCT
// ========================================

async function deactivateProduct(id) {

    const product =
        allProducts.find(
            item =>
                item.id === id
        );


    if (!product) {

        return;

    }


    const confirmed =
        confirm(
            `Deactivate "${product.product_name}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/products/${id}`,
                {

                    method: "DELETE",

                    credentials:
                        "include"

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message
            );

        }


        showMessage(
            data.message,
            "success"
        );


        await loadProducts();


    } catch (error) {

        console.error(
            "Deactivate product error:",
            error
        );


        showMessage(
            error.message ||
            "Failed to deactivate product.",
            "danger"
        );

    }

}


// ========================================
// SEARCH / FILTER
// ========================================

function filterProducts() {

    const search =
        document.getElementById(
            "searchProduct"
        ).value
            .trim()
            .toLowerCase();


    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    const filtered =
        allProducts.filter(
            product => {

                const matchesSearch =

                    String(
                        product.product_code ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        product.product_name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        product.category_name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        product.supplier_name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search);


                const matchesStatus =

                    status === "all"

                    ||

                    product.status ===
                    status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderProducts(
        filtered
    );

}


// ========================================
// MESSAGE
// ========================================

function showMessage(
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
            class="alert alert-${type} alert-dismissible fade show">

            ${escapeHtml(text)}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>

        </div>

    `;


    setTimeout(() => {

        const alert =
            message.querySelector(
                ".alert"
            );


        if (alert) {

            bootstrap.Alert
                .getOrCreateInstance(
                    alert
                )
                .close();

        }

    }, 4000);

}


// ========================================
// FORMAT MONEY
// ========================================

function formatMoney(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-TZ",
        {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }
    ) + " TZS";

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

displayCopyrightYear();