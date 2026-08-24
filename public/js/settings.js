let currentSettings = null;


// ========================================
// LOAD SETTINGS
// ========================================

async function loadSettings() {

    try {

        const response = await fetch(
            "/settings",
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
                "Failed to load settings."
            );

        }


        currentSettings =
            data.data;


        if (currentSettings) {

            populateSettings(
                currentSettings
            );

        }


    } catch (error) {

        console.error(
            "Load settings error:",
            error
        );

        showMessage(
            "Failed to load settings.",
            "danger"
        );

    }

}


// ========================================
// POPULATE SETTINGS
// ========================================

function populateSettings(settings) {

    document.getElementById(
        "organization_name"
    ).value =
        settings.organization_name || "";


    document.getElementById(
        "phone"
    ).value =
        settings.phone || "";


    document.getElementById(
        "email"
    ).value =
        settings.email || "";


    document.getElementById(
        "address"
    ).value =
        settings.address || "";


    document.getElementById(
        "currency"
    ).value =
        settings.currency || "TZS";


    document.getElementById(
        "logo"
    ).value =
        settings.logo || "";


    updatePreview(settings);

}


// ========================================
// UPDATE PREVIEW
// ========================================

function updatePreview(settings) {

    document.getElementById(
        "previewOrganization"
    ).textContent =
        settings.organization_name || "--";


    document.getElementById(
        "previewPhone"
    ).textContent =
        settings.phone || "--";


    document.getElementById(
        "previewEmail"
    ).textContent =
        settings.email || "--";


    document.getElementById(
        "previewCurrency"
    ).textContent =
        settings.currency || "--";


    if (settings.updated_at) {

        const date =
            new Date(settings.updated_at);


        document.getElementById(
            "previewUpdated"
        ).textContent =
            date.toLocaleString(
                "en-TZ"
            );

    } else {

        document.getElementById(
            "previewUpdated"
        ).textContent =
            "--";

    }


    updateLogoPreview(
        settings.logo
    );

}


// ========================================
// LOGO PREVIEW
// ========================================

function updateLogoPreview(logo) {

    const preview =
        document.getElementById(
            "logoPreview"
        );


    if (!logo) {

        preview.innerHTML = `
            <i class="bi bi-building fs-1 text-muted"></i>
        `;

        return;

    }


    preview.innerHTML = `
        <img
            src="${escapeHtml(logo)}"
            alt="Organization Logo"
            class="img-fluid"
            style="max-width:100%;max-height:100%;object-fit:contain;">
    `;

}


// ========================================
// SAVE SETTINGS
// ========================================

async function saveSettings(event) {

    event.preventDefault();


    const saveButton =
        document.getElementById(
            "saveSettingsButton"
        );


    const organizationName =
        document.getElementById(
            "organization_name"
        ).value.trim();


    const phone =
        document.getElementById(
            "phone"
        ).value.trim();


    const email =
        document.getElementById(
            "email"
        ).value.trim();


    const address =
        document.getElementById(
            "address"
        ).value.trim();


    const currency =
        document.getElementById(
            "currency"
        ).value;


    const logo =
        document.getElementById(
            "logo"
        ).value.trim();


    if (!organizationName) {

        showMessage(
            "Organization name is required.",
            "danger"
        );

        return;

    }


    if (!currency) {

        showMessage(
            "Currency is required.",
            "danger"
        );

        return;

    }


    try {

        saveButton.disabled = true;

        saveButton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-1">
            </span>
            Saving...
        `;


        const response =
            await fetch(
                "/settings",
                {
                    method: "PUT",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        organization_name:
                            organizationName,

                        phone:
                            phone,

                        email:
                            email,

                        address:
                            address,

                        currency:
                            currency,

                        logo:
                            logo
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
                "Failed to save settings."
            );

        }


        showMessage(
            data.message ||
            "Settings saved successfully.",
            "success"
        );


        await loadSettings();


    } catch (error) {

        console.error(
            "Save settings error:",
            error
        );

        showMessage(
            error.message ||
            "Failed to save settings.",
            "danger"
        );

    } finally {

        saveButton.disabled = false;

        saveButton.innerHTML = `
            <i class="bi bi-save me-1"></i>
            Save Settings
        `;

    }

}


// ========================================
// RESET SETTINGS
// ========================================

function resetSettings() {

    if (currentSettings) {

        populateSettings(
            currentSettings
        );

    } else {

        document.getElementById(
            "settingsForm"
        ).reset();

    }


    showMessage(
        "Changes have been reset.",
        "info"
    );

}


// ========================================
// MESSAGE
// ========================================

function showMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "settingsMessage"
        );


    messageElement.className =
        `alert alert-${type}`;


    messageElement.textContent =
        message;


    messageElement.classList.remove(
        "d-none"
    );


    setTimeout(() => {

        messageElement.classList.add(
            "d-none"
        );

    }, 4000);

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value || "";


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


    if (yearElement) {

        yearElement.textContent =
            new Date().getFullYear();

    }

}


// ========================================
// EVENTS
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const settingsForm =
            document.getElementById(
                "settingsForm"
            );


        if (settingsForm) {

            settingsForm.addEventListener(
                "submit",
                saveSettings
            );

        }


        const resetButton =
            document.getElementById(
                "resetSettingsButton"
            );


        if (resetButton) {

            resetButton.addEventListener(
                "click",
                resetSettings
            );

        }


        displayCopyrightYear();

        loadSettings();

    }
);