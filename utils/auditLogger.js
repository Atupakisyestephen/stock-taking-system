const db = require("../database/db");


// ========================================
// CREATE AUDIT LOG
// ========================================

async function createAuditLog({
    userId = null,
    action,
    tableName = null,
    recordId = null,
    description = null,
    ipAddress = null
}) {

    try {

        await db.query(
            `
            INSERT INTO audit_logs
            (
                user_id,
                action,
                table_name,
                record_id,
                description,
                ip_address
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                userId,
                action,
                tableName,
                recordId,
                description,
                ipAddress
            ]
        );

    } catch (error) {

        console.error(
            "Audit log error:",
            error
        );

    }

}


// ========================================
// GET CLIENT IP
// ========================================

function getClientIp(req) {

    if (
        req.headers &&
        req.headers["x-forwarded-for"]
    ) {

        return req.headers[
            "x-forwarded-for"
        ]
            .split(",")[0]
            .trim();

    }


    return (
        req.socket?.remoteAddress ||
        req.ip ||
        null
    );

}


module.exports = {
    createAuditLog,
    getClientIp
};