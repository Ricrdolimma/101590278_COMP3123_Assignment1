const express = require("express")

const app = express()
const PORT = process.env.PORT || 8081

app.use(express.json())

app.get("/health", (request, response) => {
    response.status(200).json({
        status: "ok",
        message: "API is running"
    })
})

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
