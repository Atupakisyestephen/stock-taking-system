let categoryModal;

let allCategories = [];

let editingCategoryId = null;


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        categoryModal =
            new bootstrap.Modal(
                document.getElementById(
                    "categoryModal"
                )
            );


        document
            .getElementById(
                "addCategoryButton"
            )
            .addEventListener(
                "click",
                openAddCategoryModal
            );


        document
            .getElementById(
                "categoryForm"
            )
            .addEventListener(
                "submit",
                saveCategory
            );


        document
            .getElementById(
                "searchCategory"
            )
            .addEventListener(
                "input",
                filterCategories
            );


        document
            .getElementById(
                "statusFilter"
            )
            .addEventListener(
                "change",
                filterCategories
            );


        loadCategories();

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
                data.message
            );

        }


        allCategories =
            data.data || [];


        renderCategories(
            allCategories
        );


    } catch (error) {

        console.error(
            "Load categories error:",
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

function renderCategories(
    categories
) {

    const table =
        document.getElementById(
            "categoriesTable"
        );


    document.getElementById(
        "categoryCount"
    ).textContent =
        categories.length;


    if (categories.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center text-muted py-5">

                    <i
                        class="bi bi-tags fs-1 d-block mb-2">
                    </i>

                    No categories found.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        categories
            .map(
                (category, index) => {

                    const status =
                        category.status ===
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
                                        category.category_name
                                    )}

                                </strong>

                            </td>

                            <td>

                                ${escapeHtml(
                                    category.description ||
                                    "-"
                                )}

                            </td>

                            <td>

                                <span
                                    class="badge text-bg-light border">

                                    ${Number(
                                        category.product_count
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
                                        onclick="editCategory(${category.id})">

                                        <i
                                            class="bi bi-pencil">
                                        </i>

                                    </button>


                                    ${
                                        category.status ===
                                        "active"

                                        ? `

                                            <button
                                                class="btn btn-outline-danger"
                                                onclick="deactivateCategory(${category.id})">

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

function openAddCategoryModal() {

    editingCategoryId =
        null;


    document.getElementById(
        "categoryModalTitle"
    ).textContent =
        "Add Category";


    document.getElementById(
        "categoryForm"
    ).reset();


    document.getElementById(
        "categoryId"
    ).value = "";


    categoryModal.show();

}


// ========================================
// EDIT
// ========================================

async function editCategory(id) {

    try {

        const response =
            await fetch(
                `/categories/${id}`,
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


        const category =
            data.data;


        editingCategoryId =
            category.id;


        document.getElementById(
            "categoryModalTitle"
        ).textContent =
            "Edit Category";


        document.getElementById(
            "categoryId"
        ).value =
            category.id;


        document.getElementById(
            "categoryName"
        ).value =
            category.category_name;


        document.getElementById(
            "categoryDescription"
        ).value =
            category.description || "";


        categoryModal.show();


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

async function saveCategory(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveCategoryButton"
        );


    const category = {

        category_name:
            document.getElementById(
                "categoryName"
            ).value.trim(),

        description:
            document.getElementById(
                "categoryDescription"
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
            editingCategoryId

                ? `/categories/${editingCategoryId}`

                : "/categories";


        const method =
            editingCategoryId
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
                            category
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


        categoryModal.hide();


        showMessage(
            data.message,
            "success"
        );


        loadCategories();


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

            Save Category

        `;

    }

}


// ========================================
// DEACTIVATE
// ========================================

async function deactivateCategory(id) {

    const category =
        allCategories.find(
            item =>
                item.id === id
        );


    if (!category) {
        return;
    }


    const confirmed =
        confirm(
            `Deactivate "${category.category_name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/categories/${id}`,
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


        loadCategories();


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

function filterCategories() {

    const search =
        document.getElementById(
            "searchCategory"
        ).value
            .trim()
            .toLowerCase();


    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    const filtered =
        allCategories.filter(
            category => {

                const matchesSearch =

                    category.category_name
                        .toLowerCase()
                        .includes(search)

                    ||

                    (
                        category.description ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search);


                const matchesStatus =

                    status === "all"

                    ||

                    category.status ===
                    status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderCategories(
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