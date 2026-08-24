let supplierModal;

let allSuppliers = [];

let editingSupplierId = null;


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        supplierModal =
            new bootstrap.Modal(
                document.getElementById(
                    "supplierModal"
                )
            );


        document
            .getElementById(
                "addSupplierButton"
            )
            .addEventListener(
                "click",
                openAddSupplierModal
            );


        document
            .getElementById(
                "supplierForm"
            )
            .addEventListener(
                "submit",
                saveSupplier
            );


        document
            .getElementById(
                "searchSupplier"
            )
            .addEventListener(
                "input",
                filterSuppliers
            );


        document
            .getElementById(
                "statusFilter"
            )
            .addEventListener(
                "change",
                filterSuppliers
            );


        loadSuppliers();

    }
);


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
                data.message
            );

        }


        allSuppliers =
            data.data || [];


        renderSuppliers(
            allSuppliers
        );


    } catch (error) {

        console.error(
            "Load suppliers error:",
            error
        );


        showMessage(
            error.message,
            "danger"
        );

    }

}


// ========================================
// RENDER
// ========================================

function renderSuppliers(
    suppliers
) {

    const table =
        document.getElementById(
            "suppliersTable"
        );


    document.getElementById(
        "supplierCount"
    ).textContent =
        suppliers.length;


    if (suppliers.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="text-center text-muted py-5">

                    <i
                        class="bi bi-truck fs-1 d-block mb-2">
                    </i>

                    No suppliers found.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        suppliers
            .map(
                (supplier, index) => {

                    const status =
                        supplier.status ===
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

                                <strong>

                                    ${escapeHtml(
                                        supplier.supplier_name
                                    )}

                                </strong>

                            </td>


                            <td>

                                ${escapeHtml(
                                    supplier.contact_person ||
                                    "-"
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    supplier.phone ||
                                    "-"
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    supplier.email ||
                                    "-"
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    supplier.address ||
                                    "-"
                                )}

                            </td>


                            <td>

                                <span
                                    class="badge text-bg-light border">

                                    ${Number(
                                        supplier.product_count
                                    )}

                                </span>

                            </td>


                            <td>

                                ${status}

                            </td>


                            <td
                                class="text-end">

                                <div
                                    class="btn-group btn-group-sm">


                                    <button
                                        class="btn btn-outline-primary"
                                        onclick="editSupplier(${supplier.id})">

                                        <i
                                            class="bi bi-pencil">
                                        </i>

                                    </button>


                                    ${
                                        supplier.status ===
                                        "active"

                                        ? `

                                            <button
                                                class="btn btn-outline-danger"
                                                onclick="deactivateSupplier(${supplier.id})">

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
// ADD
// ========================================

function openAddSupplierModal() {

    editingSupplierId =
        null;


    document.getElementById(
        "supplierModalTitle"
    ).textContent =
        "Add Supplier";


    document.getElementById(
        "supplierForm"
    ).reset();


    document.getElementById(
        "supplierId"
    ).value = "";


    supplierModal.show();

}


// ========================================
// EDIT
// ========================================

async function editSupplier(id) {

    try {

        const response =
            await fetch(
                `/suppliers/${id}`,
                {
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message
            );

        }


        const supplier =
            data.data;


        editingSupplierId =
            supplier.id;


        document.getElementById(
            "supplierModalTitle"
        ).textContent =
            "Edit Supplier";


        document.getElementById(
            "supplierId"
        ).value =
            supplier.id;


        document.getElementById(
            "supplierName"
        ).value =
            supplier.supplier_name;


        document.getElementById(
            "contactPerson"
        ).value =
            supplier.contact_person || "";


        document.getElementById(
            "phone"
        ).value =
            supplier.phone || "";


        document.getElementById(
            "email"
        ).value =
            supplier.email || "";


        document.getElementById(
            "address"
        ).value =
            supplier.address || "";


        supplierModal.show();


    } catch (error) {

        console.error(error);


        showMessage(
            error.message,
            "danger"
        );

    }

}


// ========================================
// SAVE
// ========================================

async function saveSupplier(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveSupplierButton"
        );


    const supplier = {

        supplier_name:
            document.getElementById(
                "supplierName"
            ).value.trim(),

        contact_person:
            document.getElementById(
                "contactPerson"
            ).value.trim(),

        phone:
            document.getElementById(
                "phone"
            ).value.trim(),

        email:
            document.getElementById(
                "email"
            ).value.trim(),

        address:
            document.getElementById(
                "address"
            ).value.trim()

    };


    button.disabled = true;


    button.innerHTML = `

        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        Saving...

    `;


    try {

        const url =
            editingSupplierId

                ? `/suppliers/${editingSupplierId}`

                : "/suppliers";


        const method =
            editingSupplierId
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
                            supplier
                        )

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message
            );

        }


        supplierModal.hide();


        showMessage(
            data.message,
            "success"
        );


        loadSuppliers();


    } catch (error) {

        console.error(error);


        showMessage(
            error.message,
            "danger"
        );

    } finally {

        button.disabled = false;


        button.innerHTML = `

            <i
                class="bi bi-check-circle me-1">
            </i>

            Save Supplier

        `;

    }

}


// ========================================
// DEACTIVATE
// ========================================

async function deactivateSupplier(id) {

    const supplier =
        allSuppliers.find(
            item =>
                item.id === id
        );


    if (!supplier) {
        return;
    }


    const confirmed =
        confirm(
            `Deactivate "${supplier.supplier_name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/suppliers/${id}`,
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


        loadSuppliers();


    } catch (error) {

        console.error(error);


        showMessage(
            error.message,
            "danger"
        );

    }

}


// ========================================
// SEARCH
// ========================================

function filterSuppliers() {

    const search =
        document.getElementById(
            "searchSupplier"
        ).value
            .trim()
            .toLowerCase();


    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    const filtered =
        allSuppliers.filter(
            supplier => {

                const searchableText = [

                    supplier.supplier_name,

                    supplier.contact_person,

                    supplier.phone,

                    supplier.email,

                    supplier.address

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    searchableText.includes(
                        search
                    );


                const matchesStatus =

                    status === "all"

                    ||

                    supplier.status ===
                    status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderSuppliers(
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
// ESCAPE HTML
// ========================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
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