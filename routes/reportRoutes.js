const express = require("express");

const db = require("../database/db");

const auth = require("../middleware/auth");

const router = express.Router();


// =====================================================
// HELPER: VALIDATE DATE
// =====================================================

function isValidDate(date) {

    if (!date) {
        return false;
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(date);

}


// =====================================================
// GET REPORT SUMMARY
// =====================================================

router.get(
    "/summary",
    auth,
    async (req, res) => {

        try {

            const [
                [summary]
            ] = await db.query(`

                SELECT

                    COUNT(*) AS totalProducts,

                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS totalStock,

                    COALESCE(
                        SUM(
                            quantity * buying_price
                        ),
                        0
                    ) AS totalStockValue,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN quantity <= 0
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS outOfStock,

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
                    ) AS lowStock

                FROM products

                WHERE status = 'active'

            `);


            const [
                [movements]
            ] = await db.query(`

                SELECT

                    COALESCE(
                        SUM(
                            CASE
                                WHEN transaction_type = 'stock_in'
                                THEN quantity
                                ELSE 0
                            END
                        ),
                        0
                    ) AS totalStockIn,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN transaction_type = 'stock_out'
                                THEN quantity
                                ELSE 0
                            END
                        ),
                        0
                    ) AS totalStockOut,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN transaction_type = 'adjustment'
                                THEN quantity
                                ELSE 0
                            END
                        ),
                        0
                    ) AS totalAdjustments

                FROM stock_transactions

            `);


            const [
                [stockTaking]
            ] = await db.query(`

                SELECT

                    COUNT(*) AS totalStockTakings,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status = 'completed'
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS completedStockTakings

                FROM stock_takings

            `);


            res.json({

                success: true,

                data: {

                    totalProducts:
                        Number(
                            summary.totalProducts
                        ),

                    totalStock:
                        Number(
                            summary.totalStock
                        ),

                    totalStockValue:
                        Number(
                            summary.totalStockValue
                        ),

                    lowStock:
                        Number(
                            summary.lowStock
                        ),

                    outOfStock:
                        Number(
                            summary.outOfStock
                        ),

                    totalStockIn:
                        Number(
                            movements.totalStockIn
                        ),

                    totalStockOut:
                        Number(
                            movements.totalStockOut
                        ),

                    totalAdjustments:
                        Number(
                            movements.totalAdjustments
                        ),

                    totalStockTakings:
                        Number(
                            stockTaking.totalStockTakings
                        ),

                    completedStockTakings:
                        Number(
                            stockTaking.completedStockTakings
                        )

                }

            });

        } catch (error) {

            console.error(
                "Report summary error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load report summary."

            });

        }

    }
);


// =====================================================
// STOCK MOVEMENT REPORT
// =====================================================

router.get(
    "/stock-movements",
    auth,
    async (req, res) => {

        try {

            const {
                from,
                to,
                type,
                product_id
            } = req.query;


            let conditions = [];

            let params = [];


            if (isValidDate(from)) {

                conditions.push(
                    "DATE(st.transaction_date) >= ?"
                );

                params.push(from);

            }


            if (isValidDate(to)) {

                conditions.push(
                    "DATE(st.transaction_date) <= ?"
                );

                params.push(to);

            }


            if (
                type &&
                [
                    "stock_in",
                    "stock_out",
                    "adjustment"
                ].includes(type)
            ) {

                conditions.push(
                    "st.transaction_type = ?"
                );

                params.push(type);

            }


            if (product_id) {

                conditions.push(
                    "st.product_id = ?"
                );

                params.push(product_id);

            }


            const whereClause =
                conditions.length > 0
                    ? `WHERE ${conditions.join(" AND ")}`
                    : "";


            const [
                rows
            ] = await db.query(`

                SELECT

                    st.id,

                    st.product_id,

                    p.product_code,

                    p.product_name,

                    p.unit,

                    c.category_name AS category_name,

                    st.transaction_type,

                    st.quantity,

                    st.previous_quantity,

                    st.new_quantity,

                    st.reference_number,

                    st.reason,

                    u.full_name AS user_name,

                    st.transaction_date

                FROM stock_transactions st

                INNER JOIN products p
                    ON p.id = st.product_id

                LEFT JOIN categories c
                    ON c.id = p.category_id

                LEFT JOIN users u
                    ON u.id = st.user_id

                ${whereClause}

                ORDER BY
                    st.transaction_date DESC,
                    st.id DESC

            `, params);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Stock movement report error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load stock movement report."

            });

        }

    }
);


// =====================================================
// STOCK TAKING REPORT
// =====================================================

