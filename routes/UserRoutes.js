const express = require("express")
const bcrypt = require("bcryptjs")
const User = require("../models/User")

const router = express.Router()

router.post("/signup", async (request, response) => {
    const body = request.body

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return response.status(400).json({ error: "A JSON object is required" })
    }

    const errors = []
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = body.password

    if (Object.keys(body).some(field => !["username", "email", "password"].includes(field))) {
        errors.push("Unexpected fields are not allowed")
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        errors.push("Username must be 3-30 letters, numbers, or underscores")
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("A valid email is required")
    }
    if (typeof password !== "string" || password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72 ||
        !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        errors.push("Password must be at least 8 characters, include a letter and a number, and be at most 72 bytes")
    }

    if (errors.length > 0) {
        return response.status(400).json({ error: "Validation failed", details: errors })
    }

    try {
        const existingUser = await User.exists({ $or: [{ username }, { email }] })
        if (existingUser) {
            return response.status(409).json({ error: "Username or email already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const user = await User.create({ username, email, password: hashedPassword })

        return response.status(201).json({
            message: "User created",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        })
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ error: "Username or email already exists" })
        }

        console.error("Signup failed:", error.name)
        return response.status(500).json({ error: "Internal server error" })
    }
})

module.exports = router
