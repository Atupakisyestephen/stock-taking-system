require("dotenv").config();

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

const db = require("./database/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes =
    require("./routes/productRoutes");
const categoryRoutes =
    require("./routes/categoryRoutes");
const supplierRoutes =
    require("./routes/supplierRoutes");
const dashboardRoutes =
    require("./routes/dashboardRoutes");
const stockInRoutes =
    require("./routes/stockInRoutes");
const stockOutRoutes =
    require("./routes/stockOutRoutes");
const stockTakingRoutes =
    require("./routes/stockTakingRoutes");
const reportRoutes =
    require("./routes/reportRoutes");
const userRoutes =
    require("./routes/userRoutes");
const auditRoutes =
    require("./routes/auditRoutes");
const settingsRoutes =
    require("./routes/settingsRoutes");

const app = express();


// ========================================
// PORT
// ========================================

const PORT = process.env.PORT || 3000;


// ========================================
// CORS
// ========================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);


// ========================================
// BODY PARSER
// ========================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ========================================
// SESSION
// ========================================

app.use(
    session({
        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 30 * 60 * 1000
        }
    })
);


// ========================================
// STATIC FILES
// ========================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ========================================
// AUTH ROUTES
// ========================================

app.use("/auth", authRoutes);

app.use("/products", productRoutes);

app.use("/categories", categoryRoutes);

app.use("/suppliers", supplierRoutes);

app.use("/dashboard", dashboardRoutes);

app.use("/stock-in", stockInRoutes);

app.use("/stock-out", stockOutRoutes);

app.use("/stock-takings", stockTakingRoutes);

app.use("/reports", reportRoutes);

app.use("/users", userRoutes);

app.use("/audit-logs", auditRoutes);

app.use("/settings", settingsRoutes);

// ========================================
// TEST API
// ========================================

app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message: "Stock Taking System API is running."
    });

});


// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "login.html"
        )
    );

});


// ========================================
// 404
// ========================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "Route not found."
    });

});


// ========================================
// ERROR HANDLER
// ========================================

app.use((error, req, res, next) => {

    console.error(
        "SERVER ERROR:",
        error
    );

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });

});


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(
        "========================================"
    );

    console.log(
        "STOCK TAKING SYSTEM"
    );

    console.log(
        "========================================"
    );

    console.log(
        `Server running on port ${PORT}`
    );

    console.log(
        `http://localhost:${PORT}`
    );

    console.log(
        "========================================"
    );

});