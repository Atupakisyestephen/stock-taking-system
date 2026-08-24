const express = require("express");
const bcrypt = require("bcrypt");

const db = require("../database/db");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
    createAuditLog,
    getClientIp
} = require("../utils/auditLogger");

const router = express.Router();


// ========================================
// GET ALL USERS
// ========================================

router.get("/", auth, adminOnly, async (req, res) => {

    try {

        const [users] = await db.query(`
            SELECT
                id,
                full_name,
                email,
                role,
                status,
                created_at
            FROM users
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            users: users
        });

    } catch (error) {

        console.error("Get users error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load users."
        });

    }

});


// ========================================
// GET SINGLE USER
// ========================================

router.get("/:id", auth, adminOnly, async (req, res) => {

    try {

        const userId = req.params.id;

        const [users] = await db.query(`
            SELECT
                id,
                full_name,
                email,
                role,
                status,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
        `, [userId]);

        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {

        console.error("Get user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load user."
        });

    }

});


// ========================================
// CREATE USER
// ========================================

router.post("/", auth, adminOnly, async (req, res) => {

    try {

        const {
            full_name,
            email,
            password,
            role,
            status
        } = req.body;


        // --------------------------------
        // VALIDATION
        // --------------------------------

        if (
            !full_name ||
            !email ||
            !password ||
            !role
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Full name, email, password and role are required."
            });

        }


        const allowedRoles = [
            "admin",
            "manager",
            "staff"
        ];

        if (!allowedRoles.includes(role)) {

            return res.status(400).json({
                success: false,
                message: "Invalid user role."
            });

        }


        const userStatus =
            status === "inactive"
                ? "inactive"
                : "active";


        // --------------------------------
        // CHECK EMAIL
        // --------------------------------

        const [existingUsers] = await db.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email.trim().toLowerCase()]
        );


        if (existingUsers.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "A user with this email already exists."
            });

        }


        // --------------------------------
        // HASH PASSWORD
        // --------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // --------------------------------
        // INSERT USER
        // --------------------------------

        const [result] = await db.query(
            `
            INSERT INTO users
            (
                full_name,
                email,
                password,
                role,
                status
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                full_name.trim(),
                email.trim().toLowerCase(),
                hashedPassword,
                role,
                userStatus
            ]
        );


        // --------------------------------
        // AUDIT LOG
        // --------------------------------

        await createAuditLog({

            userId: req.session.user.id,

            action: "CREATE_USER",

            tableName: "users",

            recordId: result.insertId,

            description:
                `Created user "${full_name.trim()}" with role "${role}".`,

            ipAddress:
                getClientIp(req)

        });


        // --------------------------------
        // RESPONSE
        // --------------------------------

        res.status(201).json({

            success: true,

            message:
                "User created successfully.",

            userId:
                result.insertId

        });


    } catch (error) {

        console.error("Create user error:", error);

        res.status(500).json({

            success: false,

            message:
                "Failed to create user."

        });

    }

});


// ========================================
// UPDATE USER
// ========================================

router.put("/:id", auth, adminOnly, async (req, res) => {

    try {

        const userId = req.params.id;

        const {
            full_name,
            email,
            role,
            status
        } = req.body;


        // --------------------------------
        // VALIDATION
        // --------------------------------

        if (
            !full_name ||
            !email ||
            !role ||
            !status
        ) {

            return res.status(400).json({
                success: false,
                message: "All user fields are required."
            });

        }


        const allowedRoles = [
            "admin",
            "manager",
            "staff"
        ];

        const allowedStatuses = [
            "active",
            "inactive"
        ];


        if (!allowedRoles.includes(role)) {

            return res.status(400).json({
                success: false,
                message: "Invalid user role."
            });

        }


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                success: false,
                message: "Invalid user status."
            });

        }


        // --------------------------------
        // CHECK USER EXISTS
        // --------------------------------

        const [users] = await db.query(
            `
            SELECT
                id,
                full_name,
                email,
                role,
                status
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [userId]
        );


        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        // --------------------------------
        // CHECK EMAIL
        // --------------------------------

        const [existingUsers] = await db.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            AND id != ?
            LIMIT 1
            `,
            [
                email.trim().toLowerCase(),
                userId
            ]
        );


        if (existingUsers.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "Another user already uses this email."
            });

        }


        // --------------------------------
        // UPDATE USER
        // --------------------------------

        await db.query(
            `
            UPDATE users
            SET
                full_name = ?,
                email = ?,
                role = ?,
                status = ?
            WHERE id = ?
            `,
            [
                full_name.trim(),
                email.trim().toLowerCase(),
                role,
                status,
                userId
            ]
        );


        // --------------------------------
        // KEEP CURRENT SESSION UPDATED
        // --------------------------------

        if (
            Number(req.session.user.id) ===
            Number(userId)
        ) {

            req.session.user.full_name =
                full_name.trim();

            req.session.user.email =
                email.trim().toLowerCase();

            req.session.user.role =
                role;

        }


        // --------------------------------
        // AUDIT LOG
        // --------------------------------

        await createAuditLog({

            userId: req.session.user.id,

            action: "UPDATE_USER",

            tableName: "users",

            recordId: userId,

            description:
                `Updated user "${full_name.trim()}". Role: ${role}, Status: ${status}.`,

            ipAddress:
                getClientIp(req)

        });


        // --------------------------------
        // RESPONSE
        // --------------------------------

        res.json({

            success: true,

            message:
                "User updated successfully."

        });


    } catch (error) {

        console.error("Update user error:", error);

        res.status(500).json({

            success: false,

            message:
                "Failed to update user."

        });

    }

});


