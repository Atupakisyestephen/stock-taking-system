const express = require("express");

const db = require("../database/db");

const auth = require("../middleware/auth");

const router = express.Router();


// ========================================
// GET ACTIVE PRODUCTS
// ========================================

router.get(
    "/products",
    auth,
    async (req, res) => {

        try {

            const [products] =
                await db.query(
                    `
                    SELECT

                        id,

                        product_code,

                        product_name,

                        unit,

                        quantity,

                        buying_price,

                        status

                    FROM products

                    WHERE status = 'active'

                    ORDER BY product_name ASC
                    `
                );


            res.json({

                success: true,

                data: products

            });


        } catch (error) {

            console.error(
                "Load stock in products error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load products."

            });

        }

    }
);


// ========================================
// GET STOCK IN TRANSACTIONS
// ========================================

router.get(
    "/",
    auth,
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT

                        st.id,

                        st.product_id,

                        p.product_code,

                        p.product_name,

                        p.unit,

                        st.quantity,

                        st.previous_quantity,

                        st.new_quantity,

                        st.reference_number,

                        st.reason,

                        st.transaction_date,

                        u.full_name AS user_name

                    FROM stock_transactions st

                    INNER JOIN products p
                        ON p.id = st.product_id

                    LEFT JOIN users u
                        ON u.id = st.user_id

                    WHERE
                        st.transaction_type = 'stock_in'

                    ORDER BY

                        st.transaction_date DESC,

                        st.id DESC
                    `
                );


            res.json({

                success: true,

                data: rows

            });


        } catch (error) {

            console.error(
                "Load Stock In transactions error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load Stock In transactions."

            });

        }

    }
);


// ========================================
// STOCK IN
// ========================================

router.post(
    "/",
    auth,
    async (req, res) => {

        let connection;


        try {

            // ========================================
            // CHECK SESSION USER
            // ========================================

            if (
                !req.session ||
                !req.session.user ||
                !req.session.user.id
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Your session has expired. Please login again."

                });

            }


            // ========================================
            // GET REQUEST DATA
            // ========================================

            const {

                product_id,

                quantity,

                reference_number,

                reason

            } = req.body;


            // ========================================
            // VALIDATION
            // ========================================

            const productId =
                Number(product_id);


            const stockInQuantity =
                Number(quantity);


            if (
                !Number.isInteger(productId) ||
                productId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please select a valid product."

                });

            }


            if (
                !Number.isFinite(stockInQuantity) ||
                stockInQuantity <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Stock In quantity must be greater than zero."

                });

            }


            // ========================================
            // GET DATABASE CONNECTION
            // ========================================

            connection =
                await db.getConnection();


            // ========================================
            // START TRANSACTION
            // ========================================

            await connection.beginTransaction();


            // ========================================
            // GET PRODUCT
            // ========================================

            const [products] =
                await connection.query(
                    `
                    SELECT

                        id,

                        product_name,

                        unit,

                        quantity,

                        status

                    FROM products

                    WHERE id = ?

                    LIMIT 1

                    FOR UPDATE
                    `,
                    [productId]
                );


            // ========================================
            // PRODUCT NOT FOUND
            // ========================================

            if (
                products.length === 0
            ) {

                await connection.rollback();

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found."

                });

            }


            const product =
                products[0];


            // ========================================
            // CHECK PRODUCT STATUS
            // ========================================

            if (
                product.status !== "active"
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    message:
                        "This product is inactive."

                });

            }


            // ========================================
            // CALCULATE STOCK
            // ========================================

            const previousQuantity =
                Number(
                    product.quantity
                );


            const newQuantity =
                previousQuantity +
                stockInQuantity;


            // ========================================
            // UPDATE PRODUCT STOCK
            // ========================================

            await connection.query(
                `
                UPDATE products

                SET quantity = ?

                WHERE id = ?
                `,
                [
                    newQuantity,

                    productId
                ]
            );


            // ========================================
            // CREATE TRANSACTION RECORD
            // ========================================

            await connection.query(
                `
                INSERT INTO stock_transactions
                (
                    product_id,

                    user_id,

                    transaction_type,

                    quantity,

                    previous_quantity,

                    new_quantity,

                    reference_number,

                    reason
                )

                VALUES
                (
                    ?,

                    ?,

                    'stock_in',

                    ?,

                    ?,

                    ?,

                    ?,

                    ?
                )
                `,
                [

                    productId,

                    req.session.user.id,

                    stockInQuantity,

                    previousQuantity,

                    newQuantity,

                    reference_number ||
                        null,

                    reason ||
                        null

                ]
            );


            // ========================================
            // COMMIT
            // ========================================

            await connection.commit();


            // ========================================
            // RESPONSE
            // ========================================

            res.status(201).json({

                success: true,

                message:
                    `Stock In recorded successfully. ${product.product_name} now has ${newQuantity} ${stockInQuantity === 1 ? "unit" : "units"}.`,

                data: {

                    product_id:
                        productId,

                    product_name:
                        product.product_name,

                    unit:
                        product.unit,

                    previous_quantity:
                        previousQuantity,

                    quantity:
                        stockInQuantity,

                    new_quantity:
                        newQuantity

                }

            });


        } catch (error) {

            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        "Rollback error:",
                        rollbackError
                    );

                }

            }


            console.error(
                "Stock In error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to record Stock In."

            });


        } finally {

            if (connection) {

                connection.release();

            }

        }

    }
);


module.exports = router;