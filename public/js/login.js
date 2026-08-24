const form =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");

const loginButton =
    document.getElementById("loginButton");

const password =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const passwordIcon =
    document.getElementById("passwordIcon");


// ========================================
// TOGGLE PASSWORD
// ========================================

togglePassword.addEventListener(
    "click",
    () => {

        if (password.type === "password") {

            password.type = "text";

            passwordIcon.className =
                "bi bi-eye-slash";

        } else {

            password.type = "password";

            passwordIcon.className =
                "bi bi-eye";

        }

    }
);


// ========================================
// LOGIN
// ========================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const passwordValue =
            password.value;


        message.innerHTML = "";


        loginButton.disabled = true;

        loginButton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2">
            </span>
            Logging in...
        `;


        try {

            const response =
                await fetch("/auth/login", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        email,
                        password:
                            passwordValue
                    })

                });


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Login failed."
                );

            }


            message.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-1"></i>
                    Login successful.
                </div>
            `;


            setTimeout(() => {

                window.location.href =
                    "/dashboard.html";

            }, 500);


        } catch (error) {

            console.error(error);


            message.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    ${error.message}
                </div>
            `;


            loginButton.disabled = false;

            loginButton.innerHTML = `
                <i
                    class="bi bi-box-arrow-in-right me-1">
                </i>
                Login
            `;

        }

    }
);