// ========================================
// CHANGE PASSWORD
// ========================================

router.put("/:id/password", auth, adminOnly, async (req, res) => {

    try {

        const userId = req.params.id;

        const {
            password
        } = req.body;


        // --------------------------------
        // VALIDATION
        // --------------------------------

        if (!password) {

            return res.status(400).json({
                success: false,
                message: "New password is required."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters."
            });

        }


        // --------------------------------
        // CHECK USER EXISTS
        // --------------------------------

        const [users] = await db.query(
            `
            SELECT id
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [userId]
        );


        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        // --------------------------------
        // HASH PASSWORD
        // --------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // --------------------------------
        // UPDATE PASSWORD
        // --------------------------------

        await db.query(
            `
            UPDATE users
            SET password = ?
            WHERE id = ?
            `,
            [
                hashedPassword,
                userId
            ]
        );


        // --------------------------------
        // AUDIT LOG
        // --------------------------------

        await createAuditLog({

            userId: req.session.user.id,

            action: "CHANGE_PASSWORD",

            tableName: "users",

            recordId: userId,

            description:
                "Changed a user's password.",

            ipAddress:
                getClientIp(req)

        });


        // --------------------------------
        // RESPONSE
        // --------------------------------

        res.json({

            success: true,

            message:
                "Password changed successfully."

        });


    } catch (error) {

        console.error(
            "Change password error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to change password."

        });

    }

});


// ========================================
// TOGGLE USER STATUS
// ========================================

router.patch("/:id/status", auth, adminOnly, async (req, res) => {

    try {

        const userId = req.params.id;

        const {
            status
        } = req.body;


        // --------------------------------
        // VALIDATE STATUS
        // --------------------------------

        if (
            status !== "active" &&
            status !== "inactive"
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });

        }


        // --------------------------------
        // PREVENT SELF DEACTIVATION
        // --------------------------------

        if (
            Number(req.session.user.id) ===
            Number(userId)
            &&
            status === "inactive"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You cannot deactivate your own account."
            });

        }


        // --------------------------------
        // UPDATE STATUS
        // --------------------------------

        const [result] = await db.query(
            `
            UPDATE users
            SET status = ?
            WHERE id = ?
            `,
            [
                status,
                userId
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        // --------------------------------
        // AUDIT LOG
        // --------------------------------

        await createAuditLog({

            userId: req.session.user.id,

            action:
                status === "active"
                    ? "ACTIVATE_USER"
                    : "DEACTIVATE_USER",

            tableName: "users",

            recordId: userId,

            description:
                `Changed user status to "${status}".`,

            ipAddress:
                getClientIp(req)

        });


        // --------------------------------
        // RESPONSE
        // --------------------------------

        res.json({

            success: true,

            message:
                status === "active"
                    ? "User activated successfully."
                    : "User deactivated successfully."

        });


    } catch (error) {

        console.error(
            "Toggle user status error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to update user status."

        });

    }

});


// ========================================
// DELETE USER
// ========================================

router.delete("/:id", auth, adminOnly, async (req, res) => {

    try {

        const userId = req.params.id;


        // --------------------------------
        // PREVENT SELF DELETE
        // --------------------------------

        if (
            Number(req.session.user.id) ===
            Number(userId)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You cannot delete your own account."
            });

        }


        // --------------------------------
        // GET USER BEFORE DELETE
        // --------------------------------

        const [users] = await db.query(
            `
            SELECT
                id,
                full_name,
                email,
                role
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [userId]
        );


        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        const deletedUser = users[0];


        // --------------------------------
        // DELETE USER
        // --------------------------------

        const [result] = await db.query(
            `
            DELETE FROM users
            WHERE id = ?
            `,
            [userId]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        // --------------------------------
        // AUDIT LOG
        // --------------------------------

        await createAuditLog({

            userId: req.session.user.id,

            action: "DELETE_USER",

            tableName: "users",

            recordId: userId,

            description:
                `Deleted user "${deletedUser.full_name}".`,

            ipAddress:
                getClientIp(req)

        });


        // --------------------------------
        // RESPONSE
        // --------------------------------

        res.json({

            success: true,

            message:
                "User deleted successfully."

        });


    } catch (error) {

        console.error(
            "Delete user error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to delete user."

        });

    }

});


module.exports = router;