const jwt = require("jsonwebtoken")
const User = require("../models/User")

async function authenticate(request, response, next) {
    const authorization = request.get("Authorization")

    if (!authorization) {
        return response.status(401).json({ error: "Authorization token required" })
    }

    const match = /^Bearer\s+(\S+)$/i.exec(authorization)
    if (!match) {
        return response.status(401).json({ error: "Use Authorization: Bearer <token>" })
    }

    let payload
    try {
        payload = jwt.verify(match[1], process.env.JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "comp3123-assignment1",
            audience: "comp3123-api"
        })
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return response.status(401).json({ error: "Token expired" })
        }
        return response.status(401).json({ error: "Invalid token" })
    }

    if (!payload || typeof payload.sub !== "string" || !/^[a-f\d]{24}$/i.test(payload.sub)) {
        return response.status(401).json({ error: "Invalid token" })
    }

    const userExists = await User.exists({ _id: payload.sub })
    if (!userExists) {
        return response.status(401).json({ error: "Invalid token" })
    }

    request.userId = payload.sub
    next()
}

module.exports = authenticate
