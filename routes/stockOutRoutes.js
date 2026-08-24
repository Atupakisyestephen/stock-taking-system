const express = require("express");

const router = express.Router();

const db = require("../database/db");

const auth = require("../middleware/auth");


// ======================================================
// GET PRODUCTS FOR STOCK OUT
// ======================================================

router.get(
    "/products",
    auth,
    async (req, res) => {

        try {

            const [rows] = await db.query(
                `
                SELECT
                    id,
                    product_code,
                    product_name,
                    unit,
                    quantity,
                    selling_price,
                    status

                FROM products

                WHERE status = 'active'

                ORDER BY product_name ASC
                `
            );


            res.json({

                success: true,

                data: rows

            });


        } catch (error) {

            console.error(
                "Load Stock Out products error:",
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


// ======================================================
// GET STOCK OUT TRANSACTIONS
// ======================================================

router.get(
    "/",
    auth,
    async (req, res) => {

        try {

            const [rows] = await db.query(
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

                WHERE st.transaction_type = 'stock_out'

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
                "Load Stock Out transactions error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load stock out transactions."

            });

        }

    }
);


// ======================================================
// CREATE STOCK OUT
// ======================================================

router.post(
    "/",
    auth,
    async (req, res) => {

        let connection;

        try {

            const {
                product_id,
                quantity,
                reference_number,
                reason
            } = req.body;


            // ------------------------------------------
            // CHECK USER SESSION
            // ------------------------------------------

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


            // ------------------------------------------
            // VALIDATE PRODUCT
            // ------------------------------------------

            if (!product_id) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please select a product."

                });

            }


            // ------------------------------------------
            // VALIDATE QUANTITY
            // ------------------------------------------

            const stockOutQuantity =
                Number(quantity);


            if (
                !Number.isFinite(stockOutQuantity) ||
                stockOutQuantity <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Quantity must be greater than zero."

                });

            }


            // ------------------------------------------
            // GET DATABASE CONNECTION
            // ------------------------------------------

            connection =
                await db.getConnection();


            // ------------------------------------------
            // START TRANSACTION
            // ------------------------------------------

            await connection.beginTransaction();


            // ------------------------------------------
            // LOCK PRODUCT ROW
            // ------------------------------------------

            const [products] =
                await connection.query(
                    `
                    SELECT

                        id,
                        product_code,
                        product_name,
                        unit,
                        quantity,
                        status

                    FROM products

                    WHERE id = ?

                    FOR UPDATE
                    `,
                    [product_id]
                );


            // ------------------------------------------
            // PRODUCT NOT FOUND
            // ------------------------------------------

            if (products.length === 0) {

                await connection.rollback();

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found."

                });

            }


            const product =
                products[0];


            // ------------------------------------------
            // CHECK PRODUCT STATUS
            // ------------------------------------------

            if (product.status !== "active") {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    message:
                        "This product is inactive."

                });

            }


            // ------------------------------------------
            // CURRENT STOCK
            // ------------------------------------------

            const previousQuantity =
                Number(product.quantity);


            // ------------------------------------------
            // CHECK AVAILABLE STOCK
            // ------------------------------------------

            if (
                stockOutQuantity >
                previousQuantity
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    message:
                        `Insufficient stock. Available quantity is ${previousQuantity} ${product.unit}.`

                });

            }


            // ------------------------------------------
            // CALCULATE NEW STOCK
            // ------------------------------------------

            const newQuantity =
                previousQuantity -
                stockOutQuantity;


            // ------------------------------------------
            // UPDATE PRODUCT STOCK
            // ------------------------------------------

            await connection.query(
                `
                UPDATE products

                SET quantity = ?

                WHERE id = ?
                `,
                [
                    newQuantity,
                    product_id
                ]
            );


            // ------------------------------------------
            // CREATE STOCK TRANSACTION
            // ------------------------------------------

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
                    'stock_out',
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                `,
                [

                    product_id,

                    req.session.user.id,

                    stockOutQuantity,

                    previousQuantity,

                    newQuantity,

                    reference_number || null,

                    reason || null

                ]
            );


            // ------------------------------------------
            // COMMIT TRANSACTION
            // ------------------------------------------

            await connection.commit();


            // ------------------------------------------
            // RESPONSE
            // ------------------------------------------

            res.json({

                success: true,

                message:
                    "Stock out recorded successfully.",

                data: {

                    product_id,

                    product_name:
                        product.product_name,

                    previous_quantity:
                        previousQuantity,

                    quantity:
                        stockOutQuantity,

                    new_quantity:
                        newQuantity

                }

            });


        } catch (error) {

            // Rollback only if connection exists
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
                "Stock Out error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to record stock out."

            });


        } finally {

            if (connection) {

                connection.release();

            }

        }

    }
);


module.exports = router;