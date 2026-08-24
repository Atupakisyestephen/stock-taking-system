const express = require("express");
const bcrypt = require("bcrypt");

const db = require("../database/db");

const {
    createAuditLog,
    getClientIp
} = require("../utils/auditLogger");

const router = express.Router();


// ========================================
// LOGIN
// ========================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });

        }


        const [users] = await db.query(
            `
            SELECT
                id,
                full_name,
                email,
                password,
                role,
                status
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email.trim().toLowerCase()]
        );


        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });

        }


        const user =
            users[0];


        // --------------------------------
        // CHECK ACCOUNT STATUS
        // --------------------------------

        if (
            user.status !==
            "active"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Your account is inactive."
            });

        }


        // --------------------------------
        // CHECK PASSWORD
        // --------------------------------

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });

        }


        // --------------------------------
        // CREATE SESSION
        // --------------------------------

        req.session.user = {

            id: user.id,

            full_name:
                user.full_name,

            email:
                user.email,

            role:
                user.role

        };


        // --------------------------------
        // AUDIT LOGIN
        // --------------------------------

        await createAuditLog({

            userId:
                user.id,

            action:
                "LOGIN",

            tableName:
                "users",

            recordId:
                user.id,

            description:
                `User "${user.full_name}" logged into the system.`,

            ipAddress:
                getClientIp(req)

        });


        res.json({

            success: true,

            message:
                "Login successful.",

            user:
                req.session.user

        });


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error during login."

        });

    }

});


// ========================================
// CURRENT USER
// ========================================

router.get("/me", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({

            success: false,

            message:
                "Not logged in."

        });

    }


    res.json({

        success: true,

        user:
            req.session.user

    });

});


// ========================================
// LOGOUT
// ========================================

router.post("/logout", async (req, res) => {

    try {

        // --------------------------------
        // SAVE USER BEFORE DESTROYING
        // SESSION
        // --------------------------------

        const sessionUser =
            req.session.user;


        if (sessionUser) {

            await createAuditLog({

                userId:
                    sessionUser.id,

                action:
                    "LOGOUT",

                tableName:
                    "users",

                recordId:
                    sessionUser.id,

                description:
                    `User "${sessionUser.full_name}" logged out of the system.`,

                ipAddress:
                    getClientIp(req)

            });

        }


        // --------------------------------
        // DESTROY SESSION
        // --------------------------------

        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    return res.status(500).json({

                        success: false,

                        message:
                            "Unable to logout."

                    });

                }


                res.clearCookie(
                    "connect.sid"
                );


                res.json({

                    success: true,

                    message:
                        "Logout successful."

                });

            }
        );


    } catch (error) {

        console.error(
            "Logout audit error:",
            error
        );


        // Still attempt logout even
        // if audit logging fails.

        req.session.destroy(
            () => {

                res.clearCookie(
                    "connect.sid"
                );


                res.json({

                    success: true,

                    message:
                        "Logout successful."

                });

            }
        );

    }

});


module.exports = router;