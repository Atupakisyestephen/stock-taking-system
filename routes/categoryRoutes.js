const express = require("express");

const db = require("../database/db");

const auth = require("../middleware/auth");

const router = express.Router();


// ========================================
// GET ALL CATEGORIES
// ========================================

router.get("/", auth, async (req, res) => {

    try {

        const [categories] = await db.query(`
            
            SELECT

                categories.id,

                categories.category_name,

                categories.description,

                categories.status,

                categories.created_at,

                COUNT(products.id) AS product_count

            FROM categories

            LEFT JOIN products
                ON products.category_id =
                   categories.id

            GROUP BY

                categories.id,
                categories.category_name,
                categories.description,
                categories.status,
                categories.created_at

            ORDER BY categories.id DESC

        `);


        res.json({

            success: true,

            data: categories

        });


    } catch (error) {

        console.error(
            "Get categories error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load categories."

        });

    }

});


// ========================================
// GET SINGLE CATEGORY
// ========================================

router.get("/:id", auth, async (req, res) => {

    try {

        const categoryId =
            req.params.id;


        const [categories] =
            await db.query(
                `
                SELECT

                    id,

                    category_name,

                    description,

                    status,

                    created_at

                FROM categories

                WHERE id = ?

                LIMIT 1
                `,
                [categoryId]
            );


        if (categories.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Category not found."

            });

        }


        res.json({

            success: true,

            data: categories[0]

        });


    } catch (error) {

        console.error(
            "Get category error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load category."

        });

    }

});


// ========================================
// ADD CATEGORY
// ========================================

router.post("/", auth, async (req, res) => {

    try {

        const {

            category_name,
            description

        } = req.body;


        const categoryName =
            String(
                category_name || ""
            ).trim();


        const categoryDescription =
            String(
                description || ""
            ).trim();


        if (!categoryName) {

            return res.status(400).json({

                success: false,

                message:
                    "Category name is required."

            });

        }


        // Check duplicate

        const [existing] =
            await db.query(
                `
                SELECT id

                FROM categories

                WHERE category_name = ?

                LIMIT 1
                `,
                [categoryName]
            );


        if (existing.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Category already exists."

            });

        }


        const [result] =
            await db.query(
                `
                INSERT INTO categories
                (
                    category_name,
                    description,
                    status
                )

                VALUES (?, ?, 'active')
                `,
                [
                    categoryName,
                    categoryDescription ||
                        null
                ]
            );


        res.status(201).json({

            success: true,

            message:
                "Category added successfully.",

            categoryId:
                result.insertId

        });


    } catch (error) {

        console.error(
            "Add category error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to add category."

        });

    }

});


// ========================================
// UPDATE CATEGORY
// ========================================

router.put("/:id", auth, async (req, res) => {

    try {

        const categoryId =
            req.params.id;


        const {

            category_name,
            description

        } = req.body;


        const categoryName =
            String(
                category_name || ""
            ).trim();


        const categoryDescription =
            String(
                description || ""
            ).trim();


        if (!categoryName) {

            return res.status(400).json({

                success: false,

                message:
                    "Category name is required."

            });

        }


        // Check duplicate

        const [existing] =
            await db.query(
                `
                SELECT id

                FROM categories

                WHERE category_name = ?

                AND id != ?

                LIMIT 1
                `,
                [
                    categoryName,
                    categoryId
                ]
            );


        if (existing.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Another category already uses this name."

            });

        }


        const [result] =
            await db.query(
                `
                UPDATE categories

                SET

                    category_name = ?,

                    description = ?

                WHERE id = ?
                `,
                [

                    categoryName,

                    categoryDescription ||
                        null,

                    categoryId

                ]
            );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Category not found."

            });

        }


        res.json({

            success: true,

            message:
                "Category updated successfully."

        });


    } catch (error) {

        console.error(
            "Update category error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to update category."

        });

    }

});


// ========================================
// DEACTIVATE CATEGORY
// ========================================

router.delete("/:id", auth, async (req, res) => {

    try {

        const categoryId =
            req.params.id;


        // Check if category has products

        const [products] =
            await db.query(
                `
                SELECT COUNT(*) AS total

                FROM products

                WHERE category_id = ?

                AND status = 'active'
                `,
                [categoryId]
            );


        if (
            Number(
                products[0].total
            ) > 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This category has active products. Reassign those products before deactivating the category."

            });

        }


        const [result] =
            await db.query(
                `
                UPDATE categories

                SET status = 'inactive'

                WHERE id = ?

                AND status = 'active'
                `,
                [categoryId]
            );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Category not found or already inactive."

            });

        }


        res.json({

            success: true,

            message:
                "Category deactivated successfully."

        });


    } catch (error) {

        console.error(
            "Deactivate category error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to deactivate category."

        });

    }

});


module.exports = router;