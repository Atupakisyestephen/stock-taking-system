const express = require("express");

const router = express.Router();

const db = require("../database/db");

const auth = require("../middleware/auth");


// =====================================================
// GENERATE STOCK TAKING REFERENCE
// =====================================================

async function generateReferenceNumber() {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const prefix = `ST-${year}${month}${day}`;

    const [rows] = await db.query(
        `
        SELECT reference_number
        FROM stock_takings
        WHERE reference_number LIKE ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [`${prefix}-%`]
    );

    let sequence = 1;

    if (rows.length > 0) {

        const lastReference =
            rows[0].reference_number;

        const lastNumber =
            parseInt(
                lastReference.split("-").pop(),
                10
            );

        if (!isNaN(lastNumber)) {
            sequence = lastNumber + 1;
        }
    }

    return `${prefix}-${String(sequence).padStart(4, "0")}`;
}


// =====================================================
// GET ALL STOCK TAKINGS
// =====================================================

router.get("/", auth, async (req, res) => {

    try {

        const [rows] = await db.query(
            `
            SELECT
                st.id,
                st.reference_number,
                st.title,
                st.description,
                st.status,
                st.started_at,
                st.completed_at,
                st.created_at,

                COUNT(sti.id) AS total_items,

                SUM(
                    CASE
                        WHEN sti.counted_quantity <> sti.system_quantity
                        THEN 1
                        ELSE 0
                    END
                ) AS items_with_difference

            FROM stock_takings st

            LEFT JOIN stock_taking_items sti
                ON sti.stock_taking_id = st.id

            GROUP BY
                st.id,
                st.reference_number,
                st.title,
                st.description,
                st.status,
                st.started_at,
                st.completed_at,
                st.created_at

            ORDER BY st.id DESC
            `
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "GET STOCK TAKINGS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load stock takings."
        });
    }
});


// =====================================================
// GET SINGLE STOCK TAKING
// =====================================================

router.get("/:id", auth, async (req, res) => {

    try {

        const stockTakingId =
            Number(req.params.id);

        if (!stockTakingId) {

            return res.status(400).json({
                success: false,
                message: "Invalid stock taking ID."
            });
        }


        const [stockTakingRows] =
            await db.query(
                `
                SELECT
                    id,
                    reference_number,
                    title,
                    description,
                    status,
                    created_by,
                    started_at,
                    completed_at,
                    created_at

                FROM stock_takings

                WHERE id = ?
                `,
                [stockTakingId]
            );


        if (stockTakingRows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Stock taking not found."
            });
        }


        const [items] =
            await db.query(
                `
                SELECT
                    sti.id,
                    sti.stock_taking_id,
                    sti.product_id,

                    p.product_code,
                    p.product_name,
                    p.unit,

                    sti.system_quantity,
                    sti.counted_quantity,
                    sti.difference,
                    sti.notes,
                    sti.counted_at

                FROM stock_taking_items sti

                INNER JOIN products p
                    ON p.id = sti.product_id

                WHERE sti.stock_taking_id = ?

                ORDER BY
                    p.product_name ASC
                `,
                [stockTakingId]
            );


        res.json({
            success: true,
            data: {
                stockTaking: stockTakingRows[0],
                items
            }
        });

    } catch (error) {

        console.error(
            "GET STOCK TAKING ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load stock taking."
        });
    }
});


// =====================================================
// CREATE STOCK TAKING
// =====================================================

router.post("/", auth, async (req, res) => {

    const connection =
        await db.getConnection();

    try {

        const {
            title,
            description
        } = req.body;


        if (!title || !title.trim()) {

            connection.release();

            return res.status(400).json({
                success: false,
                message: "Stock taking title is required."
            });
        }


        const referenceNumber =
            await generateReferenceNumber();


        const createdBy =
            req.user?.id || null;


        await connection.beginTransaction();


        const [result] =
            await connection.query(
                `
                INSERT INTO stock_takings
                (
                    reference_number,
                    title,
                    description,
                    status,
                    created_by
                )

                VALUES (?, ?, ?, 'draft', ?)
                `,
                [
                    referenceNumber,
                    title.trim(),
                    description
                        ? description.trim()
                        : null,
                    createdBy
                ]
            );


        const stockTakingId =
            result.insertId;


        // =============================================
        // COPY ACTIVE PRODUCTS INTO STOCK TAKING
        // =============================================

        const [products] =
            await connection.query(
                `
                SELECT
                    id,
                    quantity

                FROM products

                WHERE status = 'active'

                ORDER BY id
                `
            );


        if (products.length > 0) {

            const values =
                products.map(product => [
                    stockTakingId,
                    product.id,
                    Number(product.quantity) || 0,
                    null,
                    0
                ]);


            await connection.query(
                `
                INSERT INTO stock_taking_items
                (
                    stock_taking_id,
                    product_id,
                    system_quantity,
                    counted_quantity,
                    difference
                )

                VALUES ?
                `,
                [values]
            );
        }


        await connection.commit();


        res.status(201).json({
            success: true,
            message: "Stock taking created successfully.",
            data: {
                id: stockTakingId,
                reference_number: referenceNumber
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "CREATE STOCK TAKING ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create stock taking."
        });

    } finally {

        connection.release();
    }
});


// =====================================================
// START STOCK TAKING
// =====================================================

router.put("/:id/start", auth, async (req, res) => {

    try {

        const stockTakingId =
            Number(req.params.id);


        const [rows] =
            await db.query(
                `
                SELECT
                    id,
                    status

                FROM stock_takings

                WHERE id = ?
                `,
                [stockTakingId]
            );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Stock taking not found."
            });
        }


        if (rows[0].status !== "draft") {

            return res.status(400).json({
                success: false,
                message:
                    "Only draft stock takings can be started."
            });
        }


        await db.query(
            `
            UPDATE stock_takings

            SET
                status = 'in_progress',
                started_at = NOW()

            WHERE id = ?
            `,
            [stockTakingId]
        );


        res.json({
            success: true,
            message: "Stock taking started successfully."
        });

    } catch (error) {

        console.error(
            "START STOCK TAKING ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to start stock taking."
        });
    }
});


// =====================================================
// UPDATE COUNTED QUANTITY
// =====================================================

router.put(
    "/items/:itemId",
    auth,
    async (req, res) => {

        try {

            const itemId =
                Number(req.params.itemId);

            const countedQuantity =
                Number(req.body.counted_quantity);

            const notes =
                req.body.notes || null;


            if (!Number.isFinite(countedQuantity)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Counted quantity must be a valid number."
                });
            }


            const [items] =
                await db.query(
                    `
                    SELECT
                        sti.id,
                        sti.system_quantity,
                        st.status

                    FROM stock_taking_items sti

                    INNER JOIN stock_takings st
                        ON st.id = sti.stock_taking_id

                    WHERE sti.id = ?
                    `,
                    [itemId]
                );


            if (items.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Stock taking item not found."
                });
            }


            if (items[0].status !== "in_progress") {

                return res.status(400).json({
                    success: false,
                    message:
                        "Stock taking must be in progress before counting."
                });
            }


            const systemQuantity =
                Number(items[0].system_quantity);


            const difference =
                countedQuantity - systemQuantity;


            await db.query(
                `
                UPDATE stock_taking_items

                SET
                    counted_quantity = ?,
                    difference = ?,
                    notes = ?,
                    counted_at = NOW()

                WHERE id = ?
                `,
                [
                    countedQuantity,
                    difference,
                    notes,
                    itemId
                ]
            );


            res.json({
                success: true,
                message: "Count saved successfully.",
                data: {
                    counted_quantity: countedQuantity,
                    difference
                }
            });

        } catch (error) {

            console.error(
                "UPDATE COUNT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Failed to save count."
            });
        }
    }
);


// =====================================================
// COMPLETE STOCK TAKING
// =====================================================

router.put("/:id/complete", auth, async (req, res) => {

    const connection =
        await db.getConnection();

    try {

        const stockTakingId =
            Number(req.params.id);

        await connection.beginTransaction();


        // =============================================
        // GET STOCK TAKING
        // =============================================

        const [stockTakingRows] =
            await connection.query(
                `
                SELECT
                    id,
                    reference_number,
                    status

                FROM stock_takings

                WHERE id = ?

                FOR UPDATE
                `,
                [stockTakingId]
            );


        if (stockTakingRows.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Stock taking not found."
            });
        }


        const stockTaking =
            stockTakingRows[0];


        if (stockTaking.status !== "in_progress") {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Only an in-progress stock taking can be completed."
            });
        }


        // =============================================
        // GET ITEMS
        // =============================================

        const [items] =
            await connection.query(
                `
                SELECT
                    sti.id,
                    sti.product_id,
                    sti.system_quantity,
                    sti.counted_quantity,
                    sti.difference

                FROM stock_taking_items sti

                WHERE sti.stock_taking_id = ?

                FOR UPDATE
                `,
                [stockTakingId]
            );


        if (items.length === 0) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "This stock taking has no items."
            });
        }


        const userId =
            req.user?.id || null;

        
        // =============================================
// MAKE SURE ALL ITEMS HAVE BEEN COUNTED
// =============================================

const uncountedItems =
    items.filter(
        item => {
            return item.counted_quantity === null;
        }
    );


if (uncountedItems.length > 0) {

    await connection.rollback();

    return res.status(400).json({
        success: false,
        message:
            `${uncountedItems.length} product(s) have not been counted. Please count all products before completing the stock taking.`
    });
}


        // =============================================
        // UPDATE PRODUCTS + CREATE TRANSACTIONS
        // =============================================

        for (const item of items) {

            const countedQuantity =
                Number(item.counted_quantity);

            const systemQuantity =
                Number(item.system_quantity);

            const difference =
                Number(item.difference);


            if (!Number.isFinite(countedQuantity)) {

                throw new Error(
                    `Invalid counted quantity for product ${item.product_id}`
                );
            }


            // -----------------------------------------
            // Update product quantity
            // -----------------------------------------

            await connection.query(
                `
                UPDATE products

                SET quantity = ?

                WHERE id = ?
                `,
                [
                    countedQuantity,
                    item.product_id
                ]
            );


            // -----------------------------------------
            // Record adjustment
            // -----------------------------------------

            if (difference !== 0) {

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
                        'adjustment',
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        item.product_id,
                        userId,
                        difference,
                        systemQuantity,
                        countedQuantity,
                        stockTaking.reference_number,
                        "Stock taking adjustment"
                    ]
                );
            }
        }


        // =============================================
        // COMPLETE STOCK TAKING
        // =============================================

        await connection.query(
            `
            UPDATE stock_takings

            SET
                status = 'completed',
                completed_at = NOW()

            WHERE id = ?
            `,
            [stockTakingId]
        );


        await connection.commit();


        res.json({
            success: true,
            message:
                "Stock taking completed successfully."
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "COMPLETE STOCK TAKING ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to complete stock taking."
        });

    } finally {

        connection.release();
    }
});


// =====================================================
// CANCEL STOCK TAKING
// =====================================================

router.put("/:id/cancel", auth, async (req, res) => {

    try {

        const stockTakingId =
            Number(req.params.id);


        const [result] =
            await db.query(
                `
                UPDATE stock_takings

                SET status = 'cancelled'

                WHERE id = ?

                AND status IN ('draft', 'in_progress')
                `,
                [stockTakingId]
            );


        if (result.affectedRows === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Stock taking cannot be cancelled."
            });
        }


        res.json({
            success: true,
            message:
                "Stock taking cancelled successfully."
        });

    } catch (error) {

        console.error(
            "CANCEL STOCK TAKING ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to cancel stock taking."
        });
    }
});


module.exports = router;