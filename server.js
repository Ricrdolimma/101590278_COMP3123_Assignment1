require("dotenv").config()

const express = require("express")
const mongoose = require("mongoose")
const helmet = require("helmet")
const { rateLimit } = require("express-rate-limit")
const User = require("./models/User")
const userRoutes = require("./routes/UserRoutes")
const employeeRoutes = require("./routes/EmployeeRoutes")
const { requestLogger, logEvent } = require("./middleware/logger")

const app = express()
const PORT = process.env.PORT || 8081

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many authentication requests. Try again in one minute." }
})

app.use(requestLogger)
app.use(helmet())
app.use(express.json())
app.use("/api/v1/user", authLimiter, userRoutes)
app.use("/api/v1/emp", employeeRoutes)

app.get("/health", (request, response) => {
    response.status(200).json({
        status: "ok",
        message: "API is running"
    })
})

app.use((request, response) => {
    response.status(404).json({ error: "Route not found" })
})

app.use((error, request, response, next) => {
    if (error.type === "entity.parse.failed") {
        return response.status(400).json({ error: "Malformed JSON" })
    }

    console.error("Request failed:", error.name)
    return response.status(500).json({ error: "Internal server error" })
})

if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing from the environment")
    process.exit(1)
}

if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
    console.error("JWT_SECRET must be set to at least 32 bytes")
    process.exit(1)
}

mongoose.connect(process.env.MONGODB_URI, { dbName: "comp3123_assignment1" })
    .then(async () => {
        await User.init()
        console.log("Connected to MongoDB Atlas")
        logEvent("MongoDB connection established")
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`)
            logEvent(`Server startup | port ${PORT}`)
        })
    })
    .catch(() => {
        console.error("Could not connect to MongoDB Atlas. Check the URI, password, and IP access list.")
        logEvent("MongoDB connection error")
        process.exit(1)
    })
