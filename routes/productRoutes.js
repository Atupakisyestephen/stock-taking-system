const express = require("express");

const db = require("../database/db");

const auth = require("../middleware/auth");

const router = express.Router();


// ========================================
// GET ALL PRODUCTS
// ========================================

router.get("/", auth, async (req, res) => {

    try {

        const [products] = await db.query(`
            
            SELECT

                products.id,

                products.product_code,

                products.product_name,

                products.unit,

                products.buying_price,

                products.selling_price,

                products.quantity,

                products.minimum_stock,

                products.status,

                products.created_at,

                categories.category_name,

                suppliers.supplier_name

            FROM products

            LEFT JOIN categories
                ON products.category_id =
                   categories.id

            LEFT JOIN suppliers
                ON products.supplier_id =
                   suppliers.id

            ORDER BY products.id DESC

        `);


        res.json({
            success: true,
            data: products
        });


    } catch (error) {

        console.error(
            "Get products error:",
            error
        );


        res.status(500).json({
            success: false,
            message: "Failed to load products."
        });

    }

});


// ========================================
// GET SINGLE PRODUCT
// ========================================

router.get("/:id", auth, async (req, res) => {

    try {

        const productId =
            req.params.id;


        const [products] =
            await db.query(
                `
                SELECT *

                FROM products

                WHERE id = ?

                LIMIT 1
                `,
                [productId]
            );


        if (products.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }


        res.json({
            success: true,
            data: products[0]
        });


    } catch (error) {

        console.error(
            "Get product error:",
            error
        );


        res.status(500).json({
            success: false,
            message: "Failed to load product."
        });

    }

});


// ========================================
// ADD PRODUCT
// ========================================

router.post("/", auth, async (req, res) => {

    try {

        const {

            product_code,
            product_name,
            category_id,
            supplier_id,
            unit,
            buying_price,
            selling_price,
            quantity,
            minimum_stock

        } = req.body;


        if (
            !product_code ||
            !product_name ||
            !unit
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Product code, product name and unit are required."
            });

        }


        const [existing] =
            await db.query(
                `
                SELECT id

                FROM products

                WHERE product_code = ?

                LIMIT 1
                `,
                [product_code]
            );


        if (existing.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "Product code already exists."
            });

        }


        const [result] =
            await db.query(
                `
                INSERT INTO products
                (
                    product_code,
                    product_name,
                    category_id,
                    supplier_id,
                    unit,
                    buying_price,
                    selling_price,
                    quantity,
                    minimum_stock,
                    status
                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                `,
                [

                    product_code,
                    product_name,

                    category_id ||
                        null,

                    supplier_id ||
                        null,

                    unit,

                    Number(buying_price) || 0,

                    Number(selling_price) || 0,

                    Number(quantity) || 0,

                    Number(minimum_stock) || 0

                ]
            );


        res.status(201).json({

            success: true,

            message:
                "Product added successfully.",

            productId:
                result.insertId

        });


    } catch (error) {

        console.error(
            "Add product error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Failed to add product."
        });

    }

});


// ========================================
// UPDATE PRODUCT
// ========================================

router.put("/:id", auth, async (req, res) => {

    try {

        const productId =
            req.params.id;


        const {

            product_code,
            product_name,
            category_id,
            supplier_id,
            unit,
            buying_price,
            selling_price,
            quantity,
            minimum_stock

        } = req.body;


        if (
            !product_code ||
            !product_name ||
            !unit
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Product code, product name and unit are required."
            });

        }


        const [existing] =
            await db.query(
                `
                SELECT id

                FROM products

                WHERE product_code = ?

                AND id != ?

                LIMIT 1
                `,
                [
                    product_code,
                    productId
                ]
            );


        if (existing.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "Another product already uses this product code."
            });

        }


        const [result] =
            await db.query(
                `
                UPDATE products

                SET

                    product_code = ?,

                    product_name = ?,

                    category_id = ?,

                    supplier_id = ?,

                    unit = ?,

                    buying_price = ?,

                    selling_price = ?,

                    quantity = ?,

                    minimum_stock = ?

                WHERE id = ?
                `,
                [

                    product_code,

                    product_name,

                    category_id ||
                        null,

                    supplier_id ||
                        null,

                    unit,

                    Number(buying_price) || 0,

                    Number(selling_price) || 0,

                    Number(quantity) || 0,

                    Number(minimum_stock) || 0,

                    productId

                ]
            );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Product not found."
            });

        }


        res.json({

            success: true,

            message:
                "Product updated successfully."

        });


    } catch (error) {

        console.error(
            "Update product error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Failed to update product."
        });

    }

});


// ========================================
// DEACTIVATE PRODUCT
// ========================================

router.delete("/:id", auth, async (req, res) => {

    try {

        const productId =
            req.params.id;


        const [result] =
            await db.query(
                `
                UPDATE products

                SET status = 'inactive'

                WHERE id = ?

                AND status = 'active'
                `,
                [productId]
            );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Product not found or already inactive."
            });

        }


        res.json({

            success: true,

            message:
                "Product deactivated successfully."

        });


    } catch (error) {

        console.error(
            "Deactivate product error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Failed to deactivate product."
        });

    }

});


module.exports = router;