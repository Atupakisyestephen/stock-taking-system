const express = require("express");

const db = require("../database/db");

const auth = require("../middleware/auth");

const router = express.Router();


// ========================================
// GET SETTINGS
// ========================================

router.get("/", auth, async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id,
                organization_name,
                phone,
                email,
                address,
                currency,
                logo,
                updated_at
            FROM settings
            ORDER BY id ASC
            LIMIT 1
        `);


        if (rows.length === 0) {

            return res.json({
                success: true,
                data: null
            });

        }


        res.json({
            success: true,
            data: rows[0]
        });


    } catch (error) {

        console.error(
            "Get settings error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load settings."
        });

    }

});


// ========================================
// UPDATE SETTINGS
// ========================================

router.put("/", auth, async (req, res) => {

    try {

        const {
            organization_name,
            phone,
            email,
            address,
            currency,
            logo
        } = req.body;


        // ========================================
        // VALIDATION
        // ========================================

        if (!organization_name || !organization_name.trim()) {

            return res.status(400).json({
                success: false,
                message: "Organization name is required."
            });

        }


        if (!currency || !currency.trim()) {

            return res.status(400).json({
                success: false,
                message: "Currency is required."
            });

        }


        // ========================================
        // CHECK IF SETTINGS EXIST
        // ========================================

        const [existing] = await db.query(`
            SELECT id
            FROM settings
            ORDER BY id ASC
            LIMIT 1
        `);


        if (existing.length === 0) {

            const [result] = await db.query(`
                INSERT INTO settings (
                    organization_name,
                    phone,
                    email,
                    address,
                    currency,
                    logo
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                organization_name.trim(),
                phone ? phone.trim() : null,
                email ? email.trim() : null,
                address ? address.trim() : null,
                currency.trim(),
                logo ? logo.trim() : null
            ]);


            return res.json({
                success: true,
                message: "Settings saved successfully.",
                data: {
                    id: result.insertId
                }
            });

        }


        // ========================================
        // UPDATE EXISTING SETTINGS
        // ========================================

        await db.query(`
            UPDATE settings
            SET
                organization_name = ?,
                phone = ?,
                email = ?,
                address = ?,
                currency = ?,
                logo = ?
            WHERE id = ?
        `, [
            organization_name.trim(),
            phone ? phone.trim() : null,
            email ? email.trim() : null,
            address ? address.trim() : null,
            currency.trim(),
            logo ? logo.trim() : null,
            existing[0].id
        ]);


        res.json({
            success: true,
            message: "Settings updated successfully."
        });


    } catch (error) {

        console.error(
            "Update settings error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update settings."
        });

    }

});


module.exports = router;