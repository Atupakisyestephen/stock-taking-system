const express = require("express");

const router = express.Router();

const db = require("../database/db");

const auth = require("../middleware/auth");


// ========================================
// DASHBOARD STATISTICS
// ========================================

router.get(
    "/stats",
    auth,
    async (req, res) => {

        try {

            const sql = `

                SELECT

                    COUNT(*) AS totalProducts,

                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS totalStock,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN quantity > 0
                                AND quantity <= minimum_stock
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS lowStock,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN quantity <= 0
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS outOfStock

                FROM products

                WHERE status = 'active'

            `;


            const [rows] =
                await db.query(
                    sql
                );


            res.json({

                success: true,

                data: {

                    totalProducts:
                        Number(
                            rows[0].totalProducts
                        ),

                    totalStock:
                        Number(
                            rows[0].totalStock
                        ),

                    lowStock:
                        Number(
                            rows[0].lowStock
                        ),

                    outOfStock:
                        Number(
                            rows[0].outOfStock
                        )

                }

            });


        } catch (error) {

            console.error(
                "Dashboard stats error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load dashboard statistics."

            });

        }

    }
);

// ========================================
// GET LOW STOCK PRODUCTS
// ========================================

router.get(
    "/low-stock",
    auth,
    async (req, res) => {

        try {

            const [products] = await db.query(`

                SELECT
                    p.id,
                    p.product_code,
                    p.product_name,
                    p.quantity,
                    p.minimum_stock,
                    c.category_name AS category_name

                FROM products p

                LEFT JOIN categories c
                    ON c.id = p.category_id

                WHERE
                    p.status = 'active'
                    AND p.quantity > 0
                    AND p.quantity <= p.minimum_stock

                ORDER BY
                    p.quantity ASC,
                    p.product_name ASC

            `);


            res.json({

                success: true,

                data: products

            });


        } catch (error) {

            console.error(
                "Low stock products error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load low stock products."

            });

        }

    }
);

// ========================================
// GET RECENT STOCK MOVEMENTS
// ========================================

router.get("/recent-movements", auth, async (req, res) => {

    try {

        const [movements] = await db.query(`
            SELECT
                st.id,
                st.product_id,
                p.product_code,
                p.product_name,
                st.transaction_type,
                st.quantity,
                st.previous_quantity,
                st.new_quantity,
                st.reference_number,
                st.reason,
                st.transaction_date
            FROM stock_transactions st

            INNER JOIN products p
                ON p.id = st.product_id

            ORDER BY st.transaction_date DESC

            LIMIT 10
        `);


        res.json({
            success: true,
            data: movements
        });


    } catch (error) {

        console.error(
            "Recent stock movements error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load recent stock movements."
        });

    }

});

module.exports = router;