router.get(
    "/stock-taking",
    auth,
    async (req, res) => {

        try {

            const {
                from,
                to,
                status,
                stock_taking_id
            } = req.query;


            let conditions = [];

            let params = [];


            if (isValidDate(from)) {

                conditions.push(
                    "DATE(st.created_at) >= ?"
                );

                params.push(from);

            }


            if (isValidDate(to)) {

                conditions.push(
                    "DATE(st.created_at) <= ?"
                );

                params.push(to);

            }


            if (
                status &&
                [
                    "draft",
                    "in_progress",
                    "completed",
                    "cancelled"
                ].includes(status)
            ) {

                conditions.push(
                    "st.status = ?"
                );

                params.push(status);

            }


            if (stock_taking_id) {

                conditions.push(
                    "st.id = ?"
                );

                params.push(stock_taking_id);

            }


            const whereClause =
                conditions.length > 0
                    ? `WHERE ${conditions.join(" AND ")}`
                    : "";


            const [
                rows
            ] = await db.query(`

                SELECT

                    sti.id,

                    st.id AS stock_taking_id,

                    st.reference_number,

                    st.title,

                    st.status,

                    p.product_code,

                    p.product_name,

                    p.unit,

                    sti.system_quantity,

                    sti.counted_quantity,

                    sti.difference,

                    sti.notes,

                    sti.counted_at,

                    u.full_name AS created_by

                FROM stock_taking_items sti

                INNER JOIN stock_takings st
                    ON st.id = sti.stock_taking_id

                INNER JOIN products p
                    ON p.id = sti.product_id

                LEFT JOIN users u
                    ON u.id = st.created_by

                ${whereClause}

                ORDER BY
                    st.created_at DESC,
                    sti.id DESC

            `, params);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Stock taking report error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load stock taking report."

            });

        }

    }
);


// =====================================================
// STOCK VARIANCE REPORT
// =====================================================

router.get(
    "/stock-variance",
    auth,
    async (req, res) => {

        try {

            const {
                from,
                to,
                variance
            } = req.query;


            let conditions = [];

            let params = [];


            if (isValidDate(from)) {

                conditions.push(
                    "DATE(st.created_at) >= ?"
                );

                params.push(from);

            }


            if (isValidDate(to)) {

                conditions.push(
                    "DATE(st.created_at) <= ?"
                );

                params.push(to);

            }


            if (variance === "shortage") {

                conditions.push(
                    "sti.difference < 0"
                );

            }


            if (variance === "excess") {

                conditions.push(
                    "sti.difference > 0"
                );

            }


            if (variance === "balanced") {

                conditions.push(
                    "sti.difference = 0"
                );

            }


            const whereClause =
                conditions.length > 0
                    ? `WHERE ${conditions.join(" AND ")}`
                    : "";


            const [
                rows
            ] = await db.query(`

                SELECT

                    st.reference_number,

                    st.title,

                    st.status,

                    p.product_code,

                    p.product_name,

                    p.unit,

                    sti.system_quantity,

                    sti.counted_quantity,

                    sti.difference,

                    CASE

                        WHEN sti.difference < 0
                        THEN 'Shortage'

                        WHEN sti.difference > 0
                        THEN 'Excess'

                        ELSE 'Balanced'

                    END AS variance_type,

                    sti.notes,

                    sti.counted_at

                FROM stock_taking_items sti

                INNER JOIN stock_takings st
                    ON st.id = sti.stock_taking_id

                INNER JOIN products p
                    ON p.id = sti.product_id

                ${whereClause}

                ORDER BY
                    ABS(sti.difference) DESC,
                    sti.counted_at DESC

            `, params);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Stock variance report error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load stock variance report."

            });

        }

    }
);


// =====================================================
// PRODUCT INVENTORY REPORT
// =====================================================

router.get(
    "/products",
    auth,
    async (req, res) => {

        try {

            const {
                status,
                category_id,
                supplier_id
            } = req.query;


            let conditions = [];

            let params = [];


            if (
                status &&
                [
                    "active",
                    "inactive"
                ].includes(status)
            ) {

                conditions.push(
                    "p.status = ?"
                );

                params.push(status);

            }


            if (category_id) {

                conditions.push(
                    "p.category_id = ?"
                );

                params.push(category_id);

            }


            if (supplier_id) {

                conditions.push(
                    "p.supplier_id = ?"
                );

                params.push(supplier_id);

            }


            const whereClause =
                conditions.length > 0
                    ? `WHERE ${conditions.join(" AND ")}`
                    : "";


            const [
                rows
            ] = await db.query(`

                SELECT

                    p.id,

                    p.product_code,

                    p.product_name,

                    p.unit,

                    c.category_name AS category_name,

                    s.supplier_name AS supplier_name,

                    p.buying_price,

                    p.selling_price,

                    p.quantity,

                    p.minimum_stock,

                    (
                        p.quantity *
                        p.buying_price
                    ) AS stock_value,

                    p.status,

                    p.created_at

                FROM products p

                LEFT JOIN categories c
                    ON c.id = p.category_id

                LEFT JOIN suppliers s
                    ON s.id = p.supplier_id

                ${whereClause}

                ORDER BY
                    p.product_name ASC

            `, params);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Product report error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load product report."

            });

        }

    }
);


