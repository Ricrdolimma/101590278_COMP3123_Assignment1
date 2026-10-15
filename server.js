require("dotenv").config()

const express = require("express")
const mongoose = require("mongoose")

const app = express()
const PORT = process.env.PORT || 8081

app.use(express.json())

app.get("/health", (request, response) => {
    response.status(200).json({
        status: "ok",
        message: "API is running"
    })
})

if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing from the environment")
    process.exit(1)
}

mongoose.connect(process.env.MONGODB_URI, { dbName: "comp3123_assignment1" })
    .then(() => {
        console.log("Connected to MongoDB Atlas")
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`)
        })
    })
    .catch(() => {
        console.error("Could not connect to MongoDB Atlas. Check the URI, password, and IP access list.")
        process.exit(1)
    })
