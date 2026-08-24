const bcrypt = require("bcrypt");

const db = require("./database/db");

async function createAdmin() {

    try {

        const password = "Admin@123";

        const hashedPassword =
            await bcrypt.hash(password, 12);


        await db.query(
            `
            INSERT INTO users
            (
                full_name,
                email,
                password,
                role,
                status
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                "System Administrator",
                "admin@stocksystem.com",
                hashedPassword,
                "admin",
                "active"
            ]
        );


        console.log(
            "Admin account created successfully."
        );

        console.log(
            "Email: admin@stocksystem.com"
        );

        console.log(
            "Password: Admin@123"
        );


        process.exit(0);

    } catch (error) {

        console.error(
            "Error creating admin:",
            error.message
        );

        process.exit(1);

    }

}

createAdmin();