// =====================================================
// LOW STOCK REPORT
// =====================================================

router.get(
    "/low-stock",
    auth,
    async (req, res) => {

        try {

            const [
                rows
            ] = await db.query(`

                SELECT

                    p.id,

                    p.product_code,

                    p.product_name,

                    p.unit,

                    c.category_name AS category_name,

                    s.supplier_name AS supplier_name,

                    p.quantity,

                    p.minimum_stock,

                    (
                        p.minimum_stock -
                        p.quantity
                    ) AS shortage_quantity,

                    p.buying_price,

                    (
                        p.quantity *
                        p.buying_price
                    ) AS stock_value,

                    CASE

                        WHEN p.quantity <= 0
                        THEN 'Out of Stock'

                        ELSE 'Low Stock'

                    END AS stock_status

                FROM products p

                LEFT JOIN categories c
                    ON c.id = p.category_id

                LEFT JOIN suppliers s
                    ON s.id = p.supplier_id

                WHERE
                    p.status = 'active'

                    AND p.quantity <= p.minimum_stock

                ORDER BY
                    p.quantity ASC,
                    p.product_name ASC

            `);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Low stock report error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load low stock report."

            });

        }

    }
);


// =====================================================
// AUDIT LOG REPORT
// =====================================================

router.get(
    "/audit-logs",
    auth,
    async (req, res) => {

        try {

            const {
                from,
                to,
                user_id,
                action
            } = req.query;


            let conditions = [];

            let params = [];


            if (isValidDate(from)) {

                conditions.push(
                    "DATE(a.created_at) >= ?"
                );

                params.push(from);

            }


            if (isValidDate(to)) {

                conditions.push(
                    "DATE(a.created_at) <= ?"
                );

                params.push(to);

            }


            if (user_id) {

                conditions.push(
                    "a.user_id = ?"
                );

                params.push(user_id);

            }


            if (action) {

                conditions.push(
                    "a.action LIKE ?"
                );

                params.push(
                    `%${action}%`
                );

            }


            const whereClause =
                conditions.length > 0
                    ? `WHERE ${conditions.join(" AND ")}`
                    : "";


            const [
                rows
            ] = await db.query(`

                SELECT

                    a.id,

                    u.full_name AS user_name,

                    u.email,

                    u.role,

                    a.action,

                    a.table_name,

                    a.record_id,

                    a.description,

                    a.ip_address,

                    a.created_at

                FROM audit_logs a

                LEFT JOIN users u
                    ON u.id = a.user_id

                ${whereClause}

                ORDER BY
                    a.created_at DESC,
                    a.id DESC

            `, params);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Audit log report error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load audit log report."

            });

        }

    }
);


// =====================================================
// GET PRODUCTS FOR FILTER
// =====================================================

router.get(
    "/filters/products",
    auth,
    async (req, res) => {

        try {

            const [
                rows
            ] = await db.query(`

                SELECT

                    id,

                    product_code,

                    product_name

                FROM products

                ORDER BY
                    product_name ASC

            `);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Report product filter error:",
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


// =====================================================
// GET USERS FOR FILTER
// =====================================================

router.get(
    "/filters/users",
    auth,
    async (req, res) => {

        try {

            const [
                rows
            ] = await db.query(`

                SELECT

                    id,

                    full_name,

                    role

                FROM users

                ORDER BY
                    full_name ASC

            `);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Report user filter error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load users."

            });

        }

    }
);


// =====================================================
// GET CATEGORIES FOR FILTER
// =====================================================

router.get(
    "/filters/categories",
    auth,
    async (req, res) => {

        try {

            const [
                rows
            ] = await db.query(`

                SELECT

                    id,

                    category_name

                FROM categories

                ORDER BY
                    category_name ASC

            `);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Report category filter error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load categories."

            });

        }

    }
);


// =====================================================
// GET SUPPLIERS FOR FILTER
// =====================================================

router.get(
    "/filters/suppliers",
    auth,
    async (req, res) => {

        try {

            const [
                rows
            ] = await db.query(`

                SELECT

                    id,

                    supplier_name

                FROM suppliers

                ORDER BY
                    supplier_name ASC

            `);


            res.json({

                success: true,

                data: rows

            });

        } catch (error) {

            console.error(
                "Report supplier filter error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load suppliers."

            });

        }

    }
);


module.exports = router;