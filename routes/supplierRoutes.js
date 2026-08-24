const express = require("express");

const db = require("../database/db");
const auth = require("../middleware/auth");

const router = express.Router();


// ========================================
// GET ALL SUPPLIERS
// ========================================

router.get("/", auth, async (req, res) => {

    try {

        const [suppliers] = await db.query(`
            
            SELECT

                suppliers.id,

                suppliers.supplier_name,

                suppliers.phone,

                suppliers.email,

                suppliers.address,

                suppliers.contact_person,

                suppliers.status,

                suppliers.created_at,

                COUNT(products.id) AS product_count

            FROM suppliers

            LEFT JOIN products
                ON products.supplier_id =
                   suppliers.id

            GROUP BY

                suppliers.id,
                suppliers.supplier_name,
                suppliers.phone,
                suppliers.email,
                suppliers.address,
                suppliers.contact_person,
                suppliers.status,
                suppliers.created_at

            ORDER BY suppliers.id DESC

        `);


        res.json({

            success: true,
            data: suppliers

        });


    } catch (error) {

        console.error(
            "Get suppliers error:",
            error
        );


        res.status(500).json({

            success: false,
            message: "Failed to load suppliers."

        });

    }

});


// ========================================
// GET SINGLE SUPPLIER
// ========================================

router.get("/:id", auth, async (req, res) => {

    try {

        const supplierId =
            req.params.id;


        const [suppliers] =
            await db.query(
                `
                SELECT

                    id,
                    supplier_name,
                    phone,
                    email,
                    address,
                    contact_person,
                    status,
                    created_at

                FROM suppliers

                WHERE id = ?

                LIMIT 1
                `,
                [supplierId]
            );


        if (suppliers.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Supplier not found."

            });

        }


        res.json({

            success: true,
            data: suppliers[0]

        });


    } catch (error) {

        console.error(
            "Get supplier error:",
            error
        );


        res.status(500).json({

            success: false,
            message: "Failed to load supplier."

        });

    }

});


// ========================================
// ADD SUPPLIER
// ========================================

router.post("/", auth, async (req, res) => {

    try {

        const {

            supplier_name,
            phone,
            email,
            address,
            contact_person

        } = req.body;


        const supplierName =
            String(
                supplier_name || ""
            ).trim();


        if (!supplierName) {

            return res.status(400).json({

                success: false,
                message: "Supplier name is required."

            });

        }


        // Check duplicate supplier name

        const [existing] =
            await db.query(
                `
                SELECT id

                FROM suppliers

                WHERE supplier_name = ?

                LIMIT 1
                `,
                [supplierName]
            );


        if (existing.length > 0) {

            return res.status(409).json({

                success: false,
                message: "Supplier already exists."

            });

        }


        const [result] =
            await db.query(
                `
                INSERT INTO suppliers
                (
                    supplier_name,
                    phone,
                    email,
                    address,
                    contact_person,
                    status
                )

                VALUES (?, ?, ?, ?, ?, 'active')
                `,
                [

                    supplierName,

                    String(phone || "").trim() ||
                        null,

                    String(email || "").trim() ||
                        null,

                    String(address || "").trim() ||
                        null,

                    String(contact_person || "").trim() ||
                        null

                ]
            );


        res.status(201).json({

            success: true,

            message:
                "Supplier added successfully.",

            supplierId:
                result.insertId

        });


    } catch (error) {

        console.error(
            "Add supplier error:",
            error
        );


        res.status(500).json({

            success: false,
            message: "Failed to add supplier."

        });

    }

});


// ========================================
// UPDATE SUPPLIER
// ========================================

router.put("/:id", auth, async (req, res) => {

    try {

        const supplierId =
            req.params.id;


        const {

            supplier_name,
            phone,
            email,
            address,
            contact_person

        } = req.body;


        const supplierName =
            String(
                supplier_name || ""
            ).trim();


        if (!supplierName) {

            return res.status(400).json({

                success: false,
                message: "Supplier name is required."

            });

        }


        // Check duplicate name

        const [existing] =
            await db.query(
                `
                SELECT id

                FROM suppliers

                WHERE supplier_name = ?

                AND id != ?

                LIMIT 1
                `,
                [
                    supplierName,
                    supplierId
                ]
            );


        if (existing.length > 0) {

            return res.status(409).json({

                success: false,
                message:
                    "Another supplier already uses this name."

            });

        }


        const [result] =
            await db.query(
                `
                UPDATE suppliers

                SET

                    supplier_name = ?,

                    phone = ?,

                    email = ?,

                    address = ?,

                    contact_person = ?

                WHERE id = ?
                `,
                [

                    supplierName,

                    String(phone || "").trim() ||
                        null,

                    String(email || "").trim() ||
                        null,

                    String(address || "").trim() ||
                        null,

                    String(contact_person || "").trim() ||
                        null,

                    supplierId

                ]
            );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,
                message: "Supplier not found."

            });

        }


        res.json({

            success: true,
            message:
                "Supplier updated successfully."

        });


    } catch (error) {

        console.error(
            "Update supplier error:",
            error
        );


        res.status(500).json({

            success: false,
            message:
                "Failed to update supplier."

        });

    }

});


// ========================================
// DEACTIVATE SUPPLIER
// ========================================

router.delete("/:id", auth, async (req, res) => {

    try {

        const supplierId =
            req.params.id;


        // Don't deactivate suppliers
        // that still have active products

        const [products] =
            await db.query(
                `
                SELECT COUNT(*) AS total

                FROM products

                WHERE supplier_id = ?

                AND status = 'active'
                `,
                [supplierId]
            );


        if (
            Number(products[0].total) > 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This supplier has active products. Reassign those products before deactivating the supplier."

            });

        }


        const [result] =
            await db.query(
                `
                UPDATE suppliers

                SET status = 'inactive'

                WHERE id = ?

                AND status = 'active'
                `,
                [supplierId]
            );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Supplier not found or already inactive."

            });

        }


        res.json({

            success: true,

            message:
                "Supplier deactivated successfully."

        });


    } catch (error) {

        console.error(
            "Deactivate supplier error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to deactivate supplier."

        });

    }

});


module.exports = router;