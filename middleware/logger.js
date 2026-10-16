const fs = require("fs")
const path = require("path")

const logDirectory = path.join(__dirname, "..", "logs")
const logFile = path.join(logDirectory, "app.log")

fs.mkdirSync(logDirectory, { recursive: true })

function logEvent(message) {
    fs.appendFile(logFile, `[${new Date().toISOString()}] ${message}\n`, error => {
        if (error) {
            console.error("Could not write application log")
        }
    })
}

function requestLogger(request, response, next) {
    response.on("finish", () => {
        let routePath = "[unmatched route]"
        if (request.route) {
            routePath = `${request.baseUrl}${request.route.path}`
        } else if ([
            "/health", "/api/v1/user/signup", "/api/v1/user/login", "/api/v1/emp/employees"
        ].includes(request.path)) {
            routePath = request.path
        } else if (/^\/api\/v1\/emp\/employees\/[^/]+$/.test(request.path)) {
            routePath = "/api/v1/emp/employees/:eid"
        }
        const status = response.statusCode
        const events = ["API request"]

        if (request.method === "POST" &&
            (request.path === "/api/v1/user/signup" || request.path === "/api/v1/user/login")) {
            events.push("authentication attempt")
        }
        if (status >= 200 && status < 300) events.push("successful operation")
        if (status === 400) events.push("validation failure")
        if (status === 401 || status === 403) events.push("authorization failure")
        if (status === 404 && request.path.startsWith("/api/v1/emp/")) {
            events.push("employee not found or not owned")
        }
        if (status === 429) events.push("rate limit exceeded")
        if (status >= 500) events.push("application error")

        logEvent(`${events.join(", ")} | ${request.method} ${routePath} | ${status}`)
    })

    next()
}

module.exports = { requestLogger, logEvent }
