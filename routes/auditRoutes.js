const express = require("express");

const db = require("../database/db");

const auth =
    require("../middleware/auth");

const adminOnly =
    require("../middleware/adminOnly");

const router =
    express.Router();


// ========================================
// GET AUDIT LOGS
// ========================================

router.get(
    "/",
    auth,
    adminOnly,
    async (req, res) => {

        try {

            const [logs] =
                await db.query(
                    `
                    SELECT
                        a.id,
                        a.user_id,
                        a.action,
                        a.table_name,
                        a.record_id,
                        a.description,
                        a.ip_address,
                        a.created_at,

                        u.full_name,
                        u.email

                    FROM audit_logs a

                    LEFT JOIN users u
                        ON a.user_id = u.id

                    ORDER BY
                        a.id DESC
                    `
                );


            res.json({

                success: true,

                logs:
                    logs

            });


        } catch (error) {

            console.error(
                "Get audit logs error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load audit logs."

            });

        }

    }
);


// ========================================
// GET SINGLE LOG
// ========================================

router.get(
    "/:id",
    auth,
    adminOnly,
    async (req, res) => {

        try {

            const logId =
                req.params.id;


            const [logs] =
                await db.query(
                    `
                    SELECT
                        a.id,
                        a.user_id,
                        a.action,
                        a.table_name,
                        a.record_id,
                        a.description,
                        a.ip_address,
                        a.created_at,

                        u.full_name,
                        u.email

                    FROM audit_logs a

                    LEFT JOIN users u
                        ON a.user_id = u.id

                    WHERE a.id = ?

                    LIMIT 1
                    `,
                    [logId]
                );


            if (
                logs.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Audit log not found."

                });

            }


            res.json({

                success: true,

                log:
                    logs[0]

            });


        } catch (error) {

            console.error(
                "Get audit log error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load audit log."

            });

        }

    }
);


module.exports